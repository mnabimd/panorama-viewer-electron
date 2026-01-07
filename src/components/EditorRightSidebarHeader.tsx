import { Button } from "@/components/ui/button"

interface EditorRightSidebarHeaderProps {
  onPublish?: () => void
}

export function EditorRightSidebarHeader({
  onPublish
}: EditorRightSidebarHeaderProps) {
  return (
    <div className="right-sidebar-header">
      <Button className="publish-btn" size="sm" onClick={onPublish}>
        Publish
      </Button>
    </div>
  )
}
