import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Hotspot, Scene } from "@/types/project.types"
import { HotspotListItem } from "./HotspotListItem"

interface HotspotsPanelProps {
  hotspots: Hotspot[]
  scenes: Scene[]
  onAddHotspot: () => void
  onEditHotspot: (hotspot: Hotspot) => void
  onToggleHotspotVisibility: (hotspotId: string, isVisible: boolean) => void
  onDeleteHotspot: (hotspotId: string) => void
  onDeleteAllHotspots: () => void
}

export function HotspotsPanel({
  hotspots,
  scenes,
  onAddHotspot,
  onEditHotspot,
  onToggleHotspotVisibility,
  onDeleteHotspot,
  onDeleteAllHotspots
}: HotspotsPanelProps) {
  return (
    <>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{hotspots.length} Hotspot{hotspots.length !== 1 ? 's' : ''}</span>
        <Button 
          variant="ghost" 
          size="sm" 
          className="delete-all-btn text-red-500 hover:text-red-400 h-auto p-0"
          onClick={() => hotspots.length > 0 && onDeleteAllHotspots()}
          disabled={hotspots.length === 0}
        >
          Delete All
        </Button>
      </div>

      <Button 
        onClick={onAddHotspot} 
        className="w-full bg-orange-500 hover:bg-orange-600"
        size="sm"
      >
        <Plus size={16} className="mr-2" /> Add Hotspot
      </Button>

      <div className="hotspot-list">
        {hotspots.map((hotspot) => (
          <HotspotListItem
            key={hotspot.id}
            hotspot={hotspot}
            scenes={scenes}
            onEdit={onEditHotspot}
            onToggleVisibility={onToggleHotspotVisibility}
            onDelete={onDeleteHotspot}
          />
        ))}
      </div>
    </>
  )
}
