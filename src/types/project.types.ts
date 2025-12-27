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
  cover?: string
}
