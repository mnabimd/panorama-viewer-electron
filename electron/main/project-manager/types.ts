/**
 * Type definitions for project manager
 */

// Hotspot types
export type HotspotType = 'scene' | 'info' | 'url'

export interface BaseHotspot {
  id: string
  type: HotspotType
  position: {
    yaw: number    // Horizontal rotation in degrees
    pitch: number  // Vertical rotation in degrees
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
  imagePath: string  // Stores both image and video paths for backward compatibility
  mediaType?: 'image' | 'video'  // Type of media (defaults to 'image' for backward compatibility)
  hotspots: Hotspot[]
  thumbnail?: string
  description?: string
  isVisible?: boolean  // Controls visibility in sidebar (default: true)
  isFeatured?: boolean  // Marks the scene as featured/indexed (only one can be featured)
  coordinates?: [number, number]  // GPS coordinates [longitude, latitude]
  bearing?: number  // Orientation/direction in degrees (0-360)
  sphereCorrection?: { pan?: number, tilt?: number, roll?: number }
  metadata?: {
    fileSize?: number  // File size in bytes
    dateAdded?: string  // ISO date string when scene was added
  }
}

export interface ProjectMetadata {
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
}

export interface CreateProjectParams {
  name: string
  description?: string
  category?: string
}
