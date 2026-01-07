import { useEffect, useRef, useMemo, memo } from 'react'
import { Viewer } from '@photo-sphere-viewer/core'
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin'
import { CompassPlugin } from '@photo-sphere-viewer/compass-plugin'
import { PlanPlugin } from '@photo-sphere-viewer/plan-plugin'
import { VideoPlugin } from '@photo-sphere-viewer/video-plugin'
import { EquirectangularVideoAdapter } from '@photo-sphere-viewer/equirectangular-video-adapter'
import { Scene, Hotspot } from '@/types/project.types'
import { convertHotspotToMarker } from '@/utils/panorama.utils'
import { PanoramaPickingOverlay } from './PanoramaPickingOverlay'
import '@photo-sphere-viewer/core/index.css'
import '@photo-sphere-viewer/markers-plugin/index.css'
import '@photo-sphere-viewer/compass-plugin/index.css'
import '@photo-sphere-viewer/video-plugin/index.css'
import 'leaflet/dist/leaflet.css'
import '@photo-sphere-viewer/plan-plugin/index.css'
import './PanoramaViewer.css'

interface PanoramaViewerProps {
  scene: Scene
  hotspots: Hotspot[]
  isAddingHotspot: boolean
  onHotspotClick: (hotspot: Hotspot) => void
  onPanoramaClick: (position: { yaw: number; pitch: number }) => void
  onSceneHotspotClick: (targetSceneId: string) => void
  onCancelPicking: () => void
}

const logMessage = async (level: 'INFO' | 'ERROR' | 'WARN', message: string) => {
  try {
    // @ts-ignore
    await window.ipcRenderer.invoke('log-message', {
      level,
      context: 'PanoramaViewer',
      file: 'src/components/PanoramaViewer.tsx',
      message
    })
  } catch (e) {
    console.error('Failed to log message:', e)
  }
}

