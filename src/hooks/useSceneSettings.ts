import { useState } from "react"
import { Scene } from "@/types/project.types"
import { useToast } from "@/hooks/use-toast"

interface UseSceneSettingsProps {
  project: any
  activeScene: string
  scenes: Scene[]
  renameScene: (projectId: string, sceneId: string, newName: string, refreshProject: () => Promise<void>) => Promise<boolean>
  deleteScene: (projectId: string, sceneId: string, refreshProject: () => Promise<void>) => Promise<boolean>
  refreshProject: () => Promise<void>
}

export function useSceneSettings({
  project,
  activeScene,
  scenes,
  renameScene,
  deleteScene,
  refreshProject
}: UseSceneSettingsProps) {
  const { toast } = useToast()
  
  // Scene name editing state
  const [editingSceneName, setEditingSceneName] = useState(false)
  const [tempSceneName, setTempSceneName] = useState("")
  
  // Delete scene state
  const [deleteSceneConfirmOpen, setDeleteSceneConfirmOpen] = useState(false)
  const [isDeletingScene, setIsDeletingScene] = useState(false)
  
  // All hotspots visibility state
  const [allHotspotsVisible, setAllHotspotsVisible] = useState(true)
  
  // Replace image state
  const [isReplaceImageOpen, setIsReplaceImageOpen] = useState(false)
  const [replaceImagePath, setReplaceImagePath] = useState<string | null>(null)
  const [replaceSceneId, setReplaceSceneId] = useState<string | null>(null)
  const [isReplacingImage, setIsReplacingImage] = useState(false)
  
  // Delete all scenes state
  const [deleteAllScenesConfirmOpen, setDeleteAllScenesConfirmOpen] = useState(false)

  const currentScene = scenes.find(s => s.id === activeScene)

  // Scene name handlers
  const handleStartEditSceneName = () => {
    if (currentScene) {
      setTempSceneName(currentScene.name)
      setEditingSceneName(true)
    }
  }

  const handleSaveSceneName = async () => {
    if (project && activeScene && tempSceneName.trim()) {
      const success = await renameScene(project.id, activeScene, tempSceneName, refreshProject)
      if (success) {
        setEditingSceneName(false)
      }
    }
  }

  const handleCancelEditSceneName = () => {
    setEditingSceneName(false)
    setTempSceneName("")
  }

  // Delete scene handler
  const handleDeleteScene = async () => {
    if (!project || !activeScene) return
    
    setIsDeletingScene(true)
    try {
      const success = await deleteScene(project.id, activeScene, refreshProject)
      if (success) {
        setDeleteSceneConfirmOpen(false)
        return true
      }
      return false
    } finally {
      setIsDeletingScene(false)
    }
  }

  // Toggle all hotspots handler
  const handleToggleAllHotspots = async (checked: boolean) => {
    if (project && activeScene) {
      setAllHotspotsVisible(checked)
      try {
        // @ts-ignore
        await window.ipcRenderer.invoke('toggle-all-hotspots-visibility', {
          projectId: project.id,
          sceneId: activeScene,
          isVisible: checked
        })
        await refreshProject()
      } catch (error) {
        console.error('Failed to toggle all hotspots visibility:', error)
      }
    }
  }

  // Replace image handlers
  const handleReplaceImage = () => {
    setReplaceImagePath(null)
    setReplaceSceneId(null)
    setIsReplaceImageOpen(true)
  }

  const handleImageSelect = (imagePath: string, sceneId: string | null) => {
    setReplaceImagePath(imagePath || null)
    setReplaceSceneId(sceneId)
  }

  const handleConfirmReplaceImage = async () => {
    if (!project || !activeScene || !replaceImagePath) return

    setIsReplacingImage(true)
    try {
      // @ts-ignore
      await window.ipcRenderer.invoke('replace-scene-image', {
        projectId: project.id,
        sceneId: activeScene,
        newImagePath: replaceImagePath,
        isNewUpload: replaceSceneId === null
      })
      
      await refreshProject()
      setIsReplaceImageOpen(false)
      setReplaceImagePath(null)
      setReplaceSceneId(null)
    } catch (error) {
      console.error('Failed to replace scene image:', error)
    } finally {
      setIsReplacingImage(false)
    }
  }

  // Delete all scenes handler
  const handleDeleteAllScenes = async () => {
    if (!project || scenes.length === 0) return

    try {
      // Delete all scenes
      for (const scene of scenes) {
        await deleteScene(project.id, scene.id, refreshProject)
      }
      
      setDeleteAllScenesConfirmOpen(false)
      return true
    } catch (error) {
      console.error('Failed to delete all scenes:', error)
      return false
    }
  }

  // Toggle featured scene handler
  const handleToggleFeatured = async (checked: boolean) => {
    if (!project || !activeScene) return

    try {
      // @ts-ignore
      await window.ipcRenderer.invoke('toggle-featured-scene', {
        projectId: project.id,
        sceneId: activeScene,
        isFeatured: checked
      })
      await refreshProject()
    } catch (error) {
      console.error('Failed to toggle featured scene:', error)
    }
  }

  // Update GPS coordinates handler
  const handleUpdateCoordinates = async (longitude: number | undefined, latitude: number | undefined) => {
    if (!project || !activeScene) return

    try {
      const coordinates = (longitude !== undefined && latitude !== undefined) 
        ? [longitude, latitude] as [number, number]
        : undefined

      // @ts-ignore
      await window.ipcRenderer.invoke('update-scene-coordinates', {
        projectId: project.id,
        sceneId: activeScene,
        coordinates
      })
      await refreshProject()
      
      toast({
        title: "GPS Coordinates Updated",
        description: coordinates 
          ? `Location set to ${latitude}, ${longitude}`
          : "Location cleared",
      })
    } catch (error) {
      console.error('Failed to update scene coordinates:', error)
      toast({
        title: "Error",
        description: "Failed to update GPS coordinates",
        variant: "destructive",
      })
    }
  }

  // Update bearing handler
  const handleUpdateBearing = async (bearing: number | undefined) => {
    if (!project || !activeScene) return

    try {
      // @ts-ignore
      await window.ipcRenderer.invoke('update-scene-bearing', {
        projectId: project.id,
        sceneId: activeScene,
        bearing
      })
      await refreshProject()
    } catch (error) {
      console.error('Failed to update scene bearing:', error)
    }
  }

  // Update sphere correction handler
  const handleUpdateSphereCorrection = async (sphereCorrection: { pan?: number, tilt?: number, roll?: number }) => {
    if (!project || !activeScene) return

    try {
      // @ts-ignore
      await window.ipcRenderer.invoke('update-scene-sphere-correction', {
        projectId: project.id,
        sceneId: activeScene,
        sphereCorrection
      })
      await refreshProject()
    } catch (error) {
      console.error('Failed to update scene sphere correction:', error)
      toast({
        title: "Error",
        description: "Failed to update scene orientation",
        variant: "destructive",
      })
    }
  }

  return {
    // State
    currentScene,
    editingSceneName,
    tempSceneName,
    setTempSceneName,
    deleteSceneConfirmOpen,
    setDeleteSceneConfirmOpen,
    isDeletingScene,
    allHotspotsVisible,
    isReplaceImageOpen,
    setIsReplaceImageOpen,
    replaceImagePath,
    replaceSceneId,
    isReplacingImage,
    deleteAllScenesConfirmOpen,
    setDeleteAllScenesConfirmOpen,
    
    // Handlers
    handleStartEditSceneName,
    handleSaveSceneName,
    handleCancelEditSceneName,
    handleDeleteScene,
    handleToggleAllHotspots,
    handleReplaceImage,
    handleImageSelect,
    handleConfirmReplaceImage,
    handleDeleteAllScenes,
    handleToggleFeatured,
    handleUpdateCoordinates,
    handleUpdateSphereCorrection
  }
}
