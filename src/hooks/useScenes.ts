import { useState, useMemo } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Scene } from '@/types/project.types'

export function useScenes(scenes: Scene[], setScenes: React.Dispatch<React.SetStateAction<Scene[]>>) {
  const { toast } = useToast()
  
  const [activeScene, setActiveScene] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddSceneDialogOpen, setIsAddSceneDialogOpen] = useState(false)

  // Filter scenes based on search query
  const filteredScenes = useMemo(() => {
    return scenes.filter(scene =>
      scene.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [scenes, searchQuery])

  const toggleSceneVisibility = (e: React.MouseEvent, sceneId: string) => {
    e.stopPropagation()
    setScenes(prev => prev.map(s =>
      s.id === sceneId ? { ...s, isVisible: !s.isVisible } : s
    ))
  }

  const handleNewImage = () => {
    setIsAddSceneDialogOpen(true)
  }

  const handleSceneAdded = async (onRefresh: () => Promise<void>) => {
    await onRefresh()
    setIsAddSceneDialogOpen(false)
    toast({
      title: "Success",
      description: "Scene added successfully",
      variant: "success",
    })
  }

  const renameScene = async (projectId: string, sceneId: string, newName: string, onRefresh: () => Promise<void>) => {
    if (!newName.trim()) {
      toast({
        title: "Error",
        description: "Scene name cannot be empty",
        variant: "destructive",
      })
      return false
    }

    try {
      // @ts-ignore
      await window.ipcRenderer.invoke('rename-scene', {
        projectId,
        sceneId,
        newName: newName.trim()
      })
      
      await onRefresh()
      toast({
        title: "Success",
        description: "Scene renamed successfully",
        variant: "success",
      })
      return true
    } catch (error) {
      console.error('Failed to rename scene:', error)
      toast({
        title: "Error",
        description: "Failed to rename scene",
        variant: "destructive",
      })
      return false
    }
  }

  const deleteScene = async (projectId: string, sceneId: string, onRefresh: () => Promise<void>) => {
    try {
      // @ts-ignore
      await window.ipcRenderer.invoke('delete-scene', {
        projectId,
        sceneId
      })
      
      await onRefresh()
      toast({
        title: "Success",
        description: "Scene deleted successfully",
        variant: "success",
      })
      return true
    } catch (error) {
      console.error('Failed to delete scene:', error)
      toast({
        title: "Error",
        description: "Failed to delete scene",
        variant: "destructive",
      })
      return false
    }
  }

  return {
    activeScene,
    setActiveScene,
    searchQuery,
    setSearchQuery,
    filteredScenes,
    isAddSceneDialogOpen,
    setIsAddSceneDialogOpen,
    toggleSceneVisibility,
    handleNewImage,
    handleSceneAdded,
    renameScene,
    deleteScene
  }
}
