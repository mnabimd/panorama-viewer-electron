export interface AppSettings {
  workspacePath: string
  photoCompressionEnabled: boolean
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
