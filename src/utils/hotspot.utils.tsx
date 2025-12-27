import { Hotspot, HotspotType, Scene } from '@/types/project.types'
import { MapPin, Info, Link2 } from 'lucide-react'

/**
 * Get the appropriate icon component for a hotspot type
 */
export function getHotspotIcon(type: HotspotType, size: number = 18) {
  switch (type) {
    case 'scene': return <MapPin size={size} className="text-blue-400" />
    case 'info': return <Info size={size} className="text-green-400" />
    case 'url': return <Link2 size={size} className="text-purple-400" />
  }
}

/**
 * Get a human-readable label for a hotspot
 */
export function getHotspotLabel(hotspot: Hotspot, scenes?: Scene[]): string {
  switch (hotspot.type) {
    case 'scene':
      if (scenes) {
        const targetScene = scenes.find(s => s.id === hotspot.targetSceneId)
        return targetScene?.name || 'Unknown Scene'
      }
      return hotspot.tooltip || 'Scene Hotspot'
    case 'info':
      return hotspot.title || 'Info Hotspot'
    case 'url':
      const url = hotspot.url
      return url.length > 30 ? url.substring(0, 30) + '...' : url
    default:
      return 'Hotspot'
  }
}

