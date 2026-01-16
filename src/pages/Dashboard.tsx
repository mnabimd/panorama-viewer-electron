import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Settings, Image as ImageIcon, Upload, Download } from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useMenuActions } from "@/hooks/useMenuActions"
import { useCategories, Category } from "@/hooks/useCategories"
import { SettingsDialog } from "@/components/SettingsDialog"
import { BackupProgressDialog } from "@/components/BackupProgressDialog"
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
  
  // Category management states
  const { categories, addCategory, removeCategory, checkCategoryUsage, migrateProjectsCategory } = useCategories()
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [categoryUsageCount, setCategoryUsageCount] = useState(0)
  const [isDeleteCategoryDialogOpen, setIsDeleteCategoryDialogOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Initialize menu actions (without projectId since we're on Dashboard)
  const { handleImportProject } = useMenuActions()

  // Listen for menu-triggered new project event and project import
  useEffect(() => {
    const handleNewProjectEvent = () => {
      onNewProject()
    }

    const handleProjectImported = () => {
      onRefresh()
    }

    window.addEventListener('open-new-project-dialog', handleNewProjectEvent)
    window.addEventListener('project-imported', handleProjectImported)
    return () => {
      window.removeEventListener('open-new-project-dialog', handleNewProjectEvent)
      window.removeEventListener('project-imported', handleProjectImported)
    }
  }, [onNewProject, onRefresh])

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

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return

    const result = await addCategory(newCategoryName)
    if (result.success) {
      toast({
        title: "Category added",
        description: `Category "${newCategoryName}" has been added.`,
        variant: "success",
      })
      setIsAddCategoryOpen(false)
      setNewCategoryName("")
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to add category",
        variant: "destructive",
      })
    }
  }

  const initiateDeleteCategory = async (category: Category) => {
    const count = await checkCategoryUsage(category.id)
    setCategoryToDelete(category)
    setCategoryUsageCount(count)
    setIsDeleteCategoryDialogOpen(true)
  }

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return

    try {
      if (categoryUsageCount > 0) {
        // Migrate projects to 'other'
        await migrateProjectsCategory(categoryToDelete.id, 'other')
      }

      const result = await removeCategory(categoryToDelete.id)
      if (result.success) {
        toast({
          title: "Category deleted",
          description: `Category "${categoryToDelete.label}" has been deleted.`,
        })
        // Reset filter if we were on the deleted category
        if (filter === categoryToDelete.id) {
          setFilter('all')
        }
        // Refresh projects to reflect migration
        onRefresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete category",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Failed to delete category:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsDeleteCategoryDialogOpen(false)
      setCategoryToDelete(null)
    }
  }

  const handleExportProject = async (project: Project) => {
    setIsExporting(true)
    try {
      // @ts-ignore
      const result = await window.ipcRenderer.invoke('export-project', project.id)
      if (result.success) {
        toast({
          title: "Project exported",
          description: `Project exported to ${result.filePath}`,
          variant: "success",
        })
      } else if (!result.canceled) {
        throw new Error('Export failed')
      }
    } catch (error) {
      console.error('Failed to export project:', error)
      toast({
        title: "Error",
        description: "Failed to export project.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
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
            onClick={handleImportProject}
            variant="outline"
            className="mr-2"
          >
            <Upload size={18} className="mr-2" /> Import
          </Button>

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
            {categories.map((cat) => (
              cat.isCustom ? (
                <ContextMenu key={cat.id}>
                  <ContextMenuTrigger>
                    <button
                      className={`filter-btn ${filter === cat.id ? 'active' : ''}`}
                      onClick={() => setFilter(cat.id)}
                    >
                      {cat.label}
                    </button>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem 
                      className="text-red-600 focus:text-red-600 focus:bg-red-100"
                      onClick={() => initiateDeleteCategory(cat)}
                    >
                      Delete Category
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ) : (
                <button
                  key={cat.id}
                  className={`filter-btn ${filter === cat.id ? 'active' : ''}`}
                  onClick={() => setFilter(cat.id)}
                >
                  {cat.label}
                </button>
              )
            ))}
            <button className="add-btn" onClick={() => setIsAddCategoryOpen(true)}>
              <Plus size={16} />
            </button>
          </div>

          {/* Total Projects Label */}
          <div className="total-projects-label">
            Total {filteredProjects.length} Project{filteredProjects.length !== 1 ? 's' : ''}
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
                          <img src={`file://${displayScene.thumbnail || displayScene.imagePath}`} alt={project.name} />
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

      {/* Add Category Dialog */}
      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="col-span-3"
                placeholder="Category Name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleAddCategory}>Add Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation Dialog */}
      <AlertDialog open={isDeleteCategoryDialogOpen} onOpenChange={setIsDeleteCategoryDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the category "{categoryToDelete?.label}"?
              {categoryUsageCount > 0 && (
                <div className="mt-2 text-amber-500 font-medium">
                  Warning: This category is used by {categoryUsageCount} project{categoryUsageCount !== 1 ? 's' : ''}.
                  These projects will be moved to the "Other" category.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteCategory}
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

      <BackupProgressDialog open={isExporting} onOpenChange={() => {}} />
    </div>
  )
}
