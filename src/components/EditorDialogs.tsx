import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { HotspotDialog } from "./HotspotDialog"
import { InfoHotspotDialog } from "./InfoHotspotDialog"
import { AddSceneDialog } from "./AddSceneDialog"
import { ImageGalleryPicker } from "./ImageGalleryPicker"
import { Hotspot, Scene } from "@/types/project.types"

interface EditorDialogsProps {
  // Hotspot Dialog
  isHotspotDialogOpen: boolean
  setIsHotspotDialogOpen: (open: boolean) => void
  editingHotspot: Hotspot | null
  pendingHotspotPosition?: { yaw: number; pitch: number } | null
  onHotspotDialogClose?: () => void
  scenes: Scene[]
  onSubmitHotspot: (data: Omit<Hotspot, 'id'>) => Promise<void>
  
  // Delete Hotspot Dialog
  deleteConfirmOpen: boolean
  setDeleteConfirmOpen: (open: boolean) => void
  onDeleteHotspot: () => void
  
  // Delete All Hotspots Dialog
  deleteAllConfirmOpen: boolean
  setDeleteAllConfirmOpen: (open: boolean) => void
  hotspots: Hotspot[]
  onDeleteAllHotspots: () => void
  
  // Delete Scene Dialog
  deleteSceneConfirmOpen: boolean
  setDeleteSceneConfirmOpen: (open: boolean) => void
  currentScene: Scene | undefined
  isDeletingScene: boolean
  onDeleteScene: () => void
  
  // Delete All Scenes Dialog
  deleteAllScenesConfirmOpen: boolean
  setDeleteAllScenesConfirmOpen: (open: boolean) => void
  onDeleteAllScenes: () => void
  
  // Replace Image Dialog
  isReplaceImageOpen: boolean
  setIsReplaceImageOpen: (open: boolean) => void
  replaceImagePath: string | null
  replaceSceneId: string | null
  isReplacingImage: boolean
  activeScene: string
  onImageSelect: (path: string, sceneId: string | null) => void
  onConfirmReplaceImage: () => void
  
  // Add Scene Dialog
  isAddSceneDialogOpen: boolean
  setIsAddSceneDialogOpen: (open: boolean) => void
  projectId: string
  onSceneAdded: () => void

  // Info Hotspot Dialog
  infoHotspotDialog: {
    isOpen: boolean
    title: string
    content: string
  }
  onCloseInfoHotspotDialog: () => void
}

export function EditorDialogs({
  isHotspotDialogOpen,
  setIsHotspotDialogOpen,
  editingHotspot,
  pendingHotspotPosition,
  onHotspotDialogClose,
  scenes,
  onSubmitHotspot,
  deleteConfirmOpen,
  setDeleteConfirmOpen,
  onDeleteHotspot,
  deleteAllConfirmOpen,
  setDeleteAllConfirmOpen,
  hotspots,
  onDeleteAllHotspots,
  deleteSceneConfirmOpen,
  setDeleteSceneConfirmOpen,
  currentScene,
  isDeletingScene,
  onDeleteScene,
  deleteAllScenesConfirmOpen,
  setDeleteAllScenesConfirmOpen,
  onDeleteAllScenes,
  isReplaceImageOpen,
  setIsReplaceImageOpen,
  replaceImagePath,
  replaceSceneId,
  isReplacingImage,
  activeScene,
  onImageSelect,
  onConfirmReplaceImage,
  isAddSceneDialogOpen,
  setIsAddSceneDialogOpen,

  projectId,
  onSceneAdded,
  infoHotspotDialog,
  onCloseInfoHotspotDialog
}: EditorDialogsProps) {
  return (
    <>
      {/* Hotspot Dialog */}
      <HotspotDialog
        open={isHotspotDialogOpen}
        onOpenChange={(open) => {
          setIsHotspotDialogOpen(open)
          if (!open && onHotspotDialogClose) {
            onHotspotDialogClose()
          }
        }}
        mode={editingHotspot ? 'edit' : 'add'}
        existingHotspot={editingHotspot || undefined}
        initialPosition={pendingHotspotPosition || undefined}
        availableScenes={scenes}
        onSubmit={onSubmitHotspot}
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
              onClick={onDeleteHotspot}
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
              onClick={onDeleteAllHotspots}
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
              onClick={onDeleteScene}
              className="bg-red-500 hover:bg-red-600"
              disabled={isDeletingScene}
            >
              {isDeletingScene ? 'Deleting...' : 'Delete Scene'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Scenes Confirmation Dialog */}
      <AlertDialog open={deleteAllScenesConfirmOpen} onOpenChange={setDeleteAllScenesConfirmOpen}>
        <AlertDialogContent className="bg-[#1a1a1a] text-white border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Scenes</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete all {scenes.length - 1} scene{scenes.length - 1 !== 1 ? 's' : ''}? The first scene will be kept as at least one scene is required. This will also delete all hotspots in these scenes. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#252525] border-gray-700 hover:bg-[#333]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={onDeleteAllScenes}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Replace Scene Image Dialog */}
      <Dialog open={isReplaceImageOpen} onOpenChange={setIsReplaceImageOpen}>
        <DialogContent className="sm:max-w-[800px] bg-[#1a1a1a] text-white border-gray-700 flex flex-col max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Replace Scene Image</DialogTitle>
          </DialogHeader>

          {/* Scrollable content area */}
          <div className="overflow-y-auto flex-1 py-4">
            <div>
              <Label className="text-sm text-gray-400 mb-2 block">Select New Image</Label>
              <ImageGalleryPicker
                existingScenes={scenes.filter(s => s.id !== activeScene)}
                selectedImagePath={replaceImagePath}
                selectedSceneId={replaceSceneId}
                onImageSelect={onImageSelect}
              />
            </div>
          </div>

          {/* Sticky footer */}
          <DialogFooter className="border-t border-gray-700 pt-4">
            <Button
              variant="ghost"
              onClick={() => setIsReplaceImageOpen(false)}
              disabled={isReplacingImage}
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirmReplaceImage}
              disabled={isReplacingImage || !replaceImagePath}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isReplacingImage ? 'Replacing...' : 'Replace Image'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddSceneDialog
        open={isAddSceneDialogOpen}
        onOpenChange={setIsAddSceneDialogOpen}
        projectId={projectId}
        existingScenes={scenes}
        onSceneAdded={onSceneAdded}
      />

      {/* Info Hotspot Dialog */}
      <InfoHotspotDialog
        isOpen={infoHotspotDialog.isOpen}
        onClose={onCloseInfoHotspotDialog}
        title={infoHotspotDialog.title}
        content={infoHotspotDialog.content}
      />
    </>
  )
}
