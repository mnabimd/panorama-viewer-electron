import { Eye, EyeOff } from "lucide-react"
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
