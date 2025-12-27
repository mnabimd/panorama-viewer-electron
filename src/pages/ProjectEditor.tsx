import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { 
  ChevronLeft, 
  Search, 
  Plus, 
  Play, 
  Trash2, 
  Pencil, 
  ChevronRight,
  Eye,
  EyeOff
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { HotspotDialog } from "@/components/HotspotDialog"
import { AddSceneDialog } from "@/components/AddSceneDialog"
import { useProject } from "@/hooks/useProject"
import { useHotspots } from "@/hooks/useHotspots"
import { useScenes } from "@/hooks/useScenes"
import { getHotspotIcon, getHotspotLabel } from "@/utils/hotspot.utils"
import { Hotspot } from "@/types/project.types"
import "./ProjectEditor.css"

export function ProjectEditor() {
  const navigate = useNavigate()
  const { id } = useParams()
  
  // Custom hooks
  const {
    project,
    projectName,
    setProjectName,
    isEditingName,
    setIsEditingName,
    scenes,
    setScenes,
    isLoading,
    refreshProject,
    renameProject
  } = useProject(id)

  const {
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
  } = useScenes(scenes, setScenes)

  const {
    hotspots,
    setHotspots,
    isHotspotDialogOpen,
    setIsHotspotDialogOpen,
    editingHotspot,
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
    handleDeleteAllHotspots
  } = useHotspots(project?.id, activeScene)

  // UI state
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true)

  // Load hotspots when active scene changes
  useEffect(() => {
    if (project && activeScene) {
      loadHotspotsForScene(project, activeScene)
    }
  }, [activeScene, project])

  // Set first scene as active when scenes load
  useEffect(() => {
    if (scenes.length > 0 && !activeScene && project) {
      setActiveScene(scenes[0].id)
      loadHotspotsForScene(project, scenes[0].id)
    }
  }, [scenes, activeScene, project])

  const toggleRightSidebar = () => setRightSidebarOpen(!rightSidebarOpen)

  if (isLoading || !project) {
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
                onBlur={renameProject}
                onKeyDown={(e) => e.key === 'Enter' && renameProject()}
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
                >
                  {scene.isVisible !== false ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Center Content */}
      <main className="editor-main">
        <div className="text-gray-500">360° Viewer Placeholder</div>
        
        {/* Right Sidebar Toggle Button - Outside sidebar so it's always visible */}
        <Button 
          variant="ghost" 
          size="icon"
          onClick={toggleRightSidebar}
          className="absolute top-4 right-4 z-10 bg-[#252525] hover:bg-[#333]"
        >
          {rightSidebarOpen ? <ChevronRight /> : <ChevronLeft />}
        </Button>
      </main>

      {/* Right Sidebar */}
      <aside className={`editor-sidebar-right ${!rightSidebarOpen ? 'collapsed' : ''}`}>
        <div className="right-sidebar-header">
          <Button variant="ghost" size="icon">
            <Play size={18} /> 
          </Button>
          <Button className="publish-btn" size="sm">
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
                  <span className="text-base font-normal">{getHotspotLabel(hotspot, scenes)}</span>
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
        onSubmit={(data) => handleSubmitHotspot(data, refreshProject)}
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
              onClick={() => handleDeleteHotspot(refreshProject)}
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
              onClick={() => handleDeleteAllHotspots(refreshProject)}
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
        onSceneAdded={() => handleSceneAdded(refreshProject)}
      />
    </div>
  )
}
