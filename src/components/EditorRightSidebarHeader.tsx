import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"

interface EditorRightSidebarHeaderProps {
  onPlay?: () => void
  onPublish?: () => void
}

export function EditorRightSidebarHeader({
  onPlay,
  onPublish
}: EditorRightSidebarHeaderProps) {
  return (
    <div className="right-sidebar-header">
      <Button variant="ghost" size="icon" onClick={onPlay}>
        <Play size={18} /> 
      </Button>
      <Button className="publish-btn" size="sm" onClick={onPublish}>
        Publish
      </Button>
    </div>
  )
}
