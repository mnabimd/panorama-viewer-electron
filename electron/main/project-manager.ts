import { ipcMain, app, dialog } from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'
import os from 'node:os'
import { randomUUID } from 'node:crypto'
import { getWorkspacePath } from './settings-manager'
import sharp from 'sharp'

/**
 * Generate a thumbnail from an image file
 * @param sourcePath - Path to the source image
 * @param destPath - Path where thumbnail should be saved
 * @param width - Target width in pixels (height will be calculated to maintain aspect ratio)
 * @returns Path to the generated thumbnail
 */
async function generateThumbnail(
  sourcePath: string, 
  destPath: string, 
  width: number = 400
): Promise<string> {
  try {
    await sharp(sourcePath)
      .resize(width, null, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 80 })
      .toFile(destPath)
    
    return destPath
  } catch (error) {
    console.error('Failed to generate thumbnail:', error)
    throw error
  }
}


/**
 * Get the projects directory from current workspace settings
 */
async function getProjectsDir(): Promise<string> {
  const workspacePath = await getWorkspacePath()
  return path.join(workspacePath, 'projects')
}

interface CreateProjectParams {
  name: string
  description?: string
  category?: string
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
  isVisible?: boolean  // Controls visibility in viewer (default: true)
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
  isFeatured?: boolean  // Marks the scene as featured/indexed (only one can be featured)
  coordinates?: [number, number]  // GPS coordinates [longitude, latitude]
  bearing?: number  // Orientation/direction in degrees (0-360)
  metadata?: {
    fileSize?: number  // File size in bytes
    dateAdded?: string  // ISO date string when scene was added
  }
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

