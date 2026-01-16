import { useState, useEffect, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ChevronLeft, ChevronRight, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { EditorLeftSidebar } from "@/components/EditorLeftSidebar"
import { EditorRightSidebarHeader } from "@/components/EditorRightSidebarHeader"
import { SceneSettingsPanel } from "@/components/SceneSettingsPanel"
import { SceneCommentsPanel } from "@/components/SceneCommentsPanel"
import { HotspotsPanel } from "@/components/HotspotsPanel"
import { EditorDialogs } from "@/components/EditorDialogs"
import { PanoramaViewer } from "@/components/PanoramaViewer"
import { ProjectPropertiesDialog } from "@/components/ProjectPropertiesDialog"
import { BackupProgressDialog } from "@/components/BackupProgressDialog"
import { WebExportProgressDialog } from "@/components/WebExportProgressDialog"
import { useProject } from "@/hooks/useProject"
import { useHotspots } from "@/hooks/useHotspots"
import { useScenes } from "@/hooks/useScenes"
import { useSceneSettings } from "@/hooks/useSceneSettings"
import { useToast } from "@/hooks/use-toast"
import { useMenuActions } from "@/hooks/useMenuActions"
import { FAKE_SCENE } from "@/constants"
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
    handleUpdateCoordinates,
    handleUpdateSphereCorrection
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
  const [pendingHotspotType, setPendingHotspotType] = useState<'scene' | 'info' | 'url'>('scene')
  const [pendingHotspotPosition, setPendingHotspotPosition] = useState<{yaw: number; pitch: number} | null>(null)
  const [isUploadingScene, setIsUploadingScene] = useState(false)
  const [infoHotspotDialog, setInfoHotspotDialog] = useState<{
    isOpen: boolean
    title: string
    content: string
  }>({
    isOpen: false,
    title: '',
    content: ''
  })
  const [projectPropertiesOpen, setProjectPropertiesOpen] = useState(false)
  const [isPlayMode, setIsPlayMode] = useState(false)
  const panoramaViewerRef = useRef<any>(null)


  // Menu actions integration
  const menuActions = useMenuActions(project?.id)

  // Override sidebar state with menu actions
  useEffect(() => {
    setRightSidebarOpen(menuActions.sidebarVisible)
  }, [menuActions.sidebarVisible])

  // Load hotspots when active scene changes (but not for fake scene)
  useEffect(() => {
    if (project && activeScene && activeScene !== '__fake__') {
      loadHotspotsForScene(project, activeScene)
    }
  }, [activeScene, project])

  // Setup menu action event listeners
  useEffect(() => {
    const handleImportScenes = async (event: any) => {
      const { filePaths } = event.detail
      for (const filePath of filePaths) {
        await handleImageDrop(filePath)
      }
    }

    const handlePreview = () => {
      handlePlayProject()
    }

    const handleProperties = () => {
      setProjectPropertiesOpen(true)
    }

    const handleSaveProject = async () => {
      // Refresh project to ensure data is current
      await refreshProject()
      toast({
        title: 'Project Saved',
        description: 'All changes have been saved',
        variant: 'default'
      })
    }

    window.addEventListener('import-scenes', handleImportScenes as EventListener)
    window.addEventListener('preview-mode', handlePreview)
    window.addEventListener('open-project-properties', handleProperties)
    window.addEventListener('save-project', handleSaveProject)

    return () => {
      window.removeEventListener('import-scenes', handleImportScenes as EventListener)
      window.removeEventListener('preview-mode', handlePreview)
      window.removeEventListener('open-project-properties', handleProperties)
      window.removeEventListener('save-project', handleSaveProject)
    }
  }, [project, refreshProject, toast])



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
      setInfoHotspotDialog({
        isOpen: true,
        title: hotspot.title || 'Info',
        content: hotspot.content || ''
      })
    }
  }

  // Handle play project (switch to featured scene - used by center Play button)
  const handlePlayProject = () => {
    if (!scenes.length) return

    // Find featured scene
    const featuredScene = scenes.find(s => s.isFeatured)
    
    if (featuredScene) {
      setActiveScene(featuredScene.id)
    } else {
      // Fallback to first scene
      setActiveScene(scenes[0].id)
    }
  }

  // Handle full play mode (switch to featured scene and enter fullscreen - used by sidebar Play button)
  const handleFullPlayMode = () => {
    if (!scenes.length) return

    // Find featured scene
    const featuredScene = scenes.find(s => s.isFeatured)
    
    if (featuredScene) {
      setActiveScene(featuredScene.id)
    } else {
      // Fallback to first scene
      setActiveScene(scenes[0].id)
    }

    // Enter play mode
    setIsPlayMode(true)
  }

  // Handle stop play mode
  const handleStopPlay = () => {
    setIsPlayMode(false)
    // Exit panorama fullscreen if active
    if (panoramaViewerRef.current?.viewer) {
      try {
        if (document.fullscreenElement) {
          document.exitFullscreen()
        }
      } catch (error) {
        console.error('Failed to exit fullscreen:', error)
      }
    }
  }

  // Trigger panorama fullscreen when entering play mode
  useEffect(() => {
    if (isPlayMode && panoramaViewerRef.current?.viewer) {
      // Small delay to ensure viewer is ready
      setTimeout(() => {
        try {
          panoramaViewerRef.current.viewer.enterFullscreen()
        } catch (error) {
          console.error('Failed to enter fullscreen:', error)
        }
      }, 100)
    }
  }, [isPlayMode])

  // Handle scene comment update
  const handleUpdateSceneComment = async (comment: string) => {
    if (!project || !activeScene) return

    try {
      // @ts-ignore
      await window.ipcRenderer.invoke('update-scene', {
        projectId: project.id,
        sceneId: activeScene,
        updates: { comment }
      })
      await refreshProject()
      toast({
        title: "Saved",
        description: "Scene comment updated",
        variant: "success",
      })
    } catch (error) {
      console.error('Failed to update scene comment:', error)
      toast({
        title: "Error",
        description: "Failed to save comment",
        variant: "destructive",
      })
    }
  }

  if (isLoading || !project) {
    return <div className="flex items-center justify-center h-screen bg-[#1a1a1a] text-white">Loading...</div>
  }

  return (
    <div className="project-editor">
      {/* Left Sidebar - Hidden in play mode */}
      {!isPlayMode && (
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
      )}

      {/* Center Content */}
      <main className="editor-main relative">
        {/* Viewer Container - Hidden when fake */}
        <div className={`w-full h-full ${(!activeScene || activeScene === '__fake__') ? 'invisible' : ''}`}>
          <PanoramaViewer
            scene={(!activeScene || activeScene === '__fake__') ? FAKE_SCENE : currentScene!}
            hotspots={(!activeScene || activeScene === '__fake__') ? [] : hotspots}
            isAddingHotspot={isAddingHotspot}
            onHotspotClick={handleHotspotClickInViewer}
            onPanoramaClick={handlePanoramaClick}
            onSceneHotspotClick={handleSceneHotspotClick}
            onCancelPicking={() => setIsAddingHotspot(false)}
            ref={panoramaViewerRef}
          />
        </div>

        {/* Play Button Overlay - Visible when fake */}
        {(!activeScene || activeScene === '__fake__') && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#1a1a1a] text-white">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-6 text-gray-300">Click to Start Project</h2>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handlePlayProject}
                className="w-24 h-24 rounded-full bg-white/10 border-2 border-white/50 backdrop-blur-md hover:scale-110 hover:bg-white/20 hover:border-white transition-all duration-300"
              >
                <Play className="w-10 h-10 text-white fill-white ml-1" /> 
              </Button>
            </div>
          </div>
        )}
        
        {/* Floating Close Button - Visible in play mode */}
        {isPlayMode && (
          <Button
            onClick={handleStopPlay}
            className="absolute top-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white"
            size="lg"
          >
            Close Preview
          </Button>
        )}
        
        {/* Right Sidebar Toggle Button - Hidden in play mode */}
        {!isPlayMode && (
          <Button 
            variant="ghost" 
            size="icon"
            onClick={toggleRightSidebar}
            className="absolute top-4 right-4 z-10 bg-[#252525] hover:bg-[#333]"
          >
            {rightSidebarOpen ? <ChevronRight /> : <ChevronLeft />}
          </Button>
        )}
      </main>

      {/* Right Sidebar - Hidden in play mode */}
      {!isPlayMode && (
        <aside className={`editor-sidebar-right ${!rightSidebarOpen ? 'collapsed' : ''}`}>
          <EditorRightSidebarHeader onPlay={handleFullPlayMode} />

        <Accordion type="multiple" defaultValue={["hotspots", "comments"]} className="px-4">
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
                onUpdateSphereCorrection={handleUpdateSphereCorrection}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Comments Section */}
          <AccordionItem value="comments" className="border-gray-700">
            <AccordionTrigger className="text-sm text-gray-400 hover:text-white py-3">
              Comments
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <SceneCommentsPanel
                currentScene={currentScene}
                onUpdateComment={handleUpdateSceneComment}
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
                onAddHotspot={(type) => handleAddHotspot(() => {
                  setPendingHotspotType(type)
                  setIsAddingHotspot(true)
                })}
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
      )}

      {/* All Dialogs */}
      <EditorDialogs
        isHotspotDialogOpen={isHotspotDialogOpen}
        setIsHotspotDialogOpen={setIsHotspotDialogOpen}
        editingHotspot={editingHotspot}
        pendingHotspotPosition={pendingHotspotPosition}
        pendingHotspotType={pendingHotspotType}
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
        infoHotspotDialog={infoHotspotDialog}
        onCloseInfoHotspotDialog={() => setInfoHotspotDialog(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Project Properties Dialog */}
      {project && (
        <ProjectPropertiesDialog
          open={projectPropertiesOpen}
          onClose={() => setProjectPropertiesOpen(false)}
          projectId={project.id}
        />
      )}

      <BackupProgressDialog open={menuActions.isExporting} onOpenChange={() => {}} />
      <WebExportProgressDialog open={menuActions.isExportingWeb} onOpenChange={() => {}} />
    </div>
  )
}
