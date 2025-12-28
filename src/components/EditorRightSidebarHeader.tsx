import { Button } from "@/components/ui/button"
import { Play, Plus } from "lucide-react"

interface EditorRightSidebarHeaderProps {
  onPlay?: () => void
  onPublish?: () => void
  isAddingHotspot?: boolean
  onToggleAddHotspot?: () => void
}

export function EditorRightSidebarHeader({
  onPlay,
  onPublish,
  isAddingHotspot,
  onToggleAddHotspot
}: EditorRightSidebarHeaderProps) {
  return (
    <div className="right-sidebar-header">
      <Button 
        variant={isAddingHotspot ? "default" : "ghost"} 
        size="icon" 
        onClick={onToggleAddHotspot}
        className={isAddingHotspot ? "bg-orange-500 hover:bg-orange-600" : ""}
        title={isAddingHotspot ? "Cancel adding hotspot" : "Click to add hotspot"}
      >
        <Plus size={18} /> 
      </Button>
      <Button variant="ghost" size="icon" onClick={onPlay}>
        <Play size={18} /> 
      </Button>
      <Button className="publish-btn" size="sm" onClick={onPublish}>
        Publish
      </Button>
    </div>
  )
}
