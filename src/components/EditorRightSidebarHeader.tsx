import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"

interface EditorRightSidebarHeaderProps {
  onPlay?: () => void
}

export function EditorRightSidebarHeader({
  onPlay
}: EditorRightSidebarHeaderProps) {
  return (
    <div className="right-sidebar-header">
      <Button className="publish-btn" size="sm" onClick={onPlay}>
        <Play size={16} className="mr-1" /> Play
      </Button>
    </div>
  )
}
