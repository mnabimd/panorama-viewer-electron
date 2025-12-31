import { cn } from "@/lib/utils"
import { Video } from "lucide-react"

interface SceneCardProps {
  id: string
  name: string
  imagePath: string
  thumbnail?: string
  mediaType?: 'image' | 'video'
  selected?: boolean
  onClick?: () => void
  className?: string
}

export function SceneCard({ id, name, imagePath, thumbnail, mediaType, selected, onClick, className }: SceneCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative aspect-video rounded-lg overflow-hidden cursor-pointer transition-all",
        "hover:scale-102 hover:shadow-lg",
        "ring-2",
        selected 
          ? "ring-orange-500" 
          : "ring-gray-700 hover:ring-orange-400",
        className
      )}
    >
      <img
        src={`file://${thumbnail || imagePath}`}
        alt={name}
        className="w-full h-full object-cover"
      />
      {mediaType === 'video' && (
        <div className="absolute top-2 left-2 bg-black/70 rounded px-1.5 py-0.5 flex items-center gap-1">
          <Video size={14} className="text-white" />
          <span className="text-white text-xs font-medium">Video</span>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
        <p className="text-white text-sm font-medium truncate">{name}</p>
      </div>
    </div>
  )
}
