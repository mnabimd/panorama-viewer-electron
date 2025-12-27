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

// Hotspot types
type HotspotType = 'scene' | 'info' | 'url'

interface BaseHotspot {
  id: string
  type: HotspotType
  position: {
    yaw: number    // Horizontal rotation in degrees
    pitch: number  // Vertical rotation in degrees
  }
  tooltip?: string
}

interface SceneHotspot extends BaseHotspot {
  type: 'scene'
  targetSceneId: string
  transition?: 'fade' | 'slide' | 'none'
}

interface InfoHotspot extends BaseHotspot {
  type: 'info'
  title: string
  content: string
  imageUrl?: string
}

interface UrlHotspot extends BaseHotspot {
  type: 'url'
  url: string
  openInNewTab?: boolean
}

type Hotspot = SceneHotspot | InfoHotspot | UrlHotspot

// Scene interface
interface Scene {
  id: string
  name: string
  imagePath: string
  hotspots: Hotspot[]
  thumbnail?: string
  description?: string
  isVisible?: boolean  // Controls visibility in sidebar (default: true)
}

interface ProjectMetadata {
  id: string
  name: string
  description: string
  category?: string
  version: string
  createdAt: string
  updatedAt: string
  mainSceneId?: string
  scenes: Scene[]
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

  ipcMain.handle('delete-project', async (_, projectPath: string) => {
    try {
      await fs.rm(projectPath, { recursive: true, force: true })
      return { success: true }
    } catch (error) {
      console.error('Failed to delete project:', error)
      throw error
    }
  })

