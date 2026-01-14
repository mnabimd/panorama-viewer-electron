import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from './use-toast'

interface MenuActionsState {
  sidebarVisible: boolean
}

export function useMenuActions(projectId?: string) {
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [state, setState] = useState<MenuActionsState>({
    sidebarVisible: true
  })

  // Toggle handlers
  const toggleSidebar = useCallback(() => {
    setState(prev => ({
      ...prev,
      sidebarVisible: !prev.sidebarVisible
    }))
  }, [])

  // File operations
  const handleNewProject = useCallback(() => {
    navigate('/')
    // Trigger new project dialog (will be handled by Dashboard component)
    window.dispatchEvent(new CustomEvent('open-new-project-dialog'))
  }, [navigate])

  const handleSaveProject = useCallback(() => {
    if (!projectId) {
      toast({
        title: 'No Project Open',
        description: 'Please open a project first',
        variant: 'destructive'
      })
      return
    }
    // Trigger save event
    window.dispatchEvent(new CustomEvent('save-project', { detail: { projectId } }))
    toast({
      title: 'Project Saved',
      description: 'Your project has been saved successfully'
    })
  }, [projectId, toast])

  const handleImportScenes = useCallback(async () => {
if (!projectId) {
      toast({
        title: 'No Project Open',
        description: 'Please open a project first to import scenes',
        variant: 'destructive'
      })
      return
    }
    
    try {
      const result = await window.ipcRenderer.invoke('menu:import-scenes-dialog')
      if (result.success && result.filePaths.length > 0) {
        window.dispatchEvent(new CustomEvent('import-scenes', { 
          detail: { projectId, filePaths: result.filePaths } 
        }))
      }
    } catch (error) {
      console.error('Failed to import scenes:', error)
      toast({
        title: 'Import Failed',
        description: 'Failed to import scenes',
        variant: 'destructive'
      })
    }
  }, [projectId, toast])

  const handleExportProject = useCallback(async (projectName: string) => {
    if (!projectId) {
      toast({
        title: 'No Project Open',
        description: 'Please open a project first to export',
        variant: 'destructive'
      })
      return
    }
    
    try {
      const result = await window.ipcRenderer.invoke('menu:export-project-dialog', { 
        projectId, 
        projectName 
      })
      if (result.success) {
        toast({
          title: 'Export Successful',
          description: `Project exported to ${result.exportPath}`
        })
      }
    } catch (error) {
      console.error('Failed to export project:', error)
      toast({
        title: 'Export Failed',
        description: 'Failed to export project',
        variant: 'destructive'
      })
    }
  }, [projectId, toast])

  // Project operations
  const handlePreviewMode = useCallback(() => {
    if (!projectId) {
      toast({
        title: 'No Project Open',
        description: 'Please open a project first',
        variant: 'destructive'
      })
      return
    }
    window.dispatchEvent(new CustomEvent('preview-mode', { detail: { projectId } }))
  }, [projectId, toast])

  const handleProjectProperties = useCallback(() => {
    if (!projectId) {
      toast({
        title: 'No Project Open',
        description: 'Please open a project first',
        variant: 'destructive'
      })
      return
    }
    window.dispatchEvent(new CustomEvent('open-project-properties', { detail: { projectId } }))
  }, [projectId, toast])

  // Setup IPC listeners
  useEffect(() => {
    const ipcRenderer = window.ipcRenderer

    // View menu listeners
    ipcRenderer.on('menu:toggle-sidebar', toggleSidebar)

    // File menu listeners
    ipcRenderer.on('menu:new-project', handleNewProject)
    ipcRenderer.on('menu:save-project', handleSaveProject)
    ipcRenderer.on('menu:import-scenes', handleImportScenes)
    
    // Project menu listeners
    ipcRenderer.on('menu:preview-mode', handlePreviewMode)
    ipcRenderer.on('menu:project-properties', handleProjectProperties)
    
    // Developer menu listeners
    ipcRenderer.on('menu:cache-cleared', () => {
      toast({
        title: 'Cache Cleared',
        description: 'Application cache has been cleared'
      })
    })

    return () => {
      ipcRenderer.off('menu:toggle-sidebar', toggleSidebar)
      ipcRenderer.off('menu:new-project', handleNewProject)
      ipcRenderer.off('menu:save-project', handleSaveProject)
      ipcRenderer.off('menu:import-scenes', handleImportScenes)
      ipcRenderer.off('menu:preview-mode', handlePreviewMode)
      ipcRenderer.off('menu:project-properties', handleProjectProperties)
    }
  }, [
    toggleSidebar,
    handleNewProject,
    handleSaveProject,
    handleImportScenes,
    handlePreviewMode,
    handleProjectProperties,
    toast
  ])

  return {
    ...state,
    toggleSidebar,
    handleNewProject,
    handleSaveProject,
    handleImportScenes,
    handleExportProject,
    handlePreviewMode,
    handleProjectProperties
  }
}
