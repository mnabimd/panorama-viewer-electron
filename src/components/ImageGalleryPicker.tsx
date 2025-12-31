import { useState, useEffect } from "react"
import { Plus, Grid3x3, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SceneCard } from "./SceneCard"
import { SceneListRow } from "./SceneListRow"

interface Scene {
  id: string
  name: string
  imagePath: string
  hotspots?: any[]
  thumbnail?: string
  description?: string
  isVisible?: boolean
  metadata?: {
    fileSize?: number
    dateAdded?: string
  }
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [scenesWithMetadata, setScenesWithMetadata] = useState<Scene[]>(existingScenes)

  // Load view mode preference from settings
  useEffect(() => {
    const loadViewMode = async () => {
      try {
        // @ts-ignore
        const result = await window.ipcRenderer.invoke('get-gallery-view-mode')
        if (result.success) {
          setViewMode(result.viewMode)
        }
      } catch (error) {
        console.error('Failed to load view mode:', error)
      }
    }
    loadViewMode()
  }, [])

  // Fetch metadata for scenes that don't have it
  useEffect(() => {
    const fetchMissingMetadata = async () => {
      const scenesNeedingMetadata = existingScenes.filter(
        scene => !scene.metadata?.fileSize || !scene.metadata?.dateAdded
      )

      if (scenesNeedingMetadata.length === 0) {
        setScenesWithMetadata(existingScenes)
        return
      }

      const updatedScenes = await Promise.all(
        existingScenes.map(async (scene) => {
          if (scene.metadata?.fileSize && scene.metadata?.dateAdded) {
            return scene
          }

          try {
            // @ts-ignore
            const result = await window.ipcRenderer.invoke('get-file-metadata', scene.imagePath)
            if (result.success) {
              return {
                ...scene,
                metadata: {
                  fileSize: result.metadata.fileSize,
                  dateAdded: result.metadata.dateAdded
                }
              }
            }
          } catch (error) {
            console.warn(`Failed to fetch metadata for scene ${scene.id}:`, error)
          }

          return scene
        })
      )

      setScenesWithMetadata(updatedScenes)
    }

    fetchMissingMetadata()
  }, [existingScenes])

  // Save view mode preference when it changes
  const handleViewModeChange = async (newMode: 'grid' | 'list') => {
    setViewMode(newMode)
    try {
      // @ts-ignore
      await window.ipcRenderer.invoke('set-gallery-view-mode', newMode)
    } catch (error) {
      console.error('Failed to save view mode:', error)
    }
  }

  const handleUploadClick = async () => {
    try {
      setIsUploading(true)
      // @ts-ignore
      const result = await window.ipcRenderer.invoke('select-image-file')
      
      if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
        // Process all selected files sequentially
        for (const filePath of result.filePaths) {
          const selectResult = onImageSelect(filePath, null) as any // null sceneId means new upload
          
          // If onImageSelect returns a promise, wait for it
          if (selectResult && typeof selectResult.then === 'function') {
            await selectResult
          }
        }
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
    <div className="space-y-3 ">
      {/* Header with View Mode Toggle */}
      <div className="flex items-center justify-between ">
        <span className="text-sm text-gray-400">
          {scenesWithMetadata.length} scene{scenesWithMetadata.length !== 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewModeChange('grid')}
            className={`h-8 px-2 ${
              viewMode === 'grid'
                ? 'bg-orange-500/20 text-orange-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Grid3x3 size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewModeChange('list')}
            className={`h-8 px-2 ${
              viewMode === 'list'
                ? 'bg-orange-500/20 text-orange-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <List size={16} />
          </Button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
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
          {scenesWithMetadata.map((scene) => (
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
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-2">
          {/* Upload Button */}
          <button
            onClick={handleUploadClick}
            disabled={isUploading}
            className={`
              w-full p-3 rounded-lg border-2 border-dashed 
              flex items-center justify-center gap-2
              transition-all
              ${selectedImagePath && !selectedSceneId 
                ? 'border-orange-500 bg-orange-500/10 text-orange-500' 
                : 'border-gray-600 hover:border-orange-500 hover:bg-gray-800 text-gray-400'
              }
              ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <Plus size={20} />
            <span className="text-sm font-medium">
              {isUploading ? 'Uploading...' : selectedImagePath && !selectedSceneId ? 'New upload selected' : 'Upload new image'}
            </span>
          </button>

          {/* Existing Scenes */}
          {scenesWithMetadata.map((scene) => (
            <SceneListRow
              key={scene.id}
              id={scene.id}
              name={scene.name}
              imagePath={scene.imagePath}
              fileSize={scene.metadata?.fileSize}
              dateAdded={scene.metadata?.dateAdded}
              selected={selectedSceneId === scene.id}
              onClick={() => handleSceneSelect(scene)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
