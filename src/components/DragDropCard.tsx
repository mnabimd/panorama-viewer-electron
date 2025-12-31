import { useState } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { validateImageFile } from '@/utils/imageValidation'
import { useToast } from '@/hooks/use-toast'

interface DragDropCardProps {
  onImageDrop: (filePath: string) => void
  isUploading?: boolean
  className?: string
}

export function DragDropCard({ onImageDrop, isUploading = false, className = '' }: DragDropCardProps) {
  const [isSelecting, setIsSelecting] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const { toast } = useToast()

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    if (isUploading || isSelecting) return

    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return

    // Only process the first file
    const file = files[0]

    // Validate the file
    const validation = validateImageFile(file)
    if (!validation.valid) {
      toast({
        title: 'Invalid File',
        description: validation.error,
        variant: 'destructive'
      })
      return
    }

    try {
      // Read the file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer()
      
      // Send to main process to save to temp location
      // @ts-ignore
      const result = await window.ipcRenderer.invoke('save-dropped-file', {
        fileName: file.name,
        fileBuffer: arrayBuffer
      })
      
      if (result.success && result.filePath) {
        onImageDrop(result.filePath)
      } else {
        toast({
          title: 'Error',
          description: 'Failed to process dropped file',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error processing dropped file:', error)
      toast({
        title: 'Error',
        description: 'Failed to process dropped file',
        variant: 'destructive'
      })
    }
  }

  const handleClick = async () => {
    if (isUploading || isSelecting) return

    try {
      setIsSelecting(true)
      // @ts-ignore
      const result = await window.ipcRenderer.invoke('select-image-file')
      
      if (!result.canceled && result.filePath) {
        onImageDrop(result.filePath)
      }
    } catch (error) {
      console.error('Failed to select image:', error)
    } finally {
      setIsSelecting(false)
    }
  }

  const loading = isUploading || isSelecting

  return (
    <div
      className={`drag-drop-card ${isDragOver ? 'drag-over' : ''} ${loading ? 'uploading' : ''} ${className}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label="Drop image here or click to upload"
    >
      {loading ? (
        <>
          <Loader2 className="drag-drop-icon animate-spin" size={32} />
          <span className="drag-drop-text">
            {isSelecting ? 'Selecting...' : 'Uploading...'}
          </span>
        </>
      ) : (
        <>
          <Upload className="drag-drop-icon" size={32} />
          <span className="drag-drop-text">
            {isDragOver ? 'Drop to upload' : 'Drop image here or click'}
          </span>
          <span className="drag-drop-subtext">JPG or JPEG only</span>
        </>
      )}
    </div>
  )
}
