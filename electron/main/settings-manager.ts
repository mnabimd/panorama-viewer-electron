import { ipcMain, app, dialog } from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'
import os from 'node:os'

// Duplicate from src/constants.ts to avoid import issues in main process
const PROJECT_CATEGORIES = [
  { id: 'real-estate', label: 'Real Estate' },
  { id: 'tourism', label: 'Tourism' },
  { id: 'education', label: 'Education' },
  { id: 'events', label: 'Events' },
  { id: 'other', label: 'Other' },
] as const;

const SETTINGS_FILE = path.join(app.getPath('userData'), 'settings.json')
const DEFAULT_WORKSPACE = path.join(app.getPath('documents'), 'ABNabi360')
const MAX_RECENT_WORKSPACES = 5

interface CustomCategory {
  id: string
  label: string
}

interface AppSettings {
  workspacePath: string
  photoCompressionEnabled: boolean
  compressionQuality: number  // JPEG quality 1-100 (default: 85)
  maxImageWidth: number       // Max width in pixels (default: 8192)
  maxImageHeight: number      // Max height in pixels (default: 4096)
  recentWorkspaces: string[]
  galleryViewMode?: 'grid' | 'list'  // Gallery view mode preference (default: grid)
  lastUpdatedAt: string
  customCategories: CustomCategory[]
}

interface WorkspaceInfo {
  path: string
  exists: boolean
  projectCount: number
  hasProjects: boolean
  isValid: boolean
  error?: string
}

// In-memory cache of current settings
let currentSettings: AppSettings | null = null

/**
 * Get default settings
 */
function getDefaultSettings(): AppSettings {
  return {
    workspacePath: DEFAULT_WORKSPACE,
    photoCompressionEnabled: true,
    compressionQuality: 60,
    maxImageWidth: 8192,
    maxImageHeight: 4096,
    recentWorkspaces: [],
    galleryViewMode: 'grid',
    lastUpdatedAt: new Date().toISOString(),
    customCategories: []
  }
}

/**
 * Load settings from file
 */
async function loadSettings(): Promise<AppSettings> {
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8')
    const settings = JSON.parse(data)
    const mergedSettings: AppSettings = { ...getDefaultSettings(), ...settings }
    currentSettings = mergedSettings
    return mergedSettings
  } catch (error) {
    // If file doesn't exist or is invalid, return defaults
    const defaultSettings = getDefaultSettings()
    currentSettings = defaultSettings
    await saveSettings(defaultSettings)
    return defaultSettings
  }
}

/**
 * Save settings to file
 */
async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    const updatedSettings = {
      ...settings,
      lastUpdatedAt: new Date().toISOString()
    }
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(updatedSettings, null, 2), 'utf-8')
    currentSettings = updatedSettings
  } catch (error) {
    console.error('Failed to save settings:', error)
    throw error
  }
}

/**
 * Get current settings (from cache or load from file)
 */
export async function getAppSettings(): Promise<AppSettings> {
  if (currentSettings) {
    return currentSettings
  }
  return await loadSettings()
}

/**
 * Get the current workspace path
 */
export async function getWorkspacePath(): Promise<string> {
  const settings = await getAppSettings()
  return settings.workspacePath
}

/**
 * Check workspace for existing projects
 */
async function checkWorkspaceProjects(workspacePath: string): Promise<WorkspaceInfo> {
  const info: WorkspaceInfo = {
    path: workspacePath,
    exists: false,
    projectCount: 0,
    hasProjects: false,
    isValid: false
  }

  try {
    // Check if workspace path exists
    try {
      await fs.access(workspacePath)
      info.exists = true
    } catch {
      // Try to create it
      try {
        await fs.mkdir(workspacePath, { recursive: true })
        info.exists = true
      } catch (createError) {
        info.error = 'Cannot create workspace directory. Check permissions.'
        return info
      }
    }

    // Check for projects folder
    const projectsDir = path.join(workspacePath, 'projects')
    try {
      await fs.access(projectsDir)
      
      // Count projects
      const entries = await fs.readdir(projectsDir, { withFileTypes: true })
      const projectDirs = entries.filter(entry => entry.isDirectory())
      
      let validProjectCount = 0
      for (const dir of projectDirs) {
        const projectJsonPath = path.join(projectsDir, dir.name, 'project.json')
        try {
          await fs.access(projectJsonPath)
          validProjectCount++
        } catch {
          // Not a valid project
        }
      }
      
      info.projectCount = validProjectCount
      info.hasProjects = validProjectCount > 0
    } catch {
      // Projects folder doesn't exist - that's okay
      info.projectCount = 0
      info.hasProjects = false
    }

    info.isValid = true
    return info
  } catch (error) {
    info.error = error instanceof Error ? error.message : 'Unknown error'
    return info
  }
}

/**
 * Add workspace to recent workspaces list
 */
function addToRecentWorkspaces(settings: AppSettings, workspacePath: string): string[] {
  const recent = [...settings.recentWorkspaces]
  
  // Remove if already exists
  const index = recent.indexOf(workspacePath)
  if (index > -1) {
    recent.splice(index, 1)
  }
  
  // Add to beginning
  recent.unshift(workspacePath)
  
  // Keep only MAX_RECENT_WORKSPACES
  return recent.slice(0, MAX_RECENT_WORKSPACES)
}

