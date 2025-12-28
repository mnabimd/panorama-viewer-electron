import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Hotspot } from '@/types/project.types'

export function useHotspots(projectId: string | undefined, activeSceneId: string) {
  const { toast } = useToast()
  
  const [hotspots, setHotspots] = useState<Hotspot[]>([])
  const [isHotspotDialogOpen, setIsHotspotDialogOpen] = useState(false)
  const [editingHotspot, setEditingHotspot] = useState<Hotspot | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState(false)
  const [hotspotToDelete, setHotspotToDelete] = useState<string | null>(null)

  const loadHotspotsForScene = (projectData: any, sceneId: string) => {
    let scenesList: any[] = []
    
    // Handle both array and object formats for scenes
    if (Array.isArray(projectData.scenes)) {
      scenesList = projectData.scenes
    } else if (projectData.scenes && typeof projectData.scenes === 'object') {
      scenesList = Object.values(projectData.scenes)
    }

    const scene = scenesList.find((s: any) => s.id === sceneId)
    if (scene && scene.hotspots) {
      setHotspots(scene.hotspots)
    } else {
      setHotspots([])
    }
  }

  const handleAddHotspot = () => {
    setEditingHotspot(null)
    setIsHotspotDialogOpen(true)
  }

  const handleEditHotspot = (hotspot: Hotspot) => {
    setEditingHotspot(hotspot)
    setIsHotspotDialogOpen(true)
  }

  const handleSubmitHotspot = async (hotspotData: Omit<Hotspot, 'id'>, onRefresh: () => Promise<void>) => {
    if (!projectId || !activeSceneId) return

    try {
      if (editingHotspot) {
        // Update existing hotspot
        // @ts-ignore
        await window.ipcRenderer.invoke('update-hotspot', {
          projectId,
          sceneId: activeSceneId,
          hotspotId: editingHotspot.id,
          hotspotData
        })
        
        toast({
          title: "Success",
          description: "Hotspot updated successfully",
          variant: "success",
        })
      } else {
        // Add new hotspot
        // @ts-ignore
        await window.ipcRenderer.invoke('add-hotspot', {
          projectId,
          sceneId: activeSceneId,
          hotspotData
        })
        
        toast({
          title: "Success",
          description: "Hotspot added successfully",
          variant: "success",
        })
      }
      await onRefresh()
      setIsHotspotDialogOpen(false)
      setEditingHotspot(null)
    } catch (error) {
      console.error('Failed to save hotspot:', error)
      toast({
        title: "Error",
        description: "Failed to save hotspot",
        variant: "destructive",
      })
    }
  }

  const handleDeleteHotspot = async (onRefresh: () => Promise<void>) => {
    if (!projectId || !activeSceneId || !hotspotToDelete) return

    try {
      // @ts-ignore
      await window.ipcRenderer.invoke('delete-hotspot', {
        projectId,
        sceneId: activeSceneId,
        hotspotId: hotspotToDelete
      })
      
      toast({
        title: "Success",
        description: "Hotspot deleted successfully",
        variant: "success",
      })
      await onRefresh()
    } catch (error) {
      console.error('Failed to delete hotspot:', error)
      toast({
        title: "Error",
        description: "Failed to delete hotspot",
        variant: "destructive",
      })
    } finally {
      setDeleteConfirmOpen(false)
      setHotspotToDelete(null)
    }
  }

  const handleDeleteAllHotspots = async (onRefresh: () => Promise<void>) => {
    if (!projectId || !activeSceneId) return

    try {
      // @ts-ignore
      await window.ipcRenderer.invoke('delete-all-hotspots', {
        projectId,
        sceneId: activeSceneId
      })
      
      toast({
        title: "Success",
        description: "All hotspots deleted successfully",
        variant: "success",
      })
      await onRefresh()
    } catch (error) {
      console.error('Failed to delete all hotspots:', error)
      toast({
        title: "Error",
        description: "Failed to delete all hotspots",
        variant: "destructive",
      })
    } finally {
      setDeleteAllConfirmOpen(false)
    }
  }

  const toggleAllHotspotsVisibility = async (show: boolean, onRefresh: () => Promise<void>) => {
    if (!projectId || !activeSceneId) return

    try {
      // @ts-ignore
      await window.ipcRenderer.invoke('toggle-all-hotspots-visibility', {
        projectId,
        sceneId: activeSceneId,
        isVisible: show
      })
      
      toast({
        title: "Success",
        description: `All hotspots ${show ? 'shown' : 'hidden'} successfully`,
        variant: "success",
      })
      await onRefresh()
    } catch (error) {
      console.error('Failed to toggle hotspots visibility:', error)
      toast({
        title: "Error",
        description: "Failed to toggle hotspots visibility",
        variant: "destructive",
      })
    }
  }

  return {
    hotspots,
    setHotspots,
    isHotspotDialogOpen,
    setIsHotspotDialogOpen,
    editingHotspot,
    setEditingHotspot,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    deleteAllConfirmOpen,
    setDeleteAllConfirmOpen,
    hotspotToDelete,
    setHotspotToDelete,
    loadHotspotsForScene,
    handleAddHotspot,
    handleEditHotspot,
    handleSubmitHotspot,
    handleDeleteHotspot,
    handleDeleteAllHotspots,
    toggleAllHotspotsVisibility
  }
}
