import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"

interface BackupProgressDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BackupProgressDialog({ open, onOpenChange }: BackupProgressDialogProps) {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<'idle' | 'processing' | 'completed'>('idle')

  useEffect(() => {
    if (!open) {
      setProgress(0)
      setStatus('idle')
      return
    }

    const handleProgress = (_: any, data: { status: 'processing' | 'completed', percent: number }) => {
      setStatus(data.status)
      setProgress(data.percent)
      
      if (data.status === 'completed') {
        // Close dialog after a short delay
        setTimeout(() => {
          onOpenChange(false)
        }, 1000)
      }
    }

    // @ts-ignore
    window.ipcRenderer.on('backup:progress', handleProgress)

    return () => {
      // @ts-ignore
      window.ipcRenderer.off('backup:progress', handleProgress)
    }
  }, [open, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Exporting Project</DialogTitle>
          <DialogDescription>
            Please wait while your project is being exported...
          </DialogDescription>
        </DialogHeader>
        <div className="py-6">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-center mt-2 text-gray-500">
            {status === 'completed' ? 'Export Completed!' : `${progress}%`}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
