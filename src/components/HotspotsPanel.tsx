import { Button } from "@/components/ui/button"
import { MapPin, Info, Link2 } from "lucide-react"
import { Hotspot, Scene } from "@/types/project.types"
import { HotspotListItem } from "./HotspotListItem"

interface HotspotsPanelProps {
  hotspots: Hotspot[]
  scenes: Scene[]
  onAddHotspot: (type: 'scene' | 'info' | 'url') => void
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

      <div className="grid grid-cols-3 gap-2">
        <Button 
          onClick={() => onAddHotspot('scene')} 
          className="bg-[#252525] border border-gray-700 hover:bg-[#333] hover:border-gray-500 text-gray-200 hover:text-white flex flex-col h-auto py-3 px-1 gap-1.5 transition-all duration-200"
          size="sm"
          title="Link to another scene"
        >
          <MapPin size={18} className="text-orange-500" />
          <span className="text-[10px] font-medium">Scene</span>
        </Button>
        <Button 
          onClick={() => onAddHotspot('info')} 
          className="bg-[#252525] border border-gray-700 hover:bg-[#333] hover:border-gray-500 text-gray-200 hover:text-white flex flex-col h-auto py-3 px-1 gap-1.5 transition-all duration-200"
          size="sm"
          title="Show information"
        >
          <Info size={18} className="text-blue-500" />
          <span className="text-[10px] font-medium">Info</span>
        </Button>
        <Button 
          onClick={() => onAddHotspot('url')} 
          className="bg-[#252525] border border-gray-700 hover:bg-[#333] hover:border-gray-500 text-gray-200 hover:text-white flex flex-col h-auto py-3 px-1 gap-1.5 transition-all duration-200"
          size="sm"
          title="Link to external URL"
        >
          <Link2 size={18} className="text-green-500" />
          <span className="text-[10px] font-medium">Link</span>
        </Button>
      </div>

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
