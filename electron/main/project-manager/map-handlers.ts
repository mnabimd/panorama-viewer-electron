import { ipcMain, dialog } from 'electron'
import * as fs from 'fs-extra'
import * as path from 'path'
import { randomUUID } from 'node:crypto'
import { MapMarker, MapConfig } from './types'
import { getProjectPath, readProjectMetadata, writeProjectMetadata } from './file-utils'

/**
 * Register all map-related IPC handlers
 */
export function registerMapHandlers() {
  // Upload map image
  ipcMain.handle('upload-map-image', async (event, { projectId, imagePath }) => {
    console.log('[MAP UPLOAD] Starting upload for project:', projectId)
    console.log('[MAP UPLOAD] Image path:', imagePath)
    
    try {
      const projectPath = await getProjectPath(projectId)
      console.log('[MAP UPLOAD] Project path:', projectPath)

      // Create map directory if it doesn't exist
      const mapDir = path.join(projectPath, 'map')
      console.log('[MAP UPLOAD] Creating map directory:', mapDir)
      await fs.ensureDir(mapDir)

      // Determine file extension
      const ext = path.extname(imagePath)
      const targetPath = path.join(mapDir, `map${ext}`)
      console.log('[MAP UPLOAD] Target path:', targetPath)

      // Copy image to project map directory
      console.log('[MAP UPLOAD] Copying image...')
      await fs.copy(imagePath, targetPath, { overwrite: true })
      console.log('[MAP UPLOAD] Image copied successfully')

      // Update project metadata
      console.log('[MAP UPLOAD] Updating project metadata...')
      const metadata = await readProjectMetadata(projectId)
      if (!metadata.mapConfig) {
        metadata.mapConfig = {
          markers: [],
          visible: true
        }
      }
      metadata.mapConfig.imagePath = targetPath
      await writeProjectMetadata(projectId, metadata)
      console.log('[MAP UPLOAD] Metadata updated successfully')

      return {
        success: true,
        imagePath: targetPath
      }
    } catch (error) {
      console.error('[MAP UPLOAD] Failed to upload map image:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  // Get map configuration
  ipcMain.handle('get-map-config', async (event, { projectId }) => {
    try {
      const metadata = await readProjectMetadata(projectId)
      return {
        success: true,
        mapConfig: metadata.mapConfig || { markers: [], visible: true }
      }
    } catch (error) {
      console.error('Failed to get map config:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  // Add map marker
  ipcMain.handle('add-map-marker', async (event, { projectId, sceneId, position, label }) => {
    try {
      const metadata = await readProjectMetadata(projectId)
      
      // Initialize mapConfig if it doesn't exist
      if (!metadata.mapConfig) {
        metadata.mapConfig = {
          markers: [],
          visible: true
        }
      }

      // Create new marker
      const newMarker: MapMarker = {
        id: `marker_${randomUUID().slice(0, 8)}`,
        sceneId,
        position,
        label
      }

      metadata.mapConfig.markers.push(newMarker)
      await writeProjectMetadata(projectId, metadata)

      return {
        success: true,
        marker: newMarker
      }
    } catch (error) {
      console.error('Failed to add map marker:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  // Update map marker
  ipcMain.handle('update-map-marker', async (event, { projectId, markerId, updates }) => {
    try {
      const metadata = await readProjectMetadata(projectId)
      
      if (!metadata.mapConfig) {
        throw new Error('Map config not found')
      }

      const markerIndex = metadata.mapConfig.markers.findIndex(m => m.id === markerId)
      if (markerIndex === -1) {
        throw new Error('Marker not found')
      }

      // Update marker
      metadata.mapConfig.markers[markerIndex] = {
        ...metadata.mapConfig.markers[markerIndex],
        ...updates
      }

      await writeProjectMetadata(projectId, metadata)

      return {
        success: true,
        marker: metadata.mapConfig.markers[markerIndex]
      }
    } catch (error) {
      console.error('Failed to update map marker:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  // Delete map marker
  ipcMain.handle('delete-map-marker', async (event, { projectId, markerId }) => {
    try {
      const metadata = await readProjectMetadata(projectId)
      
      if (!metadata.mapConfig) {
        throw new Error('Map config not found')
      }

      metadata.mapConfig.markers = metadata.mapConfig.markers.filter(m => m.id !== markerId)
      await writeProjectMetadata(projectId, metadata)

      return {
        success: true
      }
    } catch (error) {
      console.error('Failed to delete map marker:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  // Clear map (remove image and all markers)
  ipcMain.handle('clear-map', async (event, { projectId }) => {
    try {
      const projectPath = await getProjectPath(projectId)

      // Remove map directory
      const mapDir = path.join(projectPath, 'map')
      if (await fs.pathExists(mapDir)) {
        await fs.remove(mapDir)
      }

      // Update project metadata
      const metadata = await readProjectMetadata(projectId)
      metadata.mapConfig = undefined
      await writeProjectMetadata(projectId, metadata)

      return {
        success: true
      }
    } catch (error) {
      console.error('Failed to clear map:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  // Save map configuration
  ipcMain.handle('save-map-config', async (event, { projectId, mapConfig }) => {
    try {
      const metadata = await readProjectMetadata(projectId)
      metadata.mapConfig = mapConfig
      await writeProjectMetadata(projectId, metadata)

      return {
        success: true
      }
    } catch (error) {
      console.error('Failed to save map config:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })
}
