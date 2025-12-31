// Hotspot types
export type HotspotType = 'scene' | 'info' | 'url'

export interface BaseHotspot {
  id: string
  type: HotspotType
  position: {
    yaw: number
    pitch: number
  }
  tooltip?: string
  isVisible?: boolean  // Controls visibility in viewer (default: true)
}

export interface SceneHotspot extends BaseHotspot {
  type: 'scene'
  targetSceneId: string
  transition?: 'fade' | 'slide' | 'none'
}

export interface InfoHotspot extends BaseHotspot {
  type: 'info'
  title: string
  content: string
  imageUrl?: string
}

export interface UrlHotspot extends BaseHotspot {
  type: 'url'
  url: string
  openInNewTab?: boolean
}

export type Hotspot = SceneHotspot | InfoHotspot | UrlHotspot

// Scene interface
export interface Scene {
  id: string
  name: string
  imagePath: string
  hotspots: Hotspot[]
  thumbnail?: string
  description?: string
  isVisible?: boolean
  isFeatured?: boolean  // Marks the scene as featured/indexed (only one can be featured)
  coordinates?: [number, number]  // GPS coordinates [longitude, latitude]
  bearing?: number  // Orientation/direction in degrees (0-360)
  metadata?: {
    fileSize?: number  // File size in bytes
    dateAdded?: string  // ISO date string when scene was added
  }
}

// Project interface
export interface Project {
  id: string
  name: string
  description: string
  category?: string
  version: string
  createdAt: string
  updatedAt: string
  mainSceneId?: string
  scenes: Scene[]
  settings: {
    autoRotate: boolean
    initialFov: number
  }
  path?: string
}
