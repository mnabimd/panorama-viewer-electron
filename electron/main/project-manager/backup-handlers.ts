import { ipcMain, dialog, app, BrowserWindow } from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import { randomUUID } from 'node:crypto'
import AdmZip from 'adm-zip'
import archiver from 'archiver'
import { getProjectsDir, getProjectPath } from './file-utils'
import type { ProjectMetadata } from './types'

export function setupBackupHandlers() {
  // Export project
  ipcMain.handle('export-project', async (_, projectId: string) => {
    console.log('[Backup] Handling export-project request for:', projectId)
    try {
      const projectPath = await getProjectPath(projectId)
      
      // Get project name for default filename
      const projectJsonPath = path.join(projectPath, 'project.json')
      const projectJsonContent = await fs.readFile(projectJsonPath, 'utf-8')
      const metadata = JSON.parse(projectJsonContent) as ProjectMetadata
      const defaultFilename = `${metadata.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_backup.zip`

      // Show save dialog
      const window = BrowserWindow.getFocusedWindow()
      const { filePath, canceled } = window 
        ? await dialog.showSaveDialog(window, {
            title: 'Export Project',
            defaultPath: defaultFilename,
            filters: [
              { name: 'ZIP Files', extensions: ['zip'] }
            ]
          })
        : await dialog.showSaveDialog({
            title: 'Export Project',
            defaultPath: defaultFilename,
            filters: [
              { name: 'ZIP Files', extensions: ['zip'] }
            ]
          })

      if (canceled || !filePath) {
        return { canceled: true }
      }

      return new Promise((resolve, reject) => {
        const output = createWriteStream(filePath)
        const archive = archiver('zip', {
          zlib: { level: 9 } // Sets the compression level.
        })

        output.on('close', () => {
          console.log('[Backup] Export completed. Total bytes:', archive.pointer())
          if (window) {
            window.webContents.send('backup:progress', { status: 'completed', percent: 100 })
          }
          resolve({ success: true, filePath })
        })

        archive.on('warning', (err) => {
          if (err.code === 'ENOENT') {
            console.warn('[Backup] Archiver warning:', err)
          } else {
            reject(err)
          }
        })

        archive.on('error', (err) => {
          reject(err)
        })

        // Progress listener
        archive.on('progress', (progress) => {
          const percent = Math.round((progress.fs.processedBytes / progress.fs.totalBytes) * 100)
          if (window) {
            window.webContents.send('backup:progress', { status: 'processing', percent })
          }
        })

        archive.pipe(output)

        // Append files from project directory
        archive.directory(projectPath, false)

        archive.finalize()
      })

    } catch (error) {
      console.error('Failed to export project:', error)
      throw error
    }
  })

  // Import project
  ipcMain.handle('import-project', async () => {
    console.log('[Backup] Handling import-project request')
    try {
      // Show open dialog
      console.log('[Backup] Opening file dialog...')
      const window = BrowserWindow.getFocusedWindow()
      const { filePaths, canceled } = window
        ? await dialog.showOpenDialog(window, {
            title: 'Import Project',
            properties: ['openFile'],
            filters: [
              { name: 'ZIP Files', extensions: ['zip'] }
            ]
          })
        : await dialog.showOpenDialog({
            title: 'Import Project',
            properties: ['openFile'],
            filters: [
              { name: 'ZIP Files', extensions: ['zip'] }
            ]
          })

      if (canceled || filePaths.length === 0) {
        return { canceled: true }
      }

      const zipPath = filePaths[0]
      const projectsDir = await getProjectsDir()

      // Create temp directory for extraction
      const tempDir = await fs.mkdtemp(path.join(app.getPath('temp'), 'project-import-'))
      
      try {
        // Extract zip
        const zip = new AdmZip(zipPath)
        zip.extractAllTo(tempDir, true)

        // Read project.json to validate and get info
        // Note: The zip might contain the project folder at root or the contents directly
        // We need to check both cases
        let projectRoot = tempDir
        const files = await fs.readdir(tempDir)
        
        // If the zip contains a single folder, assume that's the project folder
        if (files.length === 1 && (await fs.stat(path.join(tempDir, files[0]))).isDirectory()) {
            // Check if project.json exists inside
            try {
                await fs.access(path.join(tempDir, files[0], 'project.json'))
                projectRoot = path.join(tempDir, files[0])
            } catch {
                // If not, assume the root is the project root (e.g. zip created from contents)
                 // But wait, if files.length is 1 and it's a dir, but no project.json inside, 
                 // maybe project.json IS the file? No, we checked isDirectory.
                 // Let's stick to: check if project.json is in root, if not check if it's in the single child dir.
                 if (await fileExists(path.join(tempDir, 'project.json'))) {
                     projectRoot = tempDir
                 }
            }
        } else {
             // Multiple files or files+dirs, assume root is project root
             if (!(await fileExists(path.join(tempDir, 'project.json')))) {
                 throw new Error('Invalid project backup: project.json not found')
             }
        }

        const projectJsonPath = path.join(projectRoot, 'project.json')
        const projectJsonContent = await fs.readFile(projectJsonPath, 'utf-8')
        const metadata = JSON.parse(projectJsonContent) as ProjectMetadata

        // Generate new Project ID
        const newProjectId = `prj_${randomUUID().slice(0, 8)}`
        const newProjectDir = path.join(projectsDir, newProjectId)

        // Update metadata with new ID
        metadata.id = newProjectId
        metadata.name = `${metadata.name} (Imported)`
        metadata.updatedAt = new Date().toISOString()

        // Fix absolute paths for scenes and thumbnails
        if (metadata.scenes) {
          metadata.scenes = metadata.scenes.map(scene => {
            // Fix imagePath
            if (scene.imagePath) {
              const fileName = path.basename(scene.imagePath)
              // Assuming standard structure: project/scenes/filename
              scene.imagePath = path.join(newProjectDir, 'scenes', fileName)
            }
            
            // Fix thumbnail path
            if (scene.thumbnail) {
              const thumbName = path.basename(scene.thumbnail)
              // Assuming standard structure: project/thumbnails/filename
              scene.thumbnail = path.join(newProjectDir, 'thumbnails', thumbName)
            }
            return scene
          })
        }

        // Write updated project.json
        await fs.writeFile(projectJsonPath, JSON.stringify(metadata, null, 2), 'utf-8')

        // Move to projects directory
        // We need to move the CONTENTS of projectRoot to newProjectDir
        await fs.mkdir(newProjectDir, { recursive: true })
        await fs.cp(projectRoot, newProjectDir, { recursive: true })

        return { success: true, projectId: newProjectId }
      } finally {
        // Cleanup temp dir
        await fs.rm(tempDir, { recursive: true, force: true })
      }
    } catch (error) {
      console.error('Failed to import project:', error)
      throw error
    }
  })
}

async function fileExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath)
        return true
    } catch {
        return false
    }
}
