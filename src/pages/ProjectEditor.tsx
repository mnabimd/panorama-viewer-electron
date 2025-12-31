import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { EditorLeftSidebar } from "@/components/EditorLeftSidebar"
import { EditorRightSidebarHeader } from "@/components/EditorRightSidebarHeader"
import { SceneSettingsPanel } from "@/components/SceneSettingsPanel"
import { HotspotsPanel } from "@/components/HotspotsPanel"
import { EditorDialogs } from "@/components/EditorDialogs"
import { PanoramaViewer } from "@/components/PanoramaViewer"
import { useProject } from "@/hooks/useProject"
import { useHotspots } from "@/hooks/useHotspots"
import { useScenes } from "@/hooks/useScenes"
import { useSceneSettings } from "@/hooks/useSceneSettings"
import { useToast } from "@/hooks/use-toast"
import "./ProjectEditor.css"

export function ProjectEditor() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { toast } = useToast()
  
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

  const {
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
    handleUpdateCoordinates
  } = useSceneSettings({
    project,
    activeScene,
    scenes,
    renameScene,
    deleteScene,
    refreshProject
  })

  // UI state
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true)
  const [isAddingHotspot, setIsAddingHotspot] = useState(false)
  const [pendingHotspotPosition, setPendingHotspotPosition] = useState<{yaw: number; pitch: number} | null>(null)
  const [isUploadingScene, setIsUploadingScene] = useState(false)

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

  // Handle image drop from drag-and-drop card
  const handleImageDrop = async (filePath: string) => {
    if (!project) return
    
    try {
      // Get current scene count from the project state
      const currentSceneCount = scenes.length
      const sceneName = `Scene ${currentSceneCount + 1}`
      
      // @ts-ignore
      const result = await window.ipcRenderer.invoke('add-scene', {
        projectId: project.id,
        sceneName,
        imagePath: filePath,
        isNewUpload: true
      })
      
      if (result.success) {
        await refreshProject()
        setActiveScene(result.scene.id)
        toast({
          title: "Success",
          description: `${sceneName} added successfully`,
          variant: "success",
        })
      }
    } catch (error) {
      console.error('Failed to add scene:', error)
      toast({
        title: "Error",
        description: "Failed to add scene",
        variant: "destructive",
      })
    }
  }

  // Handle scene deletion with active scene update
  const handleDeleteSceneWrapper = async () => {
    const success = await handleDeleteScene()
    if (success) {
      // Select another scene after deletion
      const remainingScenes = scenes.filter(s => s.id !== activeScene)
      if (remainingScenes.length > 0) {
        setActiveScene(remainingScenes[0].id)
      }
    }
  }

  // Handle delete all scenes with active scene update
  const handleDeleteAllScenesWrapper = async () => {
    const success = await handleDeleteAllScenes()
    if (success && scenes.length > 0) {
      setActiveScene(scenes[0].id)
    }
  }

  // Handle hotspot visibility toggle
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

  // Handle panorama click for adding hotspot
  const handlePanoramaClick = (position: { yaw: number; pitch: number }) => {
    if (isAddingHotspot) {
      setPendingHotspotPosition(position)
      setIsHotspotDialogOpen(true)
      setIsAddingHotspot(false)
    }
  }

  // Handle scene hotspot click for navigation
  const handleSceneHotspotClick = (targetSceneId: string) => {
    setActiveScene(targetSceneId)
  }

  // Handle regular hotspot click (info/url)
  const handleHotspotClickInViewer = (hotspot: any) => {
    if (hotspot.type === 'url') {
      // @ts-ignore
      window.ipcRenderer.invoke('open-external-url', hotspot.url)
    } else if (hotspot.type === 'info') {
      // Could open an info modal here
      alert(`${hotspot.title}\n\n${hotspot.content}`)
    }
  }

  if (isLoading || !project) {
    return <div className="flex items-center justify-center h-screen bg-[#1a1a1a] text-white">Loading...</div>
  }

  return (
    <div className="project-editor">
      {/* Left Sidebar */}
      <EditorLeftSidebar
        projectName={projectName}
        isEditingName={isEditingName}
        searchQuery={searchQuery}
        scenes={scenes}
        filteredScenes={filteredScenes}
        activeScene={activeScene}
        onNavigateBack={() => navigate('/')}
        onProjectNameChange={setProjectName}
        onStartEditName={() => setIsEditingName(true)}
        onRenameProject={renameProject}
        onSearchChange={setSearchQuery}
        onSceneSelect={setActiveScene}
        onToggleSceneVisibility={(e, sceneId) => project && toggleSceneVisibility(e, project.id, sceneId)}
        onDeleteAllScenes={() => setDeleteAllScenesConfirmOpen(true)}
        onAddFromGallery={() => setIsAddSceneDialogOpen(true)}
        onImageDrop={handleImageDrop}
        isUploadingScene={isUploadingScene}
      />

      {/* Center Content */}
      <main className="editor-main">
        {currentScene && (
          <PanoramaViewer
            scene={currentScene}
            hotspots={hotspots}
            isAddingHotspot={isAddingHotspot}
            onHotspotClick={handleHotspotClickInViewer}
            onPanoramaClick={handlePanoramaClick}
            onSceneHotspotClick={handleSceneHotspotClick}
            onCancelPicking={() => setIsAddingHotspot(false)}
          />
        )}
        
        {/* Right Sidebar Toggle Button */}
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
        <EditorRightSidebarHeader />

        <Accordion type="multiple" defaultValue={["scene-settings", "hotspots"]} className="px-4">
          {/* Scene Settings Section */}
          <AccordionItem value="scene-settings" className="border-gray-700">
            <AccordionTrigger className="text-sm text-gray-400 hover:text-white py-3">
              Scene Settings
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <SceneSettingsPanel
                currentScene={currentScene}
                scenes={scenes}
                activeScene={activeScene}
                allHotspotsVisible={allHotspotsVisible}
                hotspots={hotspots}
                editingSceneName={editingSceneName}
                tempSceneName={tempSceneName}
                isDeletingScene={isDeletingScene}
                onTempSceneNameChange={setTempSceneName}
                onStartEditSceneName={handleStartEditSceneName}
                onSaveSceneName={handleSaveSceneName}
                onCancelEditSceneName={handleCancelEditSceneName}
                onToggleSceneVisibility={(e, sceneId) => project && toggleSceneVisibility(e, project.id, sceneId)}
                onToggleFeatured={handleToggleFeatured}
                onToggleAllHotspots={handleToggleAllHotspots}
                onReplaceImage={handleReplaceImage}
                onDeleteScene={() => setDeleteSceneConfirmOpen(true)}
                onUpdateCoordinates={handleUpdateCoordinates}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Hotspots Section */}
          <AccordionItem value="hotspots" className="border-gray-700">
            <AccordionTrigger className="text-sm text-gray-400 hover:text-white py-3">
              Hotspots
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <HotspotsPanel
                hotspots={hotspots}
                scenes={scenes}
                onAddHotspot={() => handleAddHotspot(() => setIsAddingHotspot(true))}
                onEditHotspot={handleEditHotspot}
                onToggleHotspotVisibility={handleToggleHotspotVisibility}
                onDeleteHotspot={(hotspotId) => {
                  setHotspotToDelete(hotspotId)
                  setDeleteConfirmOpen(true)
                }}
                onDeleteAllHotspots={() => setDeleteAllConfirmOpen(true)}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </aside>

      {/* All Dialogs */}
      <EditorDialogs
        isHotspotDialogOpen={isHotspotDialogOpen}
        setIsHotspotDialogOpen={setIsHotspotDialogOpen}
        editingHotspot={editingHotspot}
        pendingHotspotPosition={pendingHotspotPosition}
        onHotspotDialogClose={() => setPendingHotspotPosition(null)}
        scenes={scenes}
        onSubmitHotspot={(data) => handleSubmitHotspot(data, refreshProject)}
        deleteConfirmOpen={deleteConfirmOpen}
        setDeleteConfirmOpen={setDeleteConfirmOpen}
        onDeleteHotspot={() => handleDeleteHotspot(refreshProject)}
        deleteAllConfirmOpen={deleteAllConfirmOpen}
        setDeleteAllConfirmOpen={setDeleteAllConfirmOpen}
        hotspots={hotspots}
        onDeleteAllHotspots={() => handleDeleteAllHotspots(refreshProject)}
        deleteSceneConfirmOpen={deleteSceneConfirmOpen}
        setDeleteSceneConfirmOpen={setDeleteSceneConfirmOpen}
        currentScene={currentScene}
        isDeletingScene={isDeletingScene}
        onDeleteScene={handleDeleteSceneWrapper}
        deleteAllScenesConfirmOpen={deleteAllScenesConfirmOpen}
        setDeleteAllScenesConfirmOpen={setDeleteAllScenesConfirmOpen}
        onDeleteAllScenes={handleDeleteAllScenesWrapper}
        isReplaceImageOpen={isReplaceImageOpen}
        setIsReplaceImageOpen={setIsReplaceImageOpen}
        replaceImagePath={replaceImagePath}
        replaceSceneId={replaceSceneId}
        isReplacingImage={isReplacingImage}
        activeScene={activeScene}
        onImageSelect={handleImageSelect}
        onConfirmReplaceImage={handleConfirmReplaceImage}
        isAddSceneDialogOpen={isAddSceneDialogOpen}
        setIsAddSceneDialogOpen={setIsAddSceneDialogOpen}
        projectId={project.id}
        onSceneAdded={() => handleSceneAdded(refreshProject)}
      />
    </div>
  )
}
