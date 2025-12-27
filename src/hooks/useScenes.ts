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
    handleSceneAdded
  }
}
