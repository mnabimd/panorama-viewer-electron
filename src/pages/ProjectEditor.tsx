import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { 
  ChevronLeft, 
  Search, 
  Plus, 
  Play, 
  Trash2, 
  Pencil, 
  Image as ImageIcon,
  ChevronRight,
  ChevronLeft as ChevronLeftIcon,
  Eye,
  EyeOff,
  Link2,
  Info,
  MapPin
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { HotspotDialog } from "@/components/HotspotDialog"
import { AddSceneDialog } from "@/components/AddSceneDialog"
import "./ProjectEditor.css"

// Hotspot types
type HotspotType = 'scene' | 'info' | 'url'

interface BaseHotspot {
  id: string
  type: HotspotType
  position: {
    yaw: number
    pitch: number
  }
  tooltip?: string
}

interface SceneHotspot extends BaseHotspot {
  type: 'scene'
  targetSceneId: string
  transition?: 'fade' | 'slide' | 'none'
}

interface InfoHotspot extends BaseHotspot {
  type: 'info'
  title: string
  content: string
  imageUrl?: string
}

interface UrlHotspot extends BaseHotspot {
  type: 'url'
  url: string
  openInNewTab?: boolean
}

type Hotspot = SceneHotspot | InfoHotspot | UrlHotspot

interface Scene {
  id: string
  name: string
  imagePath: string
  hotspots: Hotspot[]
  thumbnail?: string
  description?: string
  isVisible?: boolean
}

export function ProjectEditor() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { toast } = useToast()
  
  const [project, setProject] = useState<any>(null)
  const [projectName, setProjectName] = useState("")
  const [isEditingName, setIsEditingName] = useState(false)
  
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true)
  
  const [scenes, setScenes] = useState<Scene[]>([])
  const [activeScene, setActiveScene] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState("")
  
  // Hotspot management state
  const [hotspots, setHotspots] = useState<Hotspot[]>([])
  const [isHotspotDialogOpen, setIsHotspotDialogOpen] = useState(false)
  const [editingHotspot, setEditingHotspot] = useState<Hotspot | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState(false)
  const [hotspotToDelete, setHotspotToDelete] = useState<string | null>(null)
  
  // Add scene dialog state
  const [isAddSceneDialogOpen, setIsAddSceneDialogOpen] = useState(false)

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return
      try {
        // @ts-ignore
        const result = await window.ipcRenderer.invoke('get-project-by-id', id)
        if (result) {
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
          
          // Set first scene as active if available
          if (scenesList.length > 0 && !activeScene) {
            setActiveScene(scenesList[0].id)
            loadHotspotsForScene(result, scenesList[0].id)
          }
        } else {
          toast({
            title: "Error",
            description: "Project not found",
            variant: "destructive",
          })
          navigate('/')
        }
      } catch (error) {
        console.error('Failed to fetch project:', error)
        toast({
          title: "Error",
          description: "Failed to load project",
          variant: "destructive",
        })
      }
    }
    fetchProject()
  }, [id, navigate, toast])

  // Load hotspots when active scene changes
  useEffect(() => {
    if (project && activeScene) {
      loadHotspotsForScene(project, activeScene)
    }
  }, [activeScene, project])

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

  const refreshProject = async () => {
    if (!id) return
    try {
      // @ts-ignore
      const result = await window.ipcRenderer.invoke('get-project-by-id', id)
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
        
        loadHotspotsForScene(result, activeScene)
      }
    } catch (error) {
      console.error('Failed to refresh project:', error)
    }
  }

  const handleRename = async () => {
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

  const toggleRightSidebar = () => setRightSidebarOpen(!rightSidebarOpen)

  const toggleSceneVisibility = (e: React.MouseEvent, sceneId: string) => {
    e.stopPropagation()
    setScenes(prev => prev.map(s => 
      s.id === sceneId ? { ...s, isVisible: !s.isVisible } : s
    ))
  }

  const filteredScenes = scenes.filter(scene => 
    scene.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Hotspot management handlers
  const handleAddHotspot = () => {
    setEditingHotspot(null)
    setIsHotspotDialogOpen(true)
  }

  const handleEditHotspot = (hotspot: Hotspot) => {
    setEditingHotspot(hotspot)
    setIsHotspotDialogOpen(true)
  }

  const handleSubmitHotspot = async (hotspotData: Omit<Hotspot, 'id'>) => {
    try {
      if (editingHotspot) {
        // Update existing hotspot
        // @ts-ignore
        await window.ipcRenderer.invoke('update-hotspot', {
          projectId: project.id,
          sceneId: activeScene,
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
          projectId: project.id,
          sceneId: activeScene,
          hotspotData
        })
        toast({
          title: "Success",
          description: "Hotspot added successfully",
          variant: "success",
        })
      }
      await refreshProject()
      setIsHotspotDialogOpen(false)
    } catch (error) {
      console.error('Failed to submit hotspot:', error)
      toast({
        title: "Error",
        description: "Failed to save hotspot",
        variant: "destructive",
      })
    }
  }

  const handleDeleteHotspot = async () => {
    if (!hotspotToDelete) return
    
    try {
      // @ts-ignore
      await window.ipcRenderer.invoke('delete-hotspot', {
        projectId: project.id,
        sceneId: activeScene,
        hotspotId: hotspotToDelete
      })
      toast({
        title: "Success",
        description: "Hotspot deleted successfully",
        variant: "success",
      })
      await refreshProject()
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

  const handleDeleteAllHotspots = async () => {
    try {
      // @ts-ignore
      await window.ipcRenderer.invoke('delete-all-hotspots', {
        projectId: project.id,
        sceneId: activeScene
      })
      toast({
        title: "Success",
        description: "All hotspots deleted successfully",
        variant: "success",
      })
      await refreshProject()
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

  const getHotspotIcon = (type: HotspotType) => {
    switch (type) {
      case 'scene': return <MapPin size={18} className="text-blue-400" />
      case 'info': return <Info size={18} className="text-green-400" />
      case 'url': return <Link2 size={18} className="text-purple-400" />
    }
  }

  const getHotspotLabel = (hotspot: Hotspot) => {
    if (hotspot.type === 'scene') {
      const targetScene = scenes.find(s => s.id === hotspot.targetSceneId)
      return targetScene?.name || 'Unknown Scene'
    } else if (hotspot.type === 'info') {
      return hotspot.title
    } else if (hotspot.type === 'url') {
      return hotspot.url.length > 30 ? hotspot.url.substring(0, 30) + '...' : hotspot.url
    }
    return 'Hotspot'
  }

  const handleNewImage = () => {
    setIsAddSceneDialogOpen(true)
  }

  const handleSceneAdded = async () => {
    await refreshProject()
    setIsAddSceneDialogOpen(false)
    toast({
      title: "Success",
      description: "Scene added successfully",
      variant: "success",
    })
  }

  if (!project) {
    return <div className="flex items-center justify-center h-screen bg-[#1a1a1a] text-white">Loading...</div>
  }

  return (
    <div className="project-editor">
      {/* Custom Left Sidebar */}
      <aside className="editor-sidebar-left">
        <div className="sidebar-header-content">
          <Button 
            variant="ghost" 
            size="icon" 
            className="back-btn"
            onClick={() => navigate('/')}
          >
            <ChevronLeft />
          </Button>
          
          <div className="project-name-container">
            {isEditingName ? (
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                autoFocus
                className="edit-name-input"
              />
            ) : (
              <span 
                className="project-name" 
                onClick={() => setIsEditingName(true)}
                title={projectName}
              >
                {projectName}
              </span>
            )}
            {!isEditingName && (
              <Pencil 
                size={14} 
                className="cursor-pointer text-gray-500 hover:text-white shrink-0"
                onClick={() => setIsEditingName(true)} 
              />
            )}
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-2 mb-4 bg-[#333] p-2 rounded-md">
            <Search size={16} className="text-gray-400" />
            <input 
              type="text" 
              placeholder="Search" 
              className="bg-transparent border-none outline-none text-sm w-full text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Button className="new-image-btn" onClick={handleNewImage}>
            <Plus size={16} className="mr-2" /> New Image
          </Button>

          <div className="add-item-section">
            <Plus size={16} /> Add item
          </div>

          <div className="scene-list">
            {filteredScenes.map((scene) => (
              <div 
                key={scene.id} 
                className={`scene-item ${activeScene === scene.id ? 'active' : ''}`}
                onClick={() => setActiveScene(scene.id)}
              >
                <img 
                  src={`file://${scene.imagePath}`}
                  alt={scene.name} 
                  className="scene-thumbnail" 
                  style={{ opacity: scene.isVisible !== false ? 1 : 0.4 }}
                />
                <div className="scene-name">{scene.name}</div>
                
                <button 
                  className={`visibility-toggle ${scene.isVisible === false ? 'is-hidden' : ''}`}
                  onClick={(e) => toggleSceneVisibility(e, scene.id)}
                  title={scene.isVisible !== false ? "Hide scene" : "Show scene"}
                >
                  {scene.isVisible !== false ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>

                {activeScene === scene.id && (
                  <div className="absolute top-1 left-1 text-white">
                    <ImageIcon size={14} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="editor-main">
        {/* Right Sidebar Toggle (when collapsed) */}
        {!rightSidebarOpen && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10 bg-[#252525] text-white hover:bg-[#333]"
            onClick={toggleRightSidebar}
          >
            <ChevronLeftIcon />
          </Button>
        )}
        
        <div className="text-gray-500">
          {/* 360 Viewer Placeholder */}
          Select a scene to view
        </div>
      </main>

      {/* Right Sidebar (Custom) */}
      <aside className={`editor-sidebar-right ${rightSidebarOpen ? '' : 'collapsed'}`}>
        <div className="right-sidebar-header">
           <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleRightSidebar}
            className="text-gray-400 hover:text-white mr-auto"
          >
            <ChevronRight />
          </Button>

          <Button variant="ghost" size="icon" className="text-orange-500">
            <Play />
          </Button>
          <Button className="publish-btn">
            Publish
          </Button>
        </div>

        <div className="hotspots-section">
          <div className="hotspots-header">
            <span>Hotspots</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="delete-all-btn text-red-500 hover:text-red-400 h-auto p-0"
              onClick={() => hotspots.length > 0 && setDeleteAllConfirmOpen(true)}
              disabled={hotspots.length === 0}
            >
              Delete All
            </Button>
          </div>

          <Button 
            onClick={handleAddHotspot} 
            className="w-full mb-3 bg-orange-500 hover:bg-orange-600"
            size="sm"
          >
            <Plus size={16} className="mr-2" /> Add Hotspot
          </Button>

          <div className="text-xs text-gray-500 mb-2">{hotspots.length} Hotspot{hotspots.length !== 1 ? 's' : ''}</div>

          <div className="hotspot-list">
            {hotspots.map((hotspot) => (
              <div key={hotspot.id} className="hotspot-item">
                <div className="hotspot-info">
                  {getHotspotIcon(hotspot.type)}
                  <span className="text-base font-normal">{getHotspotLabel(hotspot)}</span>
                </div>
                <div className="hotspot-actions">
                  <button 
                    className="hotspot-action-btn"
                    onClick={() => handleEditHotspot(hotspot)}
                  >
                    <Pencil size={18} />
                  </button>
                  <button 
                    className="hotspot-action-btn text-red-500"
                    onClick={() => {
                      setHotspotToDelete(hotspot.id)
                      setDeleteConfirmOpen(true)
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Hotspot Dialog */}
      <HotspotDialog
        open={isHotspotDialogOpen}
        onOpenChange={setIsHotspotDialogOpen}
        mode={editingHotspot ? 'edit' : 'add'}
        existingHotspot={editingHotspot || undefined}
        availableScenes={scenes}
        onSubmit={handleSubmitHotspot}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="bg-[#1a1a1a] text-white border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Hotspot</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete this hotspot? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#252525] border-gray-700 hover:bg-[#333]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteHotspot}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Confirmation Dialog */}
      <AlertDialog open={deleteAllConfirmOpen} onOpenChange={setDeleteAllConfirmOpen}>
        <AlertDialogContent className="bg-[#1a1a1a] text-white border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Hotspots</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete all {hotspots.length} hotspot{hotspots.length !== 1 ? 's' : ''} from this scene? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#252525] border-gray-700 hover:bg-[#333]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAllHotspots}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Scene Dialog */}
      <AddSceneDialog
        open={isAddSceneDialogOpen}
        onOpenChange={setIsAddSceneDialogOpen}
        projectId={project.id}
        existingScenes={scenes}
        onSceneAdded={handleSceneAdded}
      />
    </div>
  )
}
