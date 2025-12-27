import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'
import { Project, Scene } from '@/types/project.types'

export function useProject(projectId: string | undefined) {
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [project, setProject] = useState<Project | null>(null)
  const [projectName, setProjectName] = useState("")
  const [isEditingName, setIsEditingName] = useState(false)
  const [scenes, setScenes] = useState<Scene[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch project on mount
  useEffect(() => {
    fetchProject()
  }, [projectId])

  const fetchProject = async () => {
    if (!projectId) return
    
    try {
      setIsLoading(true)
      // @ts-ignore
      const result = await window.ipcRenderer.invoke('get-project-by-id', projectId)
      
      if (!result) {
        toast({
          title: "Error",
          description: "Project not found",
          variant: "destructive",
        })
        navigate('/')
        return
      }

      setProject(result)
      setProjectName(result.name)

      // Load scenes from project
      let scenesList: Scene[] = []
      if (Array.isArray(result.scenes)) {
        scenesList = result.scenes
      } else if (result.scenes && typeof result.scenes === 'object') {
        scenesList = Object.values(result.scenes)
      }

      setScenes(scenesList)
    } catch (error) {
      console.error('Failed to fetch project:', error)
      toast({
        title: "Error",
        description: "Failed to load project",
        variant: "destructive",
      })
      navigate('/')
    } finally {
      setIsLoading(false)
    }
  }

  const refreshProject = async () => {
    if (!projectId) return
    
    try {
      // @ts-ignore
      const result = await window.ipcRenderer.invoke('get-project-by-id', projectId)
      if (result) {
        setProject(result)
        
        // Reload scenes
        let scenesList: Scene[] = []
        if (Array.isArray(result.scenes)) {
          scenesList = result.scenes
        } else if (result.scenes && typeof result.scenes === 'object') {
          scenesList = Object.values(result.scenes)
        }
        setScenes(scenesList)
      }
    } catch (error) {
      console.error('Failed to refresh project:', error)
    }
  }

  const renameProject = async () => {
    if (!project || !projectName.trim() || projectName === project.name) {
      setIsEditingName(false)
      setProjectName(project?.name || "")
      return
    }

    try {
      // @ts-ignore
      const result = await window.ipcRenderer.invoke('rename-project', {
        projectId: project.id,
        newName: projectName
      })
      
      if (result.success) {
        setProject(result.project)
        toast({
          title: "Success",
          description: "Project renamed successfully",
          variant: "success",
        })
      }
    } catch (error) {
      console.error('Failed to rename project:', error)
      toast({
        title: "Error",
        description: "Failed to rename project",
        variant: "destructive",
      })
      setProjectName(project.name)
    } finally {
      setIsEditingName(false)
    }
  }

  return {
    project,
    projectName,
    setProjectName,
    isEditingName,
    setIsEditingName,
    scenes,
    setScenes,
    isLoading,
    fetchProject,
    refreshProject,
    renameProject
  }
}
