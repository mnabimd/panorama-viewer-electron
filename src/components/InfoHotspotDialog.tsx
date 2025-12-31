import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface InfoHotspotDialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  content: string
}

export function InfoHotspotDialog({
  isOpen,
  onClose,
  title,
  content
}: InfoHotspotDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#252525] border-gray-700 text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <DialogDescription className="text-gray-300 text-base whitespace-pre-wrap">
            {content}
          </DialogDescription>
        </div>
        <div className="flex justify-end">
          <Button 
            onClick={onClose}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
