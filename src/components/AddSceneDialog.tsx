import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus } from "lucide-react"
import { SceneCard } from "./SceneCard"

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
  const [isUploading, setIsUploading] = useState(false)
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

  const handleUploadClick = async () => {
    try {
      setIsUploading(true)
      // @ts-ignore
      const result = await window.ipcRenderer.invoke('select-image-file')
      
      if (!result.canceled && result.filePath) {
        setSelectedImagePath(result.filePath)
        setSelectedSceneId(null) // Deselect existing scene
      }
    } catch (error) {
      console.error('Failed to select image:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSceneSelect = (scene: Scene) => {
    if (selectedSceneId === scene.id) {
      setSelectedSceneId(null)
      setSelectedImagePath(null)
    } else {
      setSelectedSceneId(scene.id)
      setSelectedImagePath(scene.imagePath)
    }
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
      <DialogContent className="sm:max-w-[600px] bg-[#1a1a1a] text-white border-gray-700 max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Scene</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Image Selection Grid */}
          <div>
            <Label className="text-sm text-gray-400 mb-2 block">Select Image</Label>
            <div className="grid grid-cols-3 gap-3">
              {/* Upload Button */}
              <button
                onClick={handleUploadClick}
                disabled={isUploading}
                className={`
                  aspect-video rounded-lg border-2 border-dashed 
                  flex items-center justify-center
                  transition-all relative overflow-hidden
                  ${selectedImagePath && !selectedSceneId 
                    ? 'border-orange-500 bg-orange-500/10' 
                    : 'border-gray-600 hover:border-orange-500 hover:bg-gray-800'
                  }
                  ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {isUploading ? (
                  <div className="text-gray-400">Loading...</div>
                ) : selectedImagePath && !selectedSceneId ? (
                  <>
                    <img 
                      src={`file://${selectedImagePath}`}
                      alt="Preview"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Plus size={32} className="text-white" />
                    </div>
                  </>
                ) : (
                  <Plus size={32} className="text-gray-400" />
                )}
              </button>

              {/* Existing Scenes */}
              {existingScenes.map((scene) => (
                <SceneCard
                  key={scene.id}
                  id={scene.id}
                  name={scene.name}
                  imagePath={scene.imagePath}
                  selected={selectedSceneId === scene.id}
                  onClick={() => handleSceneSelect(scene)}
                />
              ))}
            </div>
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

        <DialogFooter>
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
