export interface AppSettings {
  workspacePath: string
  photoCompressionEnabled: boolean
  compressionQuality: number  // JPEG quality 1-100 (default: 85)
  maxImageWidth: number       // Max width in pixels (default: 8192)
  maxImageHeight: number      // Max height in pixels (default: 4096)
  recentWorkspaces: string[]
  lastUpdatedAt: string
}


export interface WorkspaceInfo {
  path: string
  exists: boolean
  projectCount: number
  hasProjects: boolean
  isValid: boolean
  error?: string
}

export interface UpdateStatus {
  checking: boolean
  available: boolean
  currentVersion: string
  newVersion?: string
  error?: string
}
