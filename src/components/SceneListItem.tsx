import { Eye, EyeOff, Video } from "lucide-react"
import { Scene } from "@/types/project.types"

interface SceneListItemProps {
  scene: Scene
  isActive: boolean
  onSelect: (sceneId: string) => void
  onToggleVisibility: (e: React.MouseEvent, sceneId: string) => void
}

export function SceneListItem({ 
  scene, 
  isActive, 
  onSelect, 
  onToggleVisibility 
}: SceneListItemProps) {
  return (
    <div 
      className={`scene-item ${isActive ? 'active' : ''}`}
      onClick={() => onSelect(scene.id)}
    >
      <img 
        src={`file://${scene.thumbnail || scene.imagePath}`}
        alt={scene.name} 
        className="scene-thumbnail" 
        style={{ opacity: scene.isVisible !== false ? 1 : 0.15 }}
      />
      {scene.mediaType === 'video' && (
        <div className="absolute top-1 left-1 bg-black/70 rounded px-1 py-0.5 flex items-center gap-0.5">
          <Video size={10} className="text-white" />
        </div>
      )}
      <div className="scene-name">{scene.name}</div>
      <button 
        className={`visibility-toggle ${scene.isVisible === false ? 'is-hidden' : ''}`}
        onClick={(e) => onToggleVisibility(e, scene.id)}
      >
        {scene.isVisible !== false ? <Eye size={16} /> : <EyeOff size={16} />}
      </button>
    </div>
  )
}