/**
 * Setup IPC handlers for settings
 */
export function setupSettingsHandlers() {
  // Get current app settings
  ipcMain.handle('get-app-settings', async () => {
    try {
      return await getAppSettings()
    } catch (error) {
      console.error('Failed to get app settings:', error)
      throw error
    }
  })

  // Check workspace for projects
  ipcMain.handle('check-workspace-projects', async (_, workspacePath: string) => {
    try {
      return await checkWorkspaceProjects(workspacePath)
    } catch (error) {
      console.error('Failed to check workspace:', error)
      throw error
    }
  })

  // Update workspace path
  ipcMain.handle('update-workspace', async (_, workspacePath: string) => {
    try {
      // Validate workspace first
      const info = await checkWorkspaceProjects(workspacePath)
      
      if (!info.isValid) {
        return { 
          success: false, 
          error: info.error || 'Invalid workspace path' 
        }
      }

      // Update settings
      const settings = await getAppSettings()
      const updatedSettings: AppSettings = {
        ...settings,
        workspacePath,
        recentWorkspaces: addToRecentWorkspaces(settings, workspacePath)
      }

      await saveSettings(updatedSettings)

      return { 
        success: true, 
        settings: updatedSettings,
        workspaceInfo: info
      }
    } catch (error) {
      console.error('Failed to update workspace:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  })

  // Select directory dialog
  ipcMain.handle('select-directory', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory', 'createDirectory'],
        title: 'Select Workspace Directory',
        defaultPath: app.getPath('documents')
      })

      if (result.canceled || result.filePaths.length === 0) {
        return { canceled: true }
      }

      return { canceled: false, path: result.filePaths[0] }
    } catch (error) {
      console.error('Failed to select directory:', error)
      throw error
    }
  })

  // Get workspace info
  ipcMain.handle('get-workspace-info', async () => {
    try {
      const settings = await getAppSettings()
      return await checkWorkspaceProjects(settings.workspacePath)
    } catch (error) {
      console.error('Failed to get workspace info:', error)
      throw error
    }
  })

  // Update photo compression setting
  ipcMain.handle('update-photo-compression', async (_, enabled: boolean) => {
    try {
      const settings = await getAppSettings()
      const updatedSettings: AppSettings = {
        ...settings,
        photoCompressionEnabled: enabled
      }

      await saveSettings(updatedSettings)
      return { success: true, settings: updatedSettings }
    } catch (error) {
      console.error('Failed to update photo compression:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  })

  // Update compression quality settings
  ipcMain.handle('update-compression-settings', async (_, settings: { 
    quality?: number
    maxWidth?: number
    maxHeight?: number
  }) => {
    try {
      const currentSettings = await getAppSettings()
      const updatedSettings: AppSettings = {
        ...currentSettings,
        ...(settings.quality !== undefined && { compressionQuality: settings.quality }),
        ...(settings.maxWidth !== undefined && { maxImageWidth: settings.maxWidth }),
        ...(settings.maxHeight !== undefined && { maxImageHeight: settings.maxHeight })
      }

      await saveSettings(updatedSettings)
      return { success: true, settings: updatedSettings }
    } catch (error) {
      console.error('Failed to update compression settings:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  })


  // Get gallery view mode
  ipcMain.handle('get-gallery-view-mode', async () => {
    try {
      const settings = await getAppSettings()
      return { success: true, viewMode: settings.galleryViewMode || 'grid' }
    } catch (error) {
      console.error('Failed to get gallery view mode:', error)
      return { success: false, viewMode: 'grid' }
    }
  })

  // Set gallery view mode
  ipcMain.handle('set-gallery-view-mode', async (_, viewMode: 'grid' | 'list') => {
    try {
      const settings = await getAppSettings()
      const updatedSettings: AppSettings = {
        ...settings,
        galleryViewMode: viewMode
      }

      await saveSettings(updatedSettings)
      return { success: true, settings: updatedSettings }
    } catch (error) {
      console.error('Failed to set gallery view mode:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  })

  // Add custom category
  ipcMain.handle('add-custom-category', async (_, label: string) => {
    try {
      const settings = await getAppSettings()
      const id = label.toLowerCase().replace(/\s+/g, '-')
      
      // Check if exists in defaults
      if (PROJECT_CATEGORIES.some(c => c.id === id)) {
        return { success: false, error: 'Category already exists in defaults' }
      }
      
      // Check if exists in custom
      if (settings.customCategories.some(c => c.id === id)) {
        return { success: false, error: 'Category already exists' }
      }

      const updatedSettings: AppSettings = {
        ...settings,
        customCategories: [...settings.customCategories, { id, label }]
      }

      await saveSettings(updatedSettings)
      return { success: true, settings: updatedSettings }
    } catch (error) {
      console.error('Failed to add custom category:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  })

  // Remove custom category
  ipcMain.handle('remove-custom-category', async (_, categoryId: string) => {
    try {
      const settings = await getAppSettings()
      
      const updatedSettings: AppSettings = {
        ...settings,
        customCategories: settings.customCategories.filter(c => c.id !== categoryId)
      }

      await saveSettings(updatedSettings)
      return { success: true, settings: updatedSettings }
    } catch (error) {
      console.error('Failed to remove custom category:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  })
}
