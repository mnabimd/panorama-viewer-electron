import { cn } from "@/lib/utils"
import { formatFileSize, formatRelativeTime } from "@/utils/format.utils"
import { Check, Video } from "lucide-react"

interface SceneListRowProps {
  id: string
  name: string
  imagePath: string
  thumbnail?: string
  mediaType?: 'image' | 'video'
  fileSize?: number
  dateAdded?: string
  selected?: boolean
  onClick?: () => void
}

export function SceneListRow({
  id,
  name,
  imagePath,
  thumbnail,
  mediaType,
  fileSize,
  dateAdded,
  selected,
  onClick
}: SceneListRowProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all",
        "hover:bg-gray-800",
        selected
          ? "bg-orange-500/10 ring-2 ring-orange-500"
          : "ring-1 ring-gray-700"
      )}
    >
      {/* Thumbnail */}
      <div className="relative w-20 h-14 flex-shrink-0 rounded overflow-hidden bg-gray-900">
        <img
          src={`file://${thumbnail || imagePath}`}
          alt={name}
          className="w-full h-full object-cover"
        />
        {mediaType === 'video' && (
          <div className="absolute top-1 left-1 bg-black/70 rounded px-1 py-0.5">
            <Video size={10} className="text-white" />
          </div>
        )}
        {selected && (
          <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center">
            <div className="bg-orange-500 rounded-full p-1">
              <Check size={12} className="text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{name}</p>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
          {fileSize !== undefined && (
            <span>{formatFileSize(fileSize)}</span>
          )}
          {dateAdded && (
            <>
              {fileSize !== undefined && <span>•</span>}
              <span>{formatRelativeTime(dateAdded)}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
