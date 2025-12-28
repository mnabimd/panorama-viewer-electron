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
  EyeOff,
  Save,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
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
    handleSceneAdded,
    renameScene,
    deleteScene
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
    handleDeleteAllHotspots,
    toggleAllHotspotsVisibility
  } = useHotspots(project?.id, activeScene)

  // UI state
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true)
  
  // Scene Settings state
  const [editingSceneName, setEditingSceneName] = useState(false)
  const [tempSceneName, setTempSceneName] = useState("")
  const [deleteSceneConfirmOpen, setDeleteSceneConfirmOpen] = useState(false)
  const [allHotspotsVisible, setAllHotspotsVisible] = useState(true)
  const [isDeletingScene, setIsDeletingScene] = useState(false)

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

  // Scene Settings handlers
  const currentScene = scenes.find(s => s.id === activeScene)

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

  const handleDeleteScene = async () => {
    if (!project || !activeScene || scenes.length <= 1) return
    
    setIsDeletingScene(true)
    try {
      const success = await deleteScene(project.id, activeScene, refreshProject)
      if (success) {
        // Select another scene after deletion
        const remainingScenes = scenes.filter(s => s.id !== activeScene)
        if (remainingScenes.length > 0) {
          setActiveScene(remainingScenes[0].id)
        }
        setDeleteSceneConfirmOpen(false)
      }
    } finally {
      setIsDeletingScene(false)
    }
  }

  const handleToggleAllHotspots = async (checked: boolean) => {
    if (project && activeScene) {
      setAllHotspotsVisible(checked)
      await toggleAllHotspotsVisibility(checked, refreshProject)
    }
  }

  const handleToggleHotspotVisibility = async (hotspotId: string, isVisible: boolean) => {
    if (project && activeScene) {
      try {
        // @ts-ignore
        await window.ipcRenderer.invoke('toggle-hotspot-visibility', {
          projectId: project.id,
          sceneId: activeScene,
          hotspotId,
          isVisible
        })
        await refreshProject()
      } catch (error) {
        console.error('Failed to toggle hotspot visibility:', error)
      }
    }
  }

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
                className="cursor-pointer text-gray-500 hover:text-white shrink-0 ml-auto"
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
                  style={{ opacity: scene.isVisible !== false ? 1 : 0.15 }}
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

        <Accordion type="multiple" defaultValue={["scene-settings", "hotspots"]} className="px-4">
          {/* Scene Settings Section */}
          <AccordionItem value="scene-settings" className="border-gray-700">
            <AccordionTrigger className="text-sm text-gray-400 hover:text-white py-3">
              Scene Settings
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              {currentScene ? (
                <>
                  {/* Scene Name */}
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-400">Scene Name</Label>
                    {editingSceneName ? (
                      <div className="flex gap-2">
                        <Input
                          value={tempSceneName}
                          onChange={(e) => setTempSceneName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveSceneName()}
                          className="bg-[#252525] border-gray-700 text-white text-sm"
                          autoFocus
                        />
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={handleSaveSceneName}
                          className="shrink-0"
                        >
                          <Save size={16} />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={handleCancelEditSceneName}
                          className="shrink-0"
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    ) : (
                      <div 
                        className="flex items-center justify-between p-2 bg-[#252525] rounded-md cursor-pointer hover:bg-[#2a2a2a]"
                        onClick={handleStartEditSceneName}
                      >
                        <span className="text-sm">{currentScene.name}</span>
                        <Pencil size={14} className="text-gray-500" />
                      </div>
                    )}
                  </div>

                  {/* Scene Visibility */}
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-gray-400">Show Scene</Label>
                    <Switch
                      checked={currentScene.isVisible !== false}
                      onCheckedChange={(checked) => toggleSceneVisibility({ stopPropagation: () => {} } as React.MouseEvent, activeScene)}
                    />
                  </div>

                  {/* All Hotspots Visibility */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-xs text-gray-400">Show All Hotspots</Label>
                      <p className="text-xs text-gray-600">{hotspots.length} hotspot{hotspots.length !== 1 ? 's' : ''}</p>
                    </div>
                    <Switch
                      checked={allHotspotsVisible}
                      onCheckedChange={handleToggleAllHotspots}
                    />
                  </div>

                  {/* Delete Scene */}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={() => setDeleteSceneConfirmOpen(true)}
                    disabled={scenes.length <= 1 || isDeletingScene}
                  >
                    <Trash2 size={16} className="mr-2" />
                    {isDeletingScene ? 'Deleting...' : 'Delete Scene'}
                  </Button>
                  {scenes.length <= 1 && (
                    <p className="text-xs text-gray-600 text-center">Cannot delete the only scene</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500">No scene selected</p>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Hotspots Section */}
          <AccordionItem value="hotspots" className="border-gray-700">
            <AccordionTrigger className="text-sm text-gray-400 hover:text-white py-3">
              Hotspots
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{hotspots.length} Hotspot{hotspots.length !== 1 ? 's' : ''}</span>
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
                className="w-full bg-orange-500 hover:bg-orange-600"
                size="sm"
              >
                <Plus size={16} className="mr-2" /> Add Hotspot
              </Button>

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
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleHotspotVisibility(hotspot.id, !(hotspot.isVisible ?? true))
                        }}
                        title={hotspot.isVisible !== false ? "Hide hotspot" : "Show hotspot"}
                      >
                        {hotspot.isVisible !== false ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
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
            </AccordionContent>
          </AccordionItem>
        </Accordion>
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

      {/* Delete Scene Confirmation Dialog */}
      <AlertDialog open={deleteSceneConfirmOpen} onOpenChange={setDeleteSceneConfirmOpen}>
        <AlertDialogContent className="bg-[#1a1a1a] text-white border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Scene</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete "{currentScene?.name}"? This will delete the scene image file, all hotspots in this scene, and remove it from the project. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-[#252525] border-gray-700 hover:bg-[#333]"
              disabled={isDeletingScene}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteScene}
              className="bg-red-500 hover:bg-red-600"
              disabled={isDeletingScene}
            >
              {isDeletingScene ? 'Deleting...' : 'Delete Scene'}
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
