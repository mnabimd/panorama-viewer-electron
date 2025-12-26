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
  EyeOff
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import "./ProjectEditor.css"

// Dummy data for initial render, will be replaced/merged with real data logic later
const DUMMY_SCENES = [
  { id: '1', name: 'kitchen', image: '/_dummy_reusable_data/_dummy2.jpg', isVisible: true },
  { id: '2', name: 'bathroom', image: '/_dummy_reusable_data/_dummy2.jpg', isVisible: true },
]

const DUMMY_HOTSPOTS = [
  { id: '1', name: 'kitchen' },
  { id: '2', name: 'bath' },
  { id: '3', name: 'room' },
]

export function ProjectEditor() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { toast } = useToast()
  
  const [project, setProject] = useState<any>(null)
  const [projectName, setProjectName] = useState("")
  const [isEditingName, setIsEditingName] = useState(false)
  
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true)
  
  const [scenes, setScenes] = useState(DUMMY_SCENES)
  const [activeScene, setActiveScene] = useState('1')
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return
      try {
        // @ts-ignore
        const result = await window.ipcRenderer.invoke('get-project-by-id', id)
        if (result) {
          setProject(result)
          setProjectName(result.name)
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

          <Button className="new-image-btn">
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
                  src={scene.image} 
                  alt={scene.name} 
                  className="scene-thumbnail" 
                  style={{ opacity: scene.isVisible ? 1 : 0.4 }}
                />
                <div className="scene-name">{scene.name}</div>
                
                <button 
                  className={`visibility-toggle ${!scene.isVisible ? 'is-hidden' : ''}`}
                  onClick={(e) => toggleSceneVisibility(e, scene.id)}
                  title={scene.isVisible ? "Hide scene" : "Show scene"}
                >
                  {scene.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
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
            <span className="delete-all-btn">Delete All</span>
          </div>

          <div className="text-xs text-gray-500 mb-2">{DUMMY_HOTSPOTS.length} Hotspot</div>

          <div className="hotspot-list">
            {DUMMY_HOTSPOTS.map((hotspot) => (
              <div key={hotspot.id} className="hotspot-item">
                <div className="hotspot-info">
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                  <span>{hotspot.name}</span>
                </div>
                <div className="hotspot-actions">
                  <button className="hotspot-action-btn">
                    <Pencil size={14} />
                  </button>
                  <button className="hotspot-action-btn text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}
