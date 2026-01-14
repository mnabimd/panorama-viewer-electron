/**
 * Project Manager Module
 * Main entry point that orchestrates all project-related IPC handlers
 */

import { setupProjectHandlers } from './project-handlers'
import { setupSceneHandlers } from './scene-handlers'
import { setupHotspotHandlers } from './hotspot-handlers'
import { setupUtilityHandlers } from './utility-handlers'

/**
 * Setup all project manager handlers
 * This function should be called once during app initialization
 */
export function setupProjectManager() {
  setupProjectHandlers()
  setupSceneHandlers()
  setupHotspotHandlers()
  setupUtilityHandlers()
}

// Re-export types for use in other modules
export * from './types'
