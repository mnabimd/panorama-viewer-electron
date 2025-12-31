import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ImageGalleryPicker } from "./ImageGalleryPicker"

interface Scene {
  id: string
  name: string
  imagePath: string
  hotspots: any[]
  thumbnail?: string
  description?: string
  isVisible?: boolean
}

interface AddSceneDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  existingScenes: Scene[]
  onSceneAdded: () => void
}

export function AddSceneDialog({
  open,
  onOpenChange,
  projectId,
  existingScenes,
  onSceneAdded
}: AddSceneDialogProps) {
  const [sceneName, setSceneName] = useState("")
  const [selectedImagePath, setSelectedImagePath] = useState<string | null>(null)
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Set default scene name when dialog opens
  const getDefaultSceneName = () => {
    const sceneCount = existingScenes.length
    return `Scene ${sceneCount + 1}`
  }

  // Update scene name when dialog opens
  useEffect(() => {
    if (open) {
      setSceneName(getDefaultSceneName())
    }
  }, [open, existingScenes.length])

  // Reset form when dialog opens/closes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      handleClose()
    }
    onOpenChange(isOpen)
  }

  const handleImageSelect = (imagePath: string, sceneId: string | null) => {
    setSelectedImagePath(imagePath || null)
    setSelectedSceneId(sceneId)
  }

  const handleSubmit = async () => {
    if (!sceneName.trim()) {
      alert('Please enter a scene name')
      return
    }

    if (!selectedImagePath) {
      alert('Please select an image')
      return
    }

    try {
      setIsSubmitting(true)
      // @ts-ignore
      await window.ipcRenderer.invoke('add-scene', {
        projectId,
        sceneName: sceneName.trim(),
        imagePath: selectedImagePath,
        isNewUpload: selectedSceneId === null // true if uploaded, false if reused
      })

      // Reset form
      setSceneName(getDefaultSceneName())
      setSelectedImagePath(null)
      setSelectedSceneId(null)
      
      onSceneAdded()
    } catch (error) {
      console.error('Failed to add scene:', error)
      alert('Failed to add scene')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setSceneName("")
    setSelectedImagePath(null)
    setSelectedSceneId(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[800px] bg-[#1a1a1a] text-white border-gray-700 flex flex-col max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Add New Scene</DialogTitle>
        </DialogHeader>

        {/* Scrollable content area */}
        <div className="overflow-y-auto py-4 space-y-4 overflow-x-hidden">
          {/* Image Selection Grid */}
          <div className="">
            <Label className="text-sm text-gray-400 mb-2 block">Select Image</Label>
            <ImageGalleryPicker
              existingScenes={existingScenes}
              selectedImagePath={selectedImagePath}
              selectedSceneId={selectedSceneId}
              onImageSelect={handleImageSelect}
            />
          </div>

          {/* Scene Name Input */}
          <div className="space-y-2">
            <Label htmlFor="sceneName">Scene Name *</Label>
            <Input
              id="sceneName"
              value={sceneName}
              onChange={(e) => setSceneName(e.target.value)}
              placeholder="Enter scene name"
              className="bg-[#252525] border-gray-700 text-white"
            />
          </div>
        </div>

        {/* Sticky footer */}
        <DialogFooter className="border-t border-gray-700 pt-4">
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !sceneName.trim() || !selectedImagePath}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isSubmitting ? 'Adding...' : 'Add Scene'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
