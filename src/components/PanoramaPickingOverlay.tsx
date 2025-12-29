import { Button } from "@/components/ui/button"
import { Target, X } from "lucide-react"
import "./PanoramaPickingOverlay.css"

interface PanoramaPickingOverlayProps {
  isActive: boolean
  onCancel: () => void
}

export function PanoramaPickingOverlay({ isActive, onCancel }: PanoramaPickingOverlayProps) {
  if (!isActive) return null
  
  return (
    <div className="panorama-picking-overlay">
      <div className="picking-message">
        <Target size={20} />
        <span>Click anywhere on the panorama to place hotspot</span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onCancel}
          className="cancel-picking-btn"
        >
          <X size={16} className="mr-1" />
          Cancel
        </Button>
      </div>
    </div>
  )
}
