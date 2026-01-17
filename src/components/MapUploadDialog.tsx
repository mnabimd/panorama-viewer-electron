import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'

interface MapUploadDialogProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  onUploadComplete: () => void
}

export function MapUploadDialog({
  isOpen,
  onClose,
  projectId,
  onUploadComplete
}: MapUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileSelect = async () => {
    try {
      // @ts-ignore
      const result = await window.ipcRenderer.invoke('select-image-file')

      if (result && !result.canceled && result.filePath) {
        setSelectedFile(result.filePath)
        setPreviewUrl(`file://${result.filePath}`)
      }
    } catch (error) {
      console.error('Failed to select file:', error)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    try {
      // @ts-ignore
      const result = await window.ipcRenderer.invoke('upload-map-image', {
        projectId,
        imagePath: selectedFile
      })

      if (result.success) {
        onUploadComplete()
        handleClose()
      }
    } catch (error) {
      console.error('Failed to upload map:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-width-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Map Image</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Picker */}
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-600 rounded-lg p-8">
            {previewUrl ? (
              <div className="w-full">
                <img 
                  src={previewUrl} 
                  alt="Map Preview" 
                  className="w-full h-auto max-h-64 object-contain rounded"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFileSelect}
                  className="mt-4 w-full"
                >
                  Choose Different Image
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-sm text-gray-400 mb-4">
                  Select a floor plan or site map image
                </p>
                <Button onClick={handleFileSelect}>
                  Choose Image
                </Button>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400">
            Supported formats: JPG, PNG
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
