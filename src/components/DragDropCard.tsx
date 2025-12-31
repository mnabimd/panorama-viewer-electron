import { useState } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { validateImageFile } from '@/utils/imageValidation'
import { useToast } from '@/hooks/use-toast'

interface DragDropCardProps {
  onImageDrop: (filePath: string) => Promise<void>
  isUploading?: boolean
  className?: string
}

export function DragDropCard({ onImageDrop, isUploading = false, className = '' }: DragDropCardProps) {
  const [isSelecting, setIsSelecting] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null)
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

    if (isUploading || isSelecting || uploadProgress) return

    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return

    // Process all files
    const validFiles: File[] = []
    const invalidFiles: string[] = []

    // Validate all files first
    for (const file of files) {
      const validation = validateImageFile(file)
      if (validation.valid) {
        validFiles.push(file)
      } else {
        invalidFiles.push(file.name)
      }
    }

    // Show error for invalid files
    if (invalidFiles.length > 0) {
      toast({
        title: 'Invalid Files',
        description: `${invalidFiles.length} file(s) rejected: Only JPG/JPEG allowed`,
        variant: 'destructive'
      })
    }

    // Process valid files
    if (validFiles.length === 0) return

    try {
      const totalFiles = validFiles.length
      
      // Process each valid file sequentially
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i]
        
        // Update progress
        setUploadProgress({ current: i + 1, total: totalFiles })
        
        const arrayBuffer = await file.arrayBuffer()
        
        // @ts-ignore
        const result = await window.ipcRenderer.invoke('save-dropped-file', {
          fileName: file.name,
          fileBuffer: arrayBuffer
        })
        
        if (result.success && result.filePath) {
          // Wait for each file to be processed before moving to the next
          await onImageDrop(result.filePath)
        }
      }
      
      // Clear progress when done
      setUploadProgress(null)
    } catch (error) {
      console.error('Error processing dropped files:', error)
      setUploadProgress(null)
      toast({
        title: 'Error',
        description: 'Failed to process dropped files',
        variant: 'destructive'
      })
    }
  }

  const handleClick = async () => {
    if (isUploading || isSelecting || uploadProgress) return

    try {
      setIsSelecting(true)
      // @ts-ignore
      const result = await window.ipcRenderer.invoke('select-image-file')
      
      if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
        setIsSelecting(false)
        
        const totalFiles = result.filePaths.length
        
        // Process each selected file sequentially
        for (let i = 0; i < result.filePaths.length; i++) {
          const filePath = result.filePaths[i]
          
          // Update progress
          setUploadProgress({ current: i + 1, total: totalFiles })
          
          // Wait for each file to be processed
          await onImageDrop(filePath)
        }
        
        // Clear progress when done
        setUploadProgress(null)
      } else {
        setIsSelecting(false)
      }
    } catch (error) {
      console.error('Failed to select image:', error)
      setIsSelecting(false)
      setUploadProgress(null)
    }
  }

  const loading = isUploading || isSelecting || uploadProgress !== null

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
            {uploadProgress 
              ? `Uploading ${uploadProgress.current}/${uploadProgress.total}...`
              : isSelecting 
                ? 'Selecting...' 
                : 'Uploading...'}
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
