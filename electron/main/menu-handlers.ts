import { ipcMain, dialog, BrowserWindow } from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'
import { getWorkspacePath } from './settings-manager'

/**
 * Setup menu-related IPC handlers
 */
export function setupMenuHandlers(): void {
  
  // Import Scenes Handler
  ipcMain.handle('menu:import-scenes-dialog', async () => {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Import Scenes',
        properties: ['openFile', 'multiSelections'],
        filters: [
          { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] },
          { name: 'Videos', extensions: ['mp4', 'webm', 'ogv', 'mov', 'avi'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      })
      
      if (!result.canceled && result.filePaths.length > 0) {
        return { success: true, filePaths: result.filePaths }
      }
      
      return { success: false, filePaths: [] }
    } catch (error) {
      console.error('Failed to open import dialog:', error)
      throw error
    }
  })
  
  // Export Project Handler
  ipcMain.handle('menu:export-project-dialog', async (_, { projectId, projectName }: { projectId: string, projectName: string }) => {
    try {
      const workspacePath = await getWorkspacePath()
      const sourceProjectPath = path.join(workspacePath, 'projects', projectId)
      
      const result = await dialog.showSaveDialog({
        title: 'Export Project',
        defaultPath: `${projectName}.export`,
        properties: ['createDirectory']
      })
      
      if (!result.canceled && result.filePath) {
        // Copy entire project directory to selected location
        await copyDirectory(sourceProjectPath, result.filePath)
        return { success: true, exportPath: result.filePath }
      }
      
      return { success: false }
    } catch (error) {
      console.error('Failed to export project:', error)
      throw error
    }
  })
}

/**
 * Recursively copy directory
 */
async function copyDirectory(source: string, destination: string): Promise<void> {
  await fs.mkdir(destination, { recursive: true })
  
  const entries = await fs.readdir(source, { withFileTypes: true })
  
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name)
    const destPath = path.join(destination, entry.name)
    
    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, destPath)
    } else {
      await fs.copyFile(sourcePath, destPath)
    }
  }
}
