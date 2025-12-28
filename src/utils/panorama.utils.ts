import { Hotspot, HotspotType } from '@/types/project.types'

/**
 * Convert app hotspot to Photo Sphere Viewer marker configuration
 */
export function convertHotspotToMarker(hotspot: Hotspot) {
  const baseMarker = {
    id: hotspot.id,
    position: { yaw: hotspot.position.yaw, pitch: hotspot.position.pitch },
    tooltip: hotspot.tooltip || getDefaultTooltip(hotspot),
    visible: hotspot.isVisible !== false,
    data: { hotspot }, // Store original hotspot data
  }

  // Customize marker based on type
  switch (hotspot.type) {
    case 'scene':
      return {
        ...baseMarker,
        html: getMarkerHtmlForType('scene'),
        anchor: 'center center',
        className: 'psv-marker-scene',
      }
    case 'info':
      return {
        ...baseMarker,
        html: getMarkerHtmlForType('info'),
        anchor: 'center center',
        className: 'psv-marker-info',
      }
    case 'url':
      return {
        ...baseMarker,
        html: getMarkerHtmlForType('url'),
        anchor: 'center center',
        className: 'psv-marker-url',
      }
    default:
      return baseMarker
  }
}

/**
 * Get default tooltip text for a hotspot if none is provided
 */
function getDefaultTooltip(hotspot: Hotspot): string {
  switch (hotspot.type) {
    case 'scene':
      return 'Go to scene'
    case 'info':
      return hotspot.title || 'View information'
    case 'url':
      return 'Open link'
    default:
      return 'Hotspot'
  }
}

/**
 * Get custom HTML for marker based on hotspot type
 */
export function getMarkerHtmlForType(type: HotspotType): string {
  switch (type) {
    case 'scene':
      return `
        <div class="custom-marker scene-marker">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="#6366f1" stroke="white" stroke-width="2"/>
            <path d="M9 12L13 8L13 16L9 12Z" fill="white" transform="translate(2, 0)"/>
          </svg>
        </div>
      `
    case 'info':
      return `
        <div class="custom-marker info-marker">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="#f59e0b" stroke="white" stroke-width="2"/>
            <text x="12" y="17" font-size="14" font-weight="bold" fill="white" text-anchor="middle">i</text>
          </svg>
        </div>
      `
    case 'url':
      return `
        <div class="custom-marker url-marker">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="#10b981" stroke="white" stroke-width="2"/>
            <path d="M10 6H6C5.46957 6 4.96086 6.21071 4.58579 6.58579C4.21071 6.96086 4 7.46957 4 8V18C4 18.5304 4.21071 19.0391 4.58579 19.4142C4.96086 19.7893 5.46957 20 6 20H16C16.5304 20 17.0391 19.7893 17.4142 19.4142C17.7893 19.0391 18 18.5304 18 18V14M14 4H20M20 4V10M20 4L10 14" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      `
    default:
      return '<div class="custom-marker"></div>'
  }
}

/**
 * Validate position coordinates
 */
export function validatePosition(position: { yaw: number; pitch: number }): boolean {
  // Yaw: -π to π (or -180° to 180°)
  // Pitch: -π/2 to π/2 (or -90° to 90°)
  const isYawValid = position.yaw >= -Math.PI && position.yaw <= Math.PI
  const isPitchValid = position.pitch >= -Math.PI / 2 && position.pitch <= Math.PI / 2
  
  return isYawValid && isPitchValid
}

/**
 * Normalize yaw to be within -π to π range
 */
export function normalizeYaw(yaw: number): number {
  while (yaw > Math.PI) yaw -= 2 * Math.PI
  while (yaw < -Math.PI) yaw += 2 * Math.PI
  return yaw
}

/**
 * Clamp pitch to be within -π/2 to π/2 range
 */
export function clampPitch(pitch: number): number {
  return Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch))
}
