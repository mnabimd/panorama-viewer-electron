import { ipcMain } from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { readProjectMetadata, writeProjectMetadata, getProjectPath, ensureDirectory } from './file-utils'
import { getMediaType, generateThumbnail, generateVideoThumbnail } from './media-processor'
import type { Scene } from './types'

/**
 * Setup IPC handlers for scene operations
 */
export function setupSceneHandlers() {
  // Add a new scene to a project
  ipcMain.handle('add-scene', async (_, { projectId, sceneName, imagePath, isNewUpload }: { 
    projectId: string, 
    sceneName: string, 
    imagePath: string,
    isNewUpload?: boolean
  }) => {
    try {
      const projectPath = await getProjectPath(projectId)
      const metadata = await readProjectMetadata(projectId)
      
      let finalImagePath = imagePath
      
      // If it's a new upload (external file), copy it to the project's scenes folder
      if (isNewUpload) {
        const scenesDir = path.join(projectPath, 'scenes')
        await ensureDirectory(scenesDir)
        
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
      
      // Detect media type
      const mediaType = getMediaType(finalImagePath)
      
      // Generate thumbnail
      let thumbnailPath: string | undefined
      try {
        const thumbnailsDir = path.join(projectPath, 'thumbnails')
        await ensureDirectory(thumbnailsDir)
        
        // Generate unique thumbnail filename
        const thumbnailFileName = `thumb_${randomUUID().slice(0, 8)}.jpg`
        const thumbnailDestPath = path.join(thumbnailsDir, thumbnailFileName)
        
        // Generate thumbnail based on media type
        if (mediaType === 'video') {
          await generateVideoThumbnail(finalImagePath, thumbnailDestPath, 400)
        } else {
          await generateThumbnail(finalImagePath, thumbnailDestPath, 400)
        }
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
        mediaType: mediaType,
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
      
      await writeProjectMetadata(projectId, metadata)
      
      return { success: true, scene: newScene }
    } catch (error) {
      console.error('Failed to add scene:', error)
      throw error
    }
  })

  // Rename a scene
  ipcMain.handle('rename-scene', async (_, { projectId, sceneId, newName }: { 
    projectId: string, 
    sceneId: string, 
    newName: string 
  }) => {
    try {
      const metadata = await readProjectMetadata(projectId)
      
      // Find the scene
      const sceneIndex = metadata.scenes.findIndex(s => s.id === sceneId)
      if (sceneIndex === -1) {
        throw new Error('Scene not found')
      }
      
      // Update scene name
      metadata.scenes[sceneIndex].name = newName
      metadata.updatedAt = new Date().toISOString()
      
      await writeProjectMetadata(projectId, metadata)
      
      return { success: true, scene: metadata.scenes[sceneIndex] }
    } catch (error) {
      console.error('Failed to rename scene:', error)
      throw error
    }
  })

  // Delete a scene
  ipcMain.handle('delete-scene', async (_, { projectId, sceneId }: { 
    projectId: string, 
    sceneId: string 
  }) => {
    try {
      const metadata = await readProjectMetadata(projectId)
      
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
      await writeProjectMetadata(projectId, metadata)
      
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

  // Update scene properties
  ipcMain.handle('update-scene', async (_, { projectId, sceneId, updates }: {
    projectId: string,
    sceneId: string,
    updates: Partial<Scene>
  }) => {
    try {
      const metadata = await readProjectMetadata(projectId)
      
      // Find the scene
      const sceneIndex = metadata.scenes.findIndex(s => s.id === sceneId)
      if (sceneIndex === -1) {
        throw new Error('Scene not found')
      }
      
      // Update the scene with provided fields
      metadata.scenes[sceneIndex] = {
        ...metadata.scenes[sceneIndex],
        ...updates
      }
      
      metadata.updatedAt = new Date().toISOString()
      
      await writeProjectMetadata(projectId, metadata)
      
      return { success: true, scene: metadata.scenes[sceneIndex] }
    } catch (error) {
      console.error('Failed to update scene:', error)
      throw error
    }
  })

  // Update scene sphere correction
  ipcMain.handle('update-scene-sphere-correction', async (_, { projectId, sceneId, sphereCorrection }: { 
    projectId: string, 
    sceneId: string,
    sphereCorrection: { pan?: number, tilt?: number, roll?: number }
  }) => {
    try {
      const metadata = await readProjectMetadata(projectId)
      
      // Find the scene
      const sceneIndex = metadata.scenes.findIndex(s => s.id === sceneId)
      if (sceneIndex === -1) {
        throw new Error('Scene not found')
      }
      
      // Update sphere correction
      metadata.scenes[sceneIndex].sphereCorrection = sphereCorrection
      metadata.updatedAt = new Date().toISOString()
      
      await writeProjectMetadata(projectId, metadata)
      
      return { success: true, scene: metadata.scenes[sceneIndex] }
    } catch (error) {
      console.error('Failed to update scene sphere correction:', error)
      throw error
    }
  })

  // Replace scene image
  ipcMain.handle('replace-scene-image', async (_, { projectId, sceneId, newImagePath, isNewUpload }: { 
    projectId: string, 
    sceneId: string,
    newImagePath: string,
    isNewUpload: boolean
  }) => {
    try {
      const projectPath = await getProjectPath(projectId)
      const metadata = await readProjectMetadata(projectId)
      
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
        await ensureDirectory(scenesDir)
        
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
        await ensureDirectory(thumbnailsDir)
        
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
      
      await writeProjectMetadata(projectId, metadata)
      
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

  // Toggle featured scene
  ipcMain.handle('toggle-featured-scene', async (_, { projectId, sceneId, isFeatured }: { 
    projectId: string, 
    sceneId: string,
    isFeatured: boolean 
  }) => {
    try {
      const metadata = await readProjectMetadata(projectId)
      
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
      
      await writeProjectMetadata(projectId, metadata)
      
      return { success: true }
    } catch (error) {
      console.error('Failed to toggle featured scene:', error)
      throw error
    }
  })

  // Update scene coordinates
  ipcMain.handle('update-scene-coordinates', async (_, { projectId, sceneId, coordinates }: { 
    projectId: string, 
    sceneId: string,
    coordinates?: [number, number]
  }) => {
    try {
      const metadata = await readProjectMetadata(projectId)
      
      // Find the scene
      const sceneIndex = metadata.scenes.findIndex(s => s.id === sceneId)
      if (sceneIndex === -1) {
        throw new Error('Scene not found')
      }
      
      // Update coordinates
      metadata.scenes[sceneIndex].coordinates = coordinates
      metadata.updatedAt = new Date().toISOString()
      
      await writeProjectMetadata(projectId, metadata)
      
      return { success: true, scene: metadata.scenes[sceneIndex] }
    } catch (error) {
      console.error('Failed to update scene coordinates:', error)
      throw error
    }
  })

  // Update scene bearing
  ipcMain.handle('update-scene-bearing', async (_, { projectId, sceneId, bearing }: { 
    projectId: string, 
    sceneId: string,
    bearing?: number
  }) => {
    try {
      const metadata = await readProjectMetadata(projectId)
      
      // Find the scene
      const sceneIndex = metadata.scenes.findIndex(s => s.id === sceneId)
      if (sceneIndex === -1) {
        throw new Error('Scene not found')
      }
      
      // Update bearing
      metadata.scenes[sceneIndex].bearing = bearing
      metadata.updatedAt = new Date().toISOString()
      
      await writeProjectMetadata(projectId, metadata)
      
      return { success: true, scene: metadata.scenes[sceneIndex] }
    } catch (error) {
      console.error('Failed to update scene bearing:', error)
      throw error
    }
  })

  // Toggle scene visibility
  ipcMain.handle('toggle-scene-visibility', async (_, { projectId, sceneId, isVisible }: { 
    projectId: string, 
    sceneId: string,
    isVisible: boolean 
  }) => {
    try {
      const metadata = await readProjectMetadata(projectId)
      
      // Find the scene
      const sceneIndex = metadata.scenes.findIndex(s => s.id === sceneId)
      if (sceneIndex === -1) {
        throw new Error('Scene not found')
      }
      
      // Update scene visibility
      metadata.scenes[sceneIndex].isVisible = isVisible
      metadata.updatedAt = new Date().toISOString()
      
      await writeProjectMetadata(projectId, metadata)
      
      return { success: true, scene: metadata.scenes[sceneIndex] }
    } catch (error) {
      console.error('Failed to toggle scene visibility:', error)
      throw error
    }
  })
}
