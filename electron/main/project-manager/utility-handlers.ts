import { ipcMain, dialog, shell } from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'
import os from 'node:os'

/**
 * Setup IPC handlers for utility operations
 */
export function setupUtilityHandlers() {
  // Save dropped file to temporary directory
  ipcMain.handle('save-dropped-file', async (_, { fileName, fileBuffer }: { 
    fileName: string, 
    fileBuffer: ArrayBuffer 
  }) => {
    try {
      const tmpDir = os.tmpdir()
      const timestamp = Date.now()
      const ext = path.extname(fileName)
      const tempFileName = `dropped_${timestamp}${ext}`
      const tempFilePath = path.join(tmpDir, tempFileName)
      
      // Write the buffer to a temporary file
      await fs.writeFile(tempFilePath, Buffer.from(fileBuffer))
      
      return { success: true, filePath: tempFilePath }
    } catch (error) {
      console.error('Failed to save dropped file:', error)
      throw error
    }
  })

  // Get file metadata
  ipcMain.handle('get-file-metadata', async (_, filePath: string) => {
    try {
      const stats = await fs.stat(filePath)
      return {
        success: true,
        metadata: {
          fileSize: stats.size,
          dateAdded: stats.birthtime.toISOString(),
          dateModified: stats.mtime.toISOString()
        }
      }
    } catch (error) {
      console.error('Failed to get file metadata:', error)
      return { success: false, error: 'File not found or inaccessible' }
    }
  })

  // Open file dialog to select media files
  ipcMain.handle('select-image-file', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections'],
        filters: [
          { name: 'Media Files', extensions: ['jpg', 'jpeg', 'png', 'mp4', 'webm', 'ogv'] },
          { name: 'Images', extensions: ['jpg', 'jpeg', 'png'] },
          { name: 'Videos', extensions: ['mp4', 'webm', 'ogv'] }
        ]
      })
      
      if (result.canceled || result.filePaths.length === 0) {
        return { canceled: true }
      }
      
      return { canceled: false, filePaths: result.filePaths }
    } catch (error) {
      console.error('Failed to select media file:', error)
      throw error
    }
  })

  // Open folder in system file manager
  ipcMain.handle('open-folder-in-explorer', async (_, folderPath: string) => {
    try {
      const result = await shell.openPath(folderPath)
      if (result) {
        // If result is not empty, it means there was an error
        console.error('Failed to open folder:', result)
        return { success: false, error: result }
      }
      return { success: true }
    } catch (error) {
      console.error('Failed to open folder:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Calculate directory size recursively
  ipcMain.handle('calculate-directory-size', async (_, dirPath: string) => {
    try {
      let totalSize = 0

      async function calculateSize(currentPath: string): Promise<void> {
        try {
          const stats = await fs.stat(currentPath)
          
          if (stats.isFile()) {
            totalSize += stats.size
          } else if (stats.isDirectory()) {
            const entries = await fs.readdir(currentPath)
            await Promise.all(
              entries.map(entry => calculateSize(path.join(currentPath, entry)))
            )
          }
        } catch (error) {
          // Skip files/folders that can't be accessed
          console.warn(`Skipping inaccessible path: ${currentPath}`)
        }
      }

      await calculateSize(dirPath)
      return { success: true, size: totalSize }
    } catch (error) {
      console.error('Failed to calculate directory size:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })
}

