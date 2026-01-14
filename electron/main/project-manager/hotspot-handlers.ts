import { ipcMain } from 'electron'
import { randomUUID } from 'node:crypto'
import { readProjectMetadata, writeProjectMetadata } from './file-utils'
import type { Hotspot } from './types'

/**
 * Setup IPC handlers for hotspot operations
 */
export function setupHotspotHandlers() {
  // Add a hotspot to a scene
  ipcMain.handle('add-hotspot', async (_, { projectId, sceneId, hotspotData }: { 
    projectId: string, 
    sceneId: string, 
    hotspotData: Omit<Hotspot, 'id'> 
  }) => {
    try {
      const metadata = await readProjectMetadata(projectId)
      
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
      
      await writeProjectMetadata(projectId, metadata)
      
      return { success: true, hotspot: newHotspot, scene: metadata.scenes[sceneIndex] }
    } catch (error) {
      console.error('Failed to add hotspot:', error)
      throw error
    }
  })

  // Update a hotspot
  ipcMain.handle('update-hotspot', async (_, { projectId, sceneId, hotspotId, hotspotData }: { 
    projectId: string, 
    sceneId: string, 
    hotspotId: string,
    hotspotData: Partial<Hotspot> 
  }) => {
    try {
      const metadata = await readProjectMetadata(projectId)
      
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
      
      await writeProjectMetadata(projectId, metadata)
      
      return { success: true, hotspot: metadata.scenes[sceneIndex].hotspots[hotspotIndex], scene: metadata.scenes[sceneIndex] }
    } catch (error) {
      console.error('Failed to update hotspot:', error)
      throw error
    }
  })

  // Delete a hotspot
  ipcMain.handle('delete-hotspot', async (_, { projectId, sceneId, hotspotId }: { 
    projectId: string, 
    sceneId: string, 
    hotspotId: string 
  }) => {
    try {
      const metadata = await readProjectMetadata(projectId)
      
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
      
      await writeProjectMetadata(projectId, metadata)
      
      return { success: true, scene: metadata.scenes[sceneIndex] }
    } catch (error) {
      console.error('Failed to delete hotspot:', error)
      throw error
    }
  })

  // Delete all hotspots from a scene
  ipcMain.handle('delete-all-hotspots', async (_, { projectId, sceneId }: { 
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
      
      // Clear all hotspots
      metadata.scenes[sceneIndex].hotspots = []
      metadata.updatedAt = new Date().toISOString()
      
      await writeProjectMetadata(projectId, metadata)
      
      return { success: true, scene: metadata.scenes[sceneIndex] }
    } catch (error) {
      console.error('Failed to delete all hotspots:', error)
      throw error
    }
  })

  // Toggle visibility of a single hotspot
  ipcMain.handle('toggle-hotspot-visibility', async (_, { projectId, sceneId, hotspotId, isVisible }: { 
    projectId: string, 
    sceneId: string,
    hotspotId: string,
    isVisible: boolean 
  }) => {
    try {
      const metadata = await readProjectMetadata(projectId)
      
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
      
      await writeProjectMetadata(projectId, metadata)
      
      return { success: true, hotspot: metadata.scenes[sceneIndex].hotspots[hotspotIndex] }
    } catch (error) {
      console.error('Failed to toggle hotspot visibility:', error)
      throw error
    }
  })

  // Toggle visibility of all hotspots in a scene
  ipcMain.handle('toggle-all-hotspots-visibility', async (_, { projectId, sceneId, isVisible }: { 
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
      
      // Update visibility for all hotspots in the scene
      metadata.scenes[sceneIndex].hotspots = metadata.scenes[sceneIndex].hotspots.map(hotspot => ({
        ...hotspot,
        isVisible: isVisible
      }))
      
      metadata.updatedAt = new Date().toISOString()
      
      await writeProjectMetadata(projectId, metadata)
      
      return { success: true, scene: metadata.scenes[sceneIndex] }
    } catch (error) {
      console.error('Failed to toggle hotspots visibility:', error)
      throw error
    }
  })
}
