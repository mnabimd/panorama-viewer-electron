import { cn } from "@/lib/utils"

interface SceneCardProps {
  id: string
  name: string
  imagePath: string
  selected?: boolean
  onClick?: () => void
  className?: string
}

export function SceneCard({ id, name, imagePath, selected, onClick, className }: SceneCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative aspect-video rounded-lg overflow-hidden cursor-pointer transition-all",
        "hover:scale-102 hover:shadow-lg",
        selected ? "ring-3 ring-orange-500" : "ring-1 ring-gray-700",
        className
      )}
    >
      <img
        src={`file://${imagePath}`}
        alt={name}
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
        <p className="text-white text-sm font-medium truncate">{name}</p>
      </div>
    </div>
  )
}
