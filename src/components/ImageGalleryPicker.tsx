import { useState } from "react"
import { Plus } from "lucide-react"
import { SceneCard } from "./SceneCard"

interface Scene {
  id: string
  name: string
  imagePath: string
  hotspots?: any[]
  thumbnail?: string
  description?: string
  isVisible?: boolean
}

interface ImageGalleryPickerProps {
  existingScenes: Scene[]
  selectedImagePath: string | null
  selectedSceneId: string | null
  onImageSelect: (imagePath: string, sceneId: string | null) => void
  compact?: boolean
}

export function ImageGalleryPicker({
  existingScenes,
  selectedImagePath,
  selectedSceneId,
  onImageSelect,
  compact = false
}: ImageGalleryPickerProps) {
  const [isUploading, setIsUploading] = useState(false)

  const handleUploadClick = async () => {
    try {
      setIsUploading(true)
      // @ts-ignore
      const result = await window.ipcRenderer.invoke('select-image-file')
      
      if (!result.canceled && result.filePath) {
        onImageSelect(result.filePath, null) // null sceneId means new upload
      }
    } catch (error) {
      console.error('Failed to select image:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSceneSelect = (scene: Scene) => {
    if (selectedSceneId === scene.id) {
      onImageSelect('', null) // Deselect
    } else {
      onImageSelect(scene.imagePath, scene.id)
    }
  }

  return (
    <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-3'} gap-3`}>
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
  )
}