  ipcMain.handle('get-project-by-id', async (_, projectId: string) => {
    try {
      const projectPath = path.join(PROJECTS_DIR, projectId)
      const projectJsonPath = path.join(projectPath, 'project.json')
      
      try {
        const projectJsonContent = await fs.readFile(projectJsonPath, 'utf-8')
        const metadata = JSON.parse(projectJsonContent)
        return {
          ...metadata,
          path: projectPath,
          cover: path.join(projectPath, 'thumbnails', 'cover.jpg')
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

  ipcMain.handle('rename-project', async (_, { projectId, newName }: { projectId: string, newName: string }) => {
    try {
      const projectPath = path.join(PROJECTS_DIR, projectId)
      const projectJsonPath = path.join(projectPath, 'project.json')
      
      const projectJsonContent = await fs.readFile(projectJsonPath, 'utf-8')
      const metadata = JSON.parse(projectJsonContent)
      
      const updatedMetadata = {
        ...metadata,
        name: newName,
        updatedAt: new Date().toISOString()
      }
      
      await fs.writeFile(
        projectJsonPath,
        JSON.stringify(updatedMetadata, null, 2),
        'utf-8'
      )
      
      return { success: true, project: updatedMetadata }
    } catch (error) {
      console.error('Failed to rename project:', error)
      throw error
    }
  })

  ipcMain.handle('add-hotspot', async (_, { projectId, sceneId, hotspotData }: { 
    projectId: string, 
    sceneId: string, 
    hotspotData: Omit<Hotspot, 'id'> 
  }) => {
    try {
      const projectPath = path.join(PROJECTS_DIR, projectId)
      const projectJsonPath = path.join(projectPath, 'project.json')
      
      const projectJsonContent = await fs.readFile(projectJsonPath, 'utf-8')
      const metadata: ProjectMetadata = JSON.parse(projectJsonContent)
      
      // Find the scene
      const sceneIndex = metadata.scenes.findIndex(s => s.id === sceneId)
      if (sceneIndex === -1) {
        throw new Error('Scene not found')
      }
      
      // Create new hotspot with generated ID
      const newHotspot: Hotspot = {
        ...hotspotData,
        id: `hotspot_${randomUUID().slice(0, 8)}`
      } as Hotspot
      
      // Add hotspot to scene
      metadata.scenes[sceneIndex].hotspots.push(newHotspot)
      metadata.updatedAt = new Date().toISOString()
      
      await fs.writeFile(
        projectJsonPath,
        JSON.stringify(metadata, null, 2),
        'utf-8'
      )
      
      return { success: true, hotspot: newHotspot, scene: metadata.scenes[sceneIndex] }
    } catch (error) {
      console.error('Failed to add hotspot:', error)
      throw error
    }
  })

  ipcMain.handle('update-hotspot', async (_, { projectId, sceneId, hotspotId, hotspotData }: { 
    projectId: string, 
    sceneId: string, 
    hotspotId: string,
    hotspotData: Partial<Hotspot> 
  }) => {
    try {
      const projectPath = path.join(PROJECTS_DIR, projectId)
      const projectJsonPath = path.join(projectPath, 'project.json')
      
      const projectJsonContent = await fs.readFile(projectJsonPath, 'utf-8')
      const metadata: ProjectMetadata = JSON.parse(projectJsonContent)
      
      // Find the scene
      const sceneIndex = metadata.scenes.findIndex(s => s.id === sceneId)
      if (sceneIndex === -1) {
        throw new Error('Scene not found')
      }
      
      // Find and update the hotspot
      const hotspotIndex = metadata.scenes[sceneIndex].hotspots.findIndex(h => h.id === hotspotId)
      if (hotspotIndex === -1) {
        throw new Error('Hotspot not found')
      }
      
      metadata.scenes[sceneIndex].hotspots[hotspotIndex] = {
        ...metadata.scenes[sceneIndex].hotspots[hotspotIndex],
        ...hotspotData,
        id: hotspotId // Preserve the ID
      } as Hotspot
      
      metadata.updatedAt = new Date().toISOString()
      
      await fs.writeFile(
        projectJsonPath,
        JSON.stringify(metadata, null, 2),
        'utf-8'
      )
      
      return { success: true, hotspot: metadata.scenes[sceneIndex].hotspots[hotspotIndex], scene: metadata.scenes[sceneIndex] }
    } catch (error) {
      console.error('Failed to update hotspot:', error)
      throw error
    }
  })

  ipcMain.handle('delete-hotspot', async (_, { projectId, sceneId, hotspotId }: { 
    projectId: string, 
    sceneId: string, 
    hotspotId: string 
  }) => {
    try {
      const projectPath = path.join(PROJECTS_DIR, projectId)
      const projectJsonPath = path.join(projectPath, 'project.json')
      
      const projectJsonContent = await fs.readFile(projectJsonPath, 'utf-8')
      const metadata: ProjectMetadata = JSON.parse(projectJsonContent)
      
      // Find the scene
      const sceneIndex = metadata.scenes.findIndex(s => s.id === sceneId)
      if (sceneIndex === -1) {
        throw new Error('Scene not found')
      }
      
      // Filter out the hotspot
      metadata.scenes[sceneIndex].hotspots = metadata.scenes[sceneIndex].hotspots.filter(
        h => h.id !== hotspotId
      )
      
      metadata.updatedAt = new Date().toISOString()
      
      await fs.writeFile(
        projectJsonPath,
        JSON.stringify(metadata, null, 2),
        'utf-8'
      )
      
      return { success: true, scene: metadata.scenes[sceneIndex] }
    } catch (error) {
      console.error('Failed to delete hotspot:', error)
      throw error
    }
  })

  ipcMain.handle('delete-all-hotspots', async (_, { projectId, sceneId }: { 
    projectId: string, 
    sceneId: string 
  }) => {
    try {
      const projectPath = path.join(PROJECTS_DIR, projectId)
      const projectJsonPath = path.join(projectPath, 'project.json')
      
      const projectJsonContent = await fs.readFile(projectJsonPath, 'utf-8')
      const metadata: ProjectMetadata = JSON.parse(projectJsonContent)
      
      // Find the scene
      const sceneIndex = metadata.scenes.findIndex(s => s.id === sceneId)
      if (sceneIndex === -1) {
        throw new Error('Scene not found')
      }
      
      // Clear all hotspots
      metadata.scenes[sceneIndex].hotspots = []
      metadata.updatedAt = new Date().toISOString()
      
      await fs.writeFile(
        projectJsonPath,
        JSON.stringify(metadata, null, 2),
        'utf-8'
      )
      
      return { success: true, scene: metadata.scenes[sceneIndex] }
    } catch (error) {
      console.error('Failed to delete all hotspots:', error)
      throw error
    }
  })
}