  ipcMain.handle('rename-project', async (_, { projectId, newName }: { projectId: string, newName: string }) => {
    try {
      const PROJECTS_DIR = await getProjectsDir()
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
      const PROJECTS_DIR = await getProjectsDir()
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
      const PROJECTS_DIR = await getProjectsDir()
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
      const PROJECTS_DIR = await getProjectsDir()
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
      const PROJECTS_DIR = await getProjectsDir()
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

  ipcMain.handle('add-scene', async (_, { projectId, sceneName, imagePath, isNewUpload }: { 
    projectId: string, 
    sceneName: string, 
    imagePath: string,
    isNewUpload?: boolean
  }) => {
    try {
      const PROJECTS_DIR = await getProjectsDir()
      const projectPath = path.join(PROJECTS_DIR, projectId)
      const projectJsonPath = path.join(projectPath, 'project.json')
      
      const projectJsonContent = await fs.readFile(projectJsonPath, 'utf-8')
      const metadata: ProjectMetadata = JSON.parse(projectJsonContent)
      
      let finalImagePath = imagePath
      
      // If it's a new upload (external file), copy it to the project's scenes folder
      if (isNewUpload) {
        const scenesDir = path.join(projectPath, 'scenes')
        
        // Ensure scenes directory exists
        try {
          await fs.access(scenesDir)
        } catch {
          await fs.mkdir(scenesDir, { recursive: true })
        }
        
        // Generate unique filename
        const ext = path.extname(imagePath)
        const newFileName = `scene_${randomUUID().slice(0, 8)}${ext}`
        const destPath = path.join(scenesDir, newFileName)
        
        // Copy the file
        await fs.copyFile(imagePath, destPath)
        
        // Use relative path from project root
        finalImagePath = destPath
      }
      
      
      // Get file metadata
      let fileMetadata: { fileSize?: number; dateAdded?: string } = {}
      try {
        const stats = await fs.stat(finalImagePath)
        fileMetadata = {
          fileSize: stats.size,
          dateAdded: new Date().toISOString()
        }
      } catch (e) {
        console.warn('Could not get file metadata:', e)
      }
      
      // Generate thumbnail
      let thumbnailPath: string | undefined
      try {
        const thumbnailsDir = path.join(projectPath, 'thumbnails')
        
        // Ensure thumbnails directory exists
        try {
          await fs.access(thumbnailsDir)
        } catch {
          await fs.mkdir(thumbnailsDir, { recursive: true })
        }
        
        // Generate unique thumbnail filename
        const ext = path.extname(finalImagePath)
        const thumbnailFileName = `thumb_${randomUUID().slice(0, 8)}.jpg`
        const thumbnailDestPath = path.join(thumbnailsDir, thumbnailFileName)
        
        // Generate thumbnail (400px wide, maintaining aspect ratio)
        await generateThumbnail(finalImagePath, thumbnailDestPath, 400)
        thumbnailPath = thumbnailDestPath
      } catch (e) {
        console.warn('Could not generate thumbnail:', e)
        // Continue without thumbnail if generation fails
      }
      
      // Create new scene
      const newScene: Scene = {
        id: `scene_${randomUUID().slice(0, 8)}`,
        name: sceneName,
        imagePath: finalImagePath,
        hotspots: [],
        isVisible: true,
        isFeatured: metadata.scenes.length === 0, // Mark first scene as featured
        thumbnail: thumbnailPath,
        metadata: fileMetadata
      }

      
      // Add scene to project
      if (!Array.isArray(metadata.scenes)) {
        metadata.scenes = []
      }
      metadata.scenes.push(newScene)
      metadata.updatedAt = new Date().toISOString()
      
      await fs.writeFile(
        projectJsonPath,
        JSON.stringify(metadata, null, 2),
        'utf-8'
      )
      
      return { success: true, scene: newScene }
    } catch (error) {
      console.error('Failed to add scene:', error)
      throw error
    }
  })

  ipcMain.handle('rename-scene', async (_, { projectId, sceneId, newName }: { 
    projectId: string, 
    sceneId: string, 
    newName: string 
  }) => {
    try {
      const PROJECTS_DIR = await getProjectsDir()
      const projectPath = path.join(PROJECTS_DIR, projectId)
      const projectJsonPath = path.join(projectPath, 'project.json')
      
      const projectJsonContent = await fs.readFile(projectJsonPath, 'utf-8')
      const metadata: ProjectMetadata = JSON.parse(projectJsonContent)
      
      // Find the scene
      const sceneIndex = metadata.scenes.findIndex(s => s.id === sceneId)
      if (sceneIndex === -1) {
        throw new Error('Scene not found')
      }
      
      // Update scene name
      metadata.scenes[sceneIndex].name = newName
      metadata.updatedAt = new Date().toISOString()
      
      await fs.writeFile(
        projectJsonPath,
        JSON.stringify(metadata, null, 2),
        'utf-8'
      )
      
      return { success: true, scene: metadata.scenes[sceneIndex] }
    } catch (error) {
      console.error('Failed to rename scene:', error)
      throw error
    }
  })

  ipcMain.handle('delete-scene', async (_, { projectId, sceneId }: { 
    projectId: string, 
    sceneId: string 
  }) => {
    try {
      const PROJECTS_DIR = await getProjectsDir()
      const projectPath = path.join(PROJECTS_DIR, projectId)
      const projectJsonPath = path.join(projectPath, 'project.json')
      
      const projectJsonContent = await fs.readFile(projectJsonPath, 'utf-8')
      const metadata: ProjectMetadata = JSON.parse(projectJsonContent)
      
      // Find the scene
      const sceneIndex = metadata.scenes.findIndex(s => s.id === sceneId)
      if (sceneIndex === -1) {
        throw new Error('Scene not found')
      }
      
      // Get the scene's image path before removing it
      const sceneImagePath = metadata.scenes[sceneIndex].imagePath
      const wasFeatured = metadata.scenes[sceneIndex].isFeatured
      
      // Remove scene from array
      metadata.scenes.splice(sceneIndex, 1)
      metadata.updatedAt = new Date().toISOString()
      
      // If the deleted scene was featured, make the first remaining scene featured
      if (wasFeatured && metadata.scenes.length > 0) {
        metadata.scenes[0].isFeatured = true
      }
      
      // Save updated metadata
      await fs.writeFile(
        projectJsonPath,
        JSON.stringify(metadata, null, 2),
        'utf-8'
      )
      
      // Try to delete the scene image file (optional, don't fail if it doesn't exist)
      try {
        await fs.unlink(sceneImagePath)
      } catch (e) {
        console.warn('Could not delete scene image file:', e)
      }
      
      return { success: true }
    } catch (error) {
      console.error('Failed to delete scene:', error)
      throw error
    }
  })

  ipcMain.handle('toggle-all-hotspots-visibility', async (_, { projectId, sceneId, isVisible }: { 
    projectId: string, 
    sceneId: string,
    isVisible: boolean 
  }) => {
    try {
      const PROJECTS_DIR = await getProjectsDir()
      const projectPath = path.join(PROJECTS_DIR, projectId)
      const projectJsonPath = path.join(projectPath, 'project.json')
      
      const projectJsonContent = await fs.readFile(projectJsonPath, 'utf-8')
      const metadata: ProjectMetadata = JSON.parse(projectJsonContent)
      
      // Find the scene
      const sceneIndex = metadata.scenes.findIndex(s => s.id === sceneId)
      if (sceneIndex === -1) {
        throw new Error('Scene not found')
      }
      
      // Update visibility for all hotspots in the scene
      metadata.scenes[sceneIndex].hotspots = metadata.scenes[sceneIndex].hotspots.map(hotspot => ({
        ...hotspot,
        isVisible: isVisible
      }))
      
      metadata.updatedAt = new Date().toISOString()
      
      await fs.writeFile(
        projectJsonPath,
        JSON.stringify(metadata, null, 2),
        'utf-8'
      )
      
      return { success: true, scene: metadata.scenes[sceneIndex] }
    } catch (error) {
      console.error('Failed to toggle hotspots visibility:', error)
      throw error
    }
  })

  ipcMain.handle('replace-scene-image', async (_, { projectId, sceneId, newImagePath, isNewUpload }: { 
    projectId: string, 
    sceneId: string,
    newImagePath: string,
    isNewUpload: boolean
  }) => {
    try {
      const PROJECTS_DIR = await getProjectsDir()
      const projectPath = path.join(PROJECTS_DIR, projectId)
      const projectJsonPath = path.join(projectPath, 'project.json')
      
      const projectJsonContent = await fs.readFile(projectJsonPath, 'utf-8')
      const metadata: ProjectMetadata = JSON.parse(projectJsonContent)
      
      // Find the scene
      const sceneIndex = metadata.scenes.findIndex(s => s.id === sceneId)
      if (sceneIndex === -1) {
        throw new Error('Scene not found')
      }
      
      const oldImagePath = metadata.scenes[sceneIndex].imagePath
      let finalImagePath = newImagePath
      
      // If it's a new upload (external file), copy it to the project's scenes folder
      if (isNewUpload) {
        const scenesDir = path.join(projectPath, 'scenes')
        
        // Ensure scenes directory exists
        try {
          await fs.access(scenesDir)
        } catch {
          await fs.mkdir(scenesDir, { recursive: true })
        }
        
        // Generate unique filename
        const ext = path.extname(newImagePath)
        const newFileName = `scene_${randomUUID().slice(0, 8)}${ext}`
        const destPath = path.join(scenesDir, newFileName)
        
        // Copy the file
        await fs.copyFile(newImagePath, destPath)
        
        // Use the new path
        finalImagePath = destPath
      }
      
      // Regenerate thumbnail for the new image
      const oldThumbnailPath = metadata.scenes[sceneIndex].thumbnail
      let newThumbnailPath: string | undefined
      try {
        const thumbnailsDir = path.join(projectPath, 'thumbnails')
        
        // Ensure thumbnails directory exists
        try {
          await fs.access(thumbnailsDir)
        } catch {
          await fs.mkdir(thumbnailsDir, { recursive: true })
        }
        
        // Generate unique thumbnail filename
        const thumbnailFileName = `thumb_${randomUUID().slice(0, 8)}.jpg`
        const thumbnailDestPath = path.join(thumbnailsDir, thumbnailFileName)
        
        // Generate thumbnail (400px wide, maintaining aspect ratio)
        await generateThumbnail(finalImagePath, thumbnailDestPath, 400)
        newThumbnailPath = thumbnailDestPath
        
        // Delete old thumbnail if it exists
        if (oldThumbnailPath) {
          try {
            await fs.unlink(oldThumbnailPath)
          } catch (e) {
            console.warn('Could not delete old thumbnail:', e)
          }
        }
      } catch (e) {
        console.warn('Could not generate thumbnail:', e)
        // Continue without thumbnail if generation fails
      }
      
      // Update scene image path and thumbnail
      metadata.scenes[sceneIndex].imagePath = finalImagePath
      metadata.scenes[sceneIndex].thumbnail = newThumbnailPath
      metadata.updatedAt = new Date().toISOString()
      
      await fs.writeFile(
        projectJsonPath,
        JSON.stringify(metadata, null, 2),
        'utf-8'
      )
      
      // Try to delete the old image file (optional, don't fail if it doesn't exist)
      // Only delete if it was a unique image (not shared with other scenes)
      if (isNewUpload) {
        const isImageUsedByOtherScenes = metadata.scenes.some(
          (s, idx) => idx !== sceneIndex && s.imagePath === oldImagePath
        )
        
        if (!isImageUsedByOtherScenes) {
          try {
            await fs.unlink(oldImagePath)
          } catch (e) {
            console.warn('Could not delete old scene image file:', e)
          }
        }
      }

      
      return { success: true, scene: metadata.scenes[sceneIndex] }
    } catch (error) {
      console.error('Failed to replace scene image:', error)
      throw error
    }
  })

  ipcMain.handle('toggle-featured-scene', async (_, { projectId, sceneId, isFeatured }: { 
    projectId: string, 
    sceneId: string,
    isFeatured: boolean 
  }) => {
    try {
      const PROJECTS_DIR = await getProjectsDir()
      const projectPath = path.join(PROJECTS_DIR, projectId)
      const projectJsonPath = path.join(projectPath, 'project.json')
      
      const projectJsonContent = await fs.readFile(projectJsonPath, 'utf-8')
      const metadata: ProjectMetadata = JSON.parse(projectJsonContent)
      
      // Find the scene
      const sceneIndex = metadata.scenes.findIndex(s => s.id === sceneId)
      if (sceneIndex === -1) {
        throw new Error('Scene not found')
      }
      
      // If marking as featured, unfeature all other scenes (only one can be featured)
      if (isFeatured) {
        metadata.scenes.forEach((scene, idx) => {
          if (idx !== sceneIndex) {
            scene.isFeatured = false
          }
        })
      }
      
      // Update the target scene
      metadata.scenes[sceneIndex].isFeatured = isFeatured
      metadata.updatedAt = new Date().toISOString()
      
      await fs.writeFile(
        projectJsonPath,
        JSON.stringify(metadata, null, 2),
        'utf-8'
      )
      
      return { success: true, scene: metadata.scenes[sceneIndex] }
    } catch (error) {
      console.error('Failed to toggle featured scene:', error)
      throw error
    }
  })

  ipcMain.handle('update-scene-coordinates', async (_, { projectId, sceneId, coordinates }: { 
    projectId: string, 
    sceneId: string,
    coordinates?: [number, number]
  }) => {
    try {
      const PROJECTS_DIR = await getProjectsDir()
      const projectPath = path.join(PROJECTS_DIR, projectId)
      const projectJsonPath = path.join(projectPath, 'project.json')
      
      const projectJsonContent = await fs.readFile(projectJsonPath, 'utf-8')
      const metadata: ProjectMetadata = JSON.parse(projectJsonContent)
      
      // Find the scene
      const sceneIndex = metadata.scenes.findIndex(s => s.id === sceneId)
      if (sceneIndex === -1) {
        throw new Error('Scene not found')
      }
      
      // Update coordinates
      metadata.scenes[sceneIndex].coordinates = coordinates
      metadata.updatedAt = new Date().toISOString()
      
      await fs.writeFile(
        projectJsonPath,
        JSON.stringify(metadata, null, 2),
        'utf-8'
      )
      
      return { success: true, scene: metadata.scenes[sceneIndex] }
    } catch (error) {
      console.error('Failed to update scene coordinates:', error)
      throw error
    }
  })

  ipcMain.handle('update-scene-bearing', async (_, { projectId, sceneId, bearing }: { 
    projectId: string, 
    sceneId: string,
    bearing?: number
  }) => {
    try {
      const PROJECTS_DIR = await getProjectsDir()
      const projectPath = path.join(PROJECTS_DIR, projectId)
      const projectJsonPath = path.join(projectPath, 'project.json')
      
      const projectJsonContent = await fs.readFile(projectJsonPath, 'utf-8')
      const metadata: ProjectMetadata = JSON.parse(projectJsonContent)
      
      // Find the scene
      const sceneIndex = metadata.scenes.findIndex(s => s.id === sceneId)
      if (sceneIndex === -1) {
        throw new Error('Scene not found')
      }
      
      // Update bearing
      metadata.scenes[sceneIndex].bearing = bearing
      metadata.updatedAt = new Date().toISOString()
      
      await fs.writeFile(
        projectJsonPath,
        JSON.stringify(metadata, null, 2),
        'utf-8'
      )
      
      return { success: true, scene: metadata.scenes[sceneIndex] }
    } catch (error) {
      console.error('Failed to update scene bearing:', error)
      throw error
    }
  })

  ipcMain.handle('toggle-hotspot-visibility', async (_, { projectId, sceneId, hotspotId, isVisible }: { 
    projectId: string, 
    sceneId: string,
    hotspotId: string,
    isVisible: boolean 
  }) => {
    try {
      const PROJECTS_DIR = await getProjectsDir()
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
      
      // Update visibility for the specific hotspot
      metadata.scenes[sceneIndex].hotspots[hotspotIndex] = {
        ...metadata.scenes[sceneIndex].hotspots[hotspotIndex],
        isVisible: isVisible
      } as Hotspot
      
      metadata.updatedAt = new Date().toISOString()
      
      await fs.writeFile(
        projectJsonPath,
        JSON.stringify(metadata, null, 2),
        'utf-8'
      )
      
      return { success: true, hotspot: metadata.scenes[sceneIndex].hotspots[hotspotIndex] }
    } catch (error) {
      console.error('Failed to toggle hotspot visibility:', error)
      throw error
    }
  })

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

  ipcMain.handle('select-image-file', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections'],
        filters: [
          { name: 'Images', extensions: ['jpg', 'jpeg'] }
        ]
      })
      
      if (result.canceled || result.filePaths.length === 0) {
        return { canceled: true }
      }
      
      return { canceled: false, filePaths: result.filePaths }
    } catch (error) {
      console.error('Failed to select image file:', error)
      throw error
    }
  })
  ipcMain.handle('toggle-scene-visibility', async (_, { projectId, sceneId, isVisible }: { 
    projectId: string, 
    sceneId: string,
    isVisible: boolean 
  }) => {
    try {
      const PROJECTS_DIR = await getProjectsDir()
      const projectPath = path.join(PROJECTS_DIR, projectId)
      const projectJsonPath = path.join(projectPath, 'project.json')
      
      const projectJsonContent = await fs.readFile(projectJsonPath, 'utf-8')
      const metadata: ProjectMetadata = JSON.parse(projectJsonContent)
      
      // Find the scene
      const sceneIndex = metadata.scenes.findIndex(s => s.id === sceneId)
      if (sceneIndex === -1) {
        throw new Error('Scene not found')
      }
      
      // Update scene visibility
      metadata.scenes[sceneIndex].isVisible = isVisible
      metadata.updatedAt = new Date().toISOString()
      
      await fs.writeFile(
        projectJsonPath,
        JSON.stringify(metadata, null, 2),
        'utf-8'
      )
      
      return { success: true, scene: metadata.scenes[sceneIndex] }
    } catch (error) {
      console.error('Failed to toggle scene visibility:', error)
      throw error
    }
  })
}
