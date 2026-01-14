import { ipcMain } from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { getProjectsDir, readProjectMetadata, writeProjectMetadata, getProjectPath } from './file-utils'
import type { CreateProjectParams, ProjectMetadata } from './types'

/**
 * Setup IPC handlers for project-level operations
 */
export function setupProjectHandlers() {
  // Create a new project
  ipcMain.handle('create-project', async (_, params: CreateProjectParams) => {
    try {
      const PROJECTS_DIR = await getProjectsDir()
      const projectId = `prj_${randomUUID().slice(0, 8)}`
      const projectDirName = projectId
      const projectPath = path.join(PROJECTS_DIR, projectDirName)

      // 1. Create directory structure
      await fs.mkdir(projectPath, { recursive: true })
      await fs.mkdir(path.join(projectPath, 'scenes'), { recursive: true })
      await fs.mkdir(path.join(projectPath, 'ui'), { recursive: true })
      await fs.mkdir(path.join(projectPath, 'build'), { recursive: true })

      // 2. Create project.json
      const projectMetadata: ProjectMetadata = {
        id: projectId,
        name: params.name,
        description: params.description || '',
        category: params.category,
        version: '1.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        scenes: [],
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

      // 3. Create default settings.json
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

  // Get all projects
  ipcMain.handle('get-projects', async () => {
    try {
      const PROJECTS_DIR = await getProjectsDir()
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
              path: path.join(PROJECTS_DIR, dir.name)
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

  // Delete a project
  ipcMain.handle('delete-project', async (_, projectPath: string) => {
    try {
      await fs.rm(projectPath, { recursive: true, force: true })
      return { success: true }
    } catch (error) {
      console.error('Failed to delete project:', error)
      throw error
    }
  })

  // Get project by ID
  ipcMain.handle('get-project-by-id', async (_, projectId: string) => {
    try {
      const PROJECTS_DIR = await getProjectsDir()
      const projectPath = path.join(PROJECTS_DIR, projectId)
      const projectJsonPath = path.join(projectPath, 'project.json')
      
      try {
        const projectJsonContent = await fs.readFile(projectJsonPath, 'utf-8')
        const metadata = JSON.parse(projectJsonContent)
        return {
          ...metadata,
          path: projectPath
        }
      } catch (e) {
        console.warn(`Failed to read project ${projectId}:`, e)
        return null
      }
    } catch (error) {
      console.error('Failed to get project:', error)
      throw error
    }
  })

  // Rename a project
  ipcMain.handle('rename-project', async (_, { projectId, newName }: { projectId: string, newName: string }) => {
    try {
      const metadata = await readProjectMetadata(projectId)
      
      const updatedMetadata = {
        ...metadata,
        name: newName,
        updatedAt: new Date().toISOString()
      }
      
      await writeProjectMetadata(projectId, updatedMetadata)
      
      return { success: true, project: updatedMetadata }
    } catch (error) {
      console.error('Failed to rename project:', error)
      throw error
    }
  })

  // Update project description
  ipcMain.handle('update-project-description', async (_, { projectId, description }: { projectId: string, description: string }) => {
    try {
      const metadata = await readProjectMetadata(projectId)
      
      const updatedMetadata = {
        ...metadata,
        description: description,
        updatedAt: new Date().toISOString()
      }
      
      await writeProjectMetadata(projectId, updatedMetadata)
      
      return { success: true, project: updatedMetadata }
    } catch (error) {
      console.error('Failed to update project description:', error)
      throw error
    }
  })

  // Check category usage
  ipcMain.handle('check-category-usage', async (_, categoryId: string) => {
    try {
      const PROJECTS_DIR = await getProjectsDir()
      // Ensure projects directory exists
      await fs.mkdir(PROJECTS_DIR, { recursive: true })

      const entries = await fs.readdir(PROJECTS_DIR, { withFileTypes: true })
      const projectDirs = entries.filter(entry => entry.isDirectory())

      let count = 0
      
      for (const dir of projectDirs) {
        try {
          const projectJsonPath = path.join(PROJECTS_DIR, dir.name, 'project.json')
          const projectJsonContent = await fs.readFile(projectJsonPath, 'utf-8')
          const metadata = JSON.parse(projectJsonContent)
          
          if (metadata.category === categoryId) {
            count++
          }
        } catch (e) {
          // Ignore errors reading individual projects
        }
      }

      return { success: true, count }
    } catch (error) {
      console.error('Failed to check category usage:', error)
      throw error
    }
  })

  // Update projects category (bulk or single)
  ipcMain.handle('update-projects-category', async (_, { oldCategoryId, newCategoryId }: { oldCategoryId: string, newCategoryId: string }) => {
    try {
      const PROJECTS_DIR = await getProjectsDir()
      const entries = await fs.readdir(PROJECTS_DIR, { withFileTypes: true })
      const projectDirs = entries.filter(entry => entry.isDirectory())
      
      let updatedCount = 0

      for (const dir of projectDirs) {
        try {
          const projectJsonPath = path.join(PROJECTS_DIR, dir.name, 'project.json')
          const projectJsonContent = await fs.readFile(projectJsonPath, 'utf-8')
          const metadata = JSON.parse(projectJsonContent)
          
          if (metadata.category === oldCategoryId) {
            const updatedMetadata = {
              ...metadata,
              category: newCategoryId,
              updatedAt: new Date().toISOString()
            }
            
            await fs.writeFile(projectJsonPath, JSON.stringify(updatedMetadata, null, 2), 'utf-8')
            updatedCount++
          }
        } catch (e) {
          console.warn(`Failed to update project in ${dir.name}:`, e)
        }
      }

      return { success: true, updatedCount }
    } catch (error) {
      console.error('Failed to update projects category:', error)
      throw error
    }
  })
}
