import { ipcMain, app } from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'
import os from 'node:os'
import { randomUUID } from 'node:crypto'

const PROJECTS_DIR = path.join(app.getPath('documents'), 'ABNabi360', 'projects')

interface CreateProjectParams {
  name: string
  description?: string
  category?: string
  coverImagePath?: string
}

interface ProjectMetadata {
  id: string
  name: string
  description: string
  category?: string
  version: string
  createdAt: string
  updatedAt: string
  mainScene?: string
  scenes: Record<string, any>
  settings: {
    autoRotate: boolean
    initialFov: number
  }
}

export function setupProjectHandlers() {
  ipcMain.handle('create-project', async (_, params: CreateProjectParams) => {
    try {
      const projectId = `prj_${randomUUID().slice(0, 8)}`
      const projectDirName = projectId
      const projectPath = path.join(PROJECTS_DIR, projectDirName)

      // 1. Create directory structure
      await fs.mkdir(projectPath, { recursive: true })
      await fs.mkdir(path.join(projectPath, 'thumbnails'), { recursive: true })
      await fs.mkdir(path.join(projectPath, 'scenes'), { recursive: true })
      await fs.mkdir(path.join(projectPath, 'ui'), { recursive: true })
      await fs.mkdir(path.join(projectPath, 'build'), { recursive: true })

      // 2. Handle cover image if provided
      // Note: In a real app, we might want to resize/optimize this
      if (params.coverImagePath) {
        const ext = path.extname(params.coverImagePath)
        const destPath = path.join(projectPath, 'thumbnails', `cover${ext}`)
        await fs.copyFile(params.coverImagePath, destPath)
      }

      // 3. Create project.json
      const projectMetadata: ProjectMetadata = {
        id: projectId,
        name: params.name,
        description: params.description || '',
        category: params.category,
        version: '1.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        scenes: {},
        settings: {
          autoRotate: false,
          initialFov: 75
        }
      }

      await fs.writeFile(
        path.join(projectPath, 'project.json'),
        JSON.stringify(projectMetadata, null, 2),
        'utf-8'
      )

      // 4. Create default settings.json
      const viewerSettings = {
        theme: 'dark',
        showControls: true
      }
      
      await fs.writeFile(
        path.join(projectPath, 'ui', 'settings.json'),
        JSON.stringify(viewerSettings, null, 2),
        'utf-8'
      )

      return { success: true, projectId, path: projectPath }
    } catch (error) {
      console.error('Failed to create project:', error)
      throw error
    }
  })

  ipcMain.handle('get-projects', async () => {
    try {
      // Ensure projects directory exists
      await fs.mkdir(PROJECTS_DIR, { recursive: true })

      const entries = await fs.readdir(PROJECTS_DIR, { withFileTypes: true })
      const projectDirs = entries.filter(entry => entry.isDirectory())

      const projects = await Promise.all(
        projectDirs.map(async (dir) => {
          try {
            const projectJsonPath = path.join(PROJECTS_DIR, dir.name, 'project.json')
            const projectJsonContent = await fs.readFile(projectJsonPath, 'utf-8')
            const metadata = JSON.parse(projectJsonContent)
            return {
              ...metadata,
              path: path.join(PROJECTS_DIR, dir.name),
              // Add cover image path if it exists
              cover: path.join(PROJECTS_DIR, dir.name, 'thumbnails', 'cover.jpg') // Simplified assumption, might need check
            }
          } catch (e) {
            console.warn(`Failed to read project in ${dir.name}:`, e)
            return null
          }
        })
      )

      return projects.filter(p => p !== null)
    } catch (error) {
      console.error('Failed to get projects:', error)
      throw error
    }
  })
}
