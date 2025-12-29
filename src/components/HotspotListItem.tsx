import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react"
import { Hotspot, Scene } from "@/types/project.types"
import { getHotspotIcon, getHotspotLabel } from "@/utils/hotspot.utils"

interface HotspotListItemProps {
  hotspot: Hotspot
  scenes: Scene[]
  onEdit: (hotspot: Hotspot) => void
  onToggleVisibility: (hotspotId: string, isVisible: boolean) => void
  onDelete: (hotspotId: string) => void
}

export function HotspotListItem({ 
  hotspot, 
  scenes, 
  onEdit, 
  onToggleVisibility, 
  onDelete 
}: HotspotListItemProps) {
  return (
    <div className="hotspot-item">
      <div className="hotspot-info">
        {getHotspotIcon(hotspot.type)}
        <span className="hotspot-label">{getHotspotLabel(hotspot, scenes)}</span>
      </div>
      <div className="hotspot-actions">
        <button 
          className="hotspot-action-btn"
          onClick={(e) => {
            e.stopPropagation()
            onToggleVisibility(hotspot.id, !(hotspot.isVisible ?? true))
          }}
          title={hotspot.isVisible !== false ? "Hide hotspot" : "Show hotspot"}
        >
          {hotspot.isVisible !== false ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>
        <button 
          className="hotspot-action-btn"
          onClick={() => onEdit(hotspot)}
        >
          <Pencil size={18} />
        </button>
        <button 
          className="hotspot-action-btn text-red-500"
          onClick={() => onDelete(hotspot.id)}
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  )
}
