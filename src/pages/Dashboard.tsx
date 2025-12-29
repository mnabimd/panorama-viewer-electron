import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Settings, Image as ImageIcon, Eye, Share2, Folder } from "lucide-react"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { PROJECT_CATEGORIES } from "@/constants"
import { SettingsDialog } from "@/components/SettingsDialog"
import "./Dashboard.css"

interface Project {
  id: string
  name: string
  description: string
  scenes: Record<string, any>
  updatedAt: string
  path: string
  category?: string
}

interface DashboardProps {
  projects: Project[]
  onNewProject: () => void
  onRefresh: () => void
}

export function Dashboard({ projects, onNewProject, onRefresh }: DashboardProps) {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [filter, setFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const handleWorkspaceChanged = () => {
    // Refresh projects when workspace changes
    onRefresh()
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    // @ts-ignore - project might have category from creation
    const matchesFilter = filter === 'all' || project.category === filter
    
    return matchesSearch && matchesFilter
  })

  const handleDeleteProject = async () => {
    if (!projectToDelete) return

    try {
      // @ts-ignore
      const result = await window.ipcRenderer.invoke('delete-project', projectToDelete.path)
      if (result.success) {
        toast({
          title: "Project deleted",
          description: `Project "${projectToDelete.name}" has been deleted.`,
        })
        onRefresh()
      }
    } catch (error) {
      console.error('Failed to delete project:', error)
      toast({
        title: "Error",
        description: "Failed to delete project.",
        variant: "destructive",
      })
    } finally {
      setProjectToDelete(null)
    }
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <h1 className="app-title">360 Panorama Viewer</h1>
        
        <div className="header-actions">
          <div className="search-container">
            <Search className="search-icon" size={18} />
            <Input 
              type="text" 
              placeholder="Search" 
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Button 
            onClick={onNewProject}
            className="new-project-btn-header"
          >
            New Project <Plus size={18} className="ml-1" />
          </Button>

          <Button
            onClick={() => setSettingsOpen(true)}
            variant="ghost"
            size="icon"
            className="h-9 w-9"
          >
            <Settings size={18} />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="projects-section">
          <div className="filter-bar">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            {PROJECT_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`filter-btn ${filter === cat.id ? 'active' : ''}`}
                onClick={() => setFilter(cat.id)}
              >
                {cat.label}
              </button>
            ))}
            <button className="add-btn" onClick={onNewProject}>
              <Plus size={16} />
            </button>
          </div>

          <div className="projects-grid">
            {filteredProjects.map((project) => (
              <ContextMenu key={project.id}>
                <ContextMenuTrigger>
                  <div 
                    className="project-card cursor-pointer"
                    onClick={() => navigate(`/project/${project.id}`)}
                  >
                    <div className="card-thumbnail">
                      {Object.keys(project.scenes || {}).length === 0 ? (
                        <div className="thumbnail-placeholder">
                          <ImageIcon size={32} />
                          <span>Add your first scene</span>
                        </div>
                      ) : (() => {
                        // Find the featured scene
                        const scenes = Object.values(project.scenes || {})
                        const featuredScene = scenes.find((s: any) => s.isFeatured === true)
                        const displayScene = featuredScene || scenes[0]
                        
                        return displayScene?.imagePath ? (
                          <img src={`file://${displayScene.imagePath}`} alt={project.name} />
                        ) : (
                          <div className="thumbnail-placeholder">
                            <ImageIcon size={32} />
                            <span>No Preview</span>
                          </div>
                        )
                      })()}
                    </div>
                    <div className="card-content">
                      <div className="card-tags">
                        <span className="tag">
                          <ImageIcon size={12} />
                          {Object.keys(project.scenes || {}).length}
                        </span>
                        <span className="tag">Draft</span>
                      </div>
                      <h3 className="project-title">{project.name}</h3>
                      <p className="project-desc">{project.description || "No description"}</p>
                    </div>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem>Open</ContextMenuItem>
                  <ContextMenuItem>View Info</ContextMenuItem>
                  <ContextMenuItem 
                    className="text-red-600 focus:text-red-600 focus:bg-red-100"
                    onClick={() => setProjectToDelete(project)}
                  >
                    Delete
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </div>
        </div>

        {/* Statistics Section */}
        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-icon">
              <Folder size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{projects.length}</span>
              <span className="stat-label">Total Projects</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <ImageIcon size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value">156</span>
              <span className="stat-label">360° Images</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <Eye size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value">2.1k</span>
              <span className="stat-label">Total Views</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <Share2 size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value">12</span>
              <span className="stat-label">Publish Projects</span>
            </div>
          </div>
        </div>
      </main>

      <AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project
              "{projectToDelete?.name}" and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteProject}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onWorkspaceChanged={handleWorkspaceChanged}
      />
    </div>
  )
}
