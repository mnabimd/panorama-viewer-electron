import { useState, useEffect } from 'react'
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Scene } from "@/types/project.types"

interface SceneCommentsPanelProps {
  currentScene: Scene | undefined
  onUpdateComment: (comment: string) => void
}

export function SceneCommentsPanel({
  currentScene,
  onUpdateComment
}: SceneCommentsPanelProps) {
  const [comment, setComment] = useState('')

  // Update local state when scene changes
  useEffect(() => {
    setComment(currentScene?.comment || '')
  }, [currentScene?.id, currentScene?.comment])

  if (!currentScene) {
    return <p className="text-sm text-gray-500">No scene selected</p>
  }

  const handleBlur = () => {
    if (comment !== currentScene.comment) {
      onUpdateComment(comment)
    }
  }

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label className="text-xs text-gray-400">Scene Comments</Label>
        <p className="text-[10px] text-gray-600">Notes are saved automatically</p>
      </div>
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        onBlur={handleBlur}
        placeholder="Add notes about the scene..."
        className="bg-[#252525] border-gray-700 text-white text-sm min-h-[100px] resize-none focus:border-orange-500 transition-colors w-[90%]"
      />
    </div>
  )
}