// Custom compass SVG with NEWS cardinal directions
const compassBackgroundSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="48" fill="rgba(0, 0, 0, 0.3)" stroke="rgba(255, 255, 255, 0.4)" stroke-width="1"/>
    
    <!-- Degree markings -->
    <g stroke="rgba(255, 255, 255, 0.3)" stroke-width="0.5">
      ${Array.from({ length: 36 }, (_, i) => {
        const angle = i * 10 - 90;
        const isCardinal = i % 9 === 0;
        const length = isCardinal ? 8 : 4;
        const x1 = 50 + 40 * Math.cos(angle * Math.PI / 180);
        const y1 = 50 + 40 * Math.sin(angle * Math.PI / 180);
        const x2 = 50 + (40 - length) * Math.cos(angle * Math.PI / 180);
        const y2 = 50 + (40 - length) * Math.sin(angle * Math.PI / 180);
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-width="${isCardinal ? 1 : 0.5}"/>`;
      }).join('')}
    </g>
    
    <!-- Cardinal direction labels -->
    <text x="50" y="18" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="white">N</text>
    <text x="82" y="54" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="white">E</text>
    <text x="50" y="86" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="white">S</text>
    <text x="18" y="54" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="white">W</text>
    
    <!-- Center dot -->
    <circle cx="50" cy="50" r="2" fill="rgba(255, 255, 255, 0.6)"/>
  </svg>
`

// Convert hotspots to compass hotspots format
const convertHotspotsToCompassHotspots = (hotspots: Hotspot[]) => {
  return hotspots.map(hotspot => ({
    yaw: hotspot.position.yaw,
    pitch: hotspot.position.pitch,
    color: '#f97316', // Orange color matching app theme
  }))
}

// Convert hotspots to plan hotspots format
const convertHotspotsToPlanHotspots = (hotspots: Hotspot[], sceneCoordinates: [number, number]) => {
  return hotspots.map((hotspot, index) => {
    // Get tooltip based on hotspot type
    let tooltip = ''
    if (hotspot.type === 'info') {
      tooltip = hotspot.title || hotspot.content
    } else if (hotspot.type === 'scene') {
      tooltip = 'Navigate to scene'
    } else if (hotspot.type === 'url') {
      tooltip = hotspot.url
    }

    return {
      id: hotspot.id || `hotspot-${index}`,
      coordinates: sceneCoordinates, // Use scene's GPS coordinates for all hotspots
      tooltip,
      style: {
        color: '#f97316',
        size: 8,
      },
    }
  })
}

// Memoize the component to prevent unnecessary re-renders
export const PanoramaViewer = memo(function PanoramaViewer({
  scene,
  hotspots,
  isAddingHotspot,
  onHotspotClick,
  onPanoramaClick,
  onSceneHotspotClick,
  onCancelPicking,
}: PanoramaViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<Viewer | null>(null)
  const markersPluginRef = useRef<MarkersPlugin | null>(null)
  const compassPluginRef = useRef<CompassPlugin | null>(null)
  const planPluginRef = useRef<PlanPlugin | null>(null)
  const isAddingHotspotRef = useRef(isAddingHotspot)
  const onPanoramaClickRef = useRef(onPanoramaClick)

  // Memoize media URL calculation
  const mediaUrl = useMemo(() => {
    const path = scene.imagePath
    if (path.startsWith('http') || path.startsWith('data:')) {
      return path
    }
    
    // It's a local file - add file:// protocol if missing
    if (!path.startsWith('file://')) {
      const prefix = path.startsWith('/') ? 'file://' : 'file:///'
      return `${prefix}${path}`
    }
    
    return path
  }, [scene.imagePath])

  // Determine if this is a video scene
  const isVideo = useMemo(() => {
    return scene.mediaType === 'video'
  }, [scene.mediaType])

  // Memoize markers configuration - only recreate when hotspots change
  const markers = useMemo(() => {
    return hotspots.map(convertHotspotToMarker)
  }, [hotspots])

  // Memoize compass hotspots configuration
  const compassHotspots = useMemo(() => {
    return convertHotspotsToCompassHotspots(hotspots)
  }, [hotspots])

  // Memoize plan hotspots configuration
  const planHotspots = useMemo(() => {
    const sceneCoords = scene.coordinates || [0, 0] as [number, number]
    return convertHotspotsToPlanHotspots(hotspots, sceneCoords)
  }, [hotspots, scene.coordinates])

  // Initialize viewer on mount
  useEffect(() => {
    if (!containerRef.current) return

    try {
      logMessage('INFO', `Initializing viewer for scene: ${scene.id}`)

      // Create viewer instance
      // Build plugins array conditionally based on media type
      const plugins: any[] = [
        [MarkersPlugin, {
          markers: markers,
        }],
        [CompassPlugin, {
          size: '120px',
          position: 'top-right',
          backgroundSvg: compassBackgroundSvg,
          coneColor: 'rgba(255, 255, 255, 0.5)',
          navigation: true,
          hotspots: compassHotspots,
          hotspotColor: '#f97316', // Orange color matching app theme
        }],
        /* PlanPlugin temporarily hidden
        [PlanPlugin, {
          coordinates: scene.coordinates || [0, 0],
          bearing: scene.bearing || 0,
          size: { width: '300px', height: '200px' },
          position: 'bottom left',
          visibleOnLoad: true,
          defaultZoom: 32,
          hotspots: planHotspots,
          spotStyle: {
            size: 8,
            color: '#f97316',
          },
        }],
        */
      ]

      // Add VideoPlugin for video scenes
      if (isVideo) {
        plugins.push([VideoPlugin, {
          progressbar: true,
          bigbutton: true,
        }])
      }

      const viewer = new Viewer({
        container: containerRef.current,
        // For videos, use adapter and pass source in panorama object
        ...(isVideo ? {
          adapter: EquirectangularVideoAdapter,
          panorama: {
            source: mediaUrl,
          },
        } : {
          // For images, use default adapter with panorama URL
          panorama: mediaUrl,
        }),
        defaultZoomLvl: 0,
        // Update navbar to include video controls if it's a video
        navbar: isVideo 
          ? ['videoPlay', 'videoVolume', 'videoTime', 'zoom', 'move', 'fullscreen'] 
          : ['zoom', 'move', 'fullscreen'],
        plugins: plugins,
        mousewheel: true,
        mousemove: true,
        keyboard: 'fullscreen',
      })

      viewerRef.current = viewer

      // Get markers plugin instance
      const markersPlugin = viewer.getPlugin(MarkersPlugin) as MarkersPlugin | undefined
      if (markersPlugin) {
        markersPluginRef.current = markersPlugin

        // Handle marker clicks
        markersPlugin.addEventListener('select-marker', (e: any) => {
          const hotspot = e.marker.data?.hotspot as Hotspot
          if (hotspot) {
            if (hotspot.type === 'scene') {
              onSceneHotspotClick(hotspot.targetSceneId)
            } else {
              onHotspotClick(hotspot)
            }
          }
        })
      }

      // Get compass plugin instance
      const compassPlugin = viewer.getPlugin(CompassPlugin) as CompassPlugin | undefined
      if (compassPlugin) {
        compassPluginRef.current = compassPlugin
      }

      // Get plan plugin instance
      const planPlugin = viewer.getPlugin(PlanPlugin) as PlanPlugin | undefined
      if (planPlugin) {
        planPluginRef.current = planPlugin

        // Handle plan hotspot clicks - navigate to the hotspot
        planPlugin.addEventListener('select-hotspot', (e: any) => {
          const hotspotId = e.hotspotId
          const hotspot = hotspots.find(h => h.id === hotspotId || `hotspot-${hotspots.indexOf(h)}` === hotspotId)
          if (hotspot) {
            // Animate to the hotspot position
            viewer.animate({
              yaw: hotspot.position.yaw,
              pitch: hotspot.position.pitch,
              speed: '2rpm',
            })
          }
        })
      }

      // Handle panorama clicks for adding hotspots
      // Note: Click must be quick - dragging will pan the panorama instead
      viewer.addEventListener('click', (e: any) => {
        if (isAddingHotspotRef.current && e.data) {
          onPanoramaClickRef.current({
            yaw: e.data.yaw,
            pitch: e.data.pitch,
          })
        }
      })

      logMessage('INFO', `Viewer initialized successfully for scene: ${scene.id}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      logMessage('ERROR', `Failed to initialize viewer: ${errorMessage}`)
      console.error('Failed to initialize viewer:', err)
    }

    // Cleanup on unmount
    return () => {
      if (viewerRef.current) {
        logMessage('INFO', `Destroying viewer for scene: ${scene.id}`)
        viewerRef.current.destroy()
        viewerRef.current = null
        markersPluginRef.current = null
        compassPluginRef.current = null
        planPluginRef.current = null
      }
    }
  }, [isVideo]) // Only reinitialize when media type changes (requires different adapter)

  // Store latest markers in ref for access during panorama update
  const markersRef = useRef(markers)
  useEffect(() => {
    markersRef.current = markers
  }, [markers])

  // Update panorama when scene changes
  useEffect(() => {
    if (viewerRef.current && mediaUrl) {
      const updatePanorama = async () => {
        try {
          logMessage('INFO', `Updating panorama for scene: ${scene.id}`)
          // For videos, pass source object; for images, pass URL directly
          const panoramaConfig = isVideo ? { source: mediaUrl } : mediaUrl
          
          await viewerRef.current?.setPanorama(panoramaConfig)
          
          // Re-apply markers after panorama update to ensure they are visible
          // This fixes a race condition where markers might be cleared or not shown
          if (markersPluginRef.current && markersRef.current.length > 0) {
            logMessage('INFO', `Re-applying ${markersRef.current.length} markers after panorama update`)
            markersPluginRef.current.clearMarkers()
            markersPluginRef.current.setMarkers(markersRef.current)
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err)
          logMessage('ERROR', `Failed to update panorama: ${errorMessage}`)
          console.error('Failed to update panorama:', err)
        }
      }

      updatePanorama()
    }
  }, [mediaUrl, scene.id, isVideo])

  // Update markers when hotspots change
  useEffect(() => {
    if (!markersPluginRef.current) return

    try {
      markersPluginRef.current.clearMarkers()
      markersPluginRef.current.setMarkers(markers)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      logMessage('ERROR', `Failed to update markers: ${errorMessage}`)
      console.error('Failed to update markers:', err)
    }
  }, [markers])

  // Update compass hotspots when hotspots change
  useEffect(() => {
    if (!compassPluginRef.current) return

    try {
      compassPluginRef.current.setHotspots(compassHotspots)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      logMessage('ERROR', `Failed to update compass hotspots: ${errorMessage}`)
      console.error('Failed to update compass hotspots:', err)
    }
  }, [compassHotspots])

  // Update plan coordinates when scene changes
  useEffect(() => {
    if (!planPluginRef.current) return

    try {
      const coords = scene.coordinates || [0, 0] as [number, number]
      planPluginRef.current.setCoordinates(coords)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      logMessage('ERROR', `Failed to update plan coordinates: ${errorMessage}`)
      console.error('Failed to update plan coordinates:', err)
    }
  }, [scene.coordinates])

  // Update plan hotspots when hotspots change
  useEffect(() => {
    if (!planPluginRef.current) return

    try {
      planPluginRef.current.setHotspots(planHotspots)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      logMessage('ERROR', `Failed to update plan hotspots: ${errorMessage}`)
      console.error('Failed to update plan hotspots:', err)
    }
  }, [planHotspots])

  // Update ref and cursor style based on adding mode
  useEffect(() => {
    isAddingHotspotRef.current = isAddingHotspot
    onPanoramaClickRef.current = onPanoramaClick
    
    if (containerRef.current) {
      if (isAddingHotspot) {
        containerRef.current.classList.add('adding-hotspot')
      } else {
        containerRef.current.classList.remove('adding-hotspot')
      }
    }
  }, [isAddingHotspot, onPanoramaClick])

  return (
    <div 
      ref={containerRef} 
      className="panorama-viewer-container"
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      <PanoramaPickingOverlay 
        isActive={isAddingHotspot}
        onCancel={onCancelPicking}
      />
    </div>
  )
})
