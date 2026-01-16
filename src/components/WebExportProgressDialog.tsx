import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"

interface WebExportProgressDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WebExportProgressDialog({ open, onOpenChange }: WebExportProgressDialogProps) {
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('Preparing export...')
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (!open) {
      setProgress(0)
      setMessage('Preparing export...')
      setIsComplete(false)
      return
    }

    const handleProgress = (_: any, data: { percentage: number; message: string }) => {
      setProgress(data.percentage)
      setMessage(data.message)
      
      if (data.percentage >= 100) {
        setIsComplete(true)
        // Close dialog after a short delay
        setTimeout(() => {
          onOpenChange(false)
        }, 1500)
      }
    }

    // @ts-ignore
    window.ipcRenderer.on('export:progress', handleProgress)

    return () => {
      // @ts-ignore
      window.ipcRenderer.off('export:progress', handleProgress)
    }
  }, [open, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Exporting Web App</DialogTitle>
          <DialogDescription>
            Please wait while your project is being exported as a standalone web application...
          </DialogDescription>
        </DialogHeader>
        <div className="py-6">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-center mt-3 text-gray-600">
            {isComplete ? '✓ Export Complete!' : message}
          </p>
          <p className="text-xs text-center mt-1 text-gray-400">
            {progress}%
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
