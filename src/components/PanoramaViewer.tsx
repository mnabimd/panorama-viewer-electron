import { useEffect, useRef, useMemo, memo } from 'react'
import { Viewer } from '@photo-sphere-viewer/core'
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin'
import { Scene, Hotspot } from '@/types/project.types'
import { convertHotspotToMarker } from '@/utils/panorama.utils'
import '@photo-sphere-viewer/core/index.css'
import '@photo-sphere-viewer/markers-plugin/index.css'
import './PanoramaViewer.css'

interface PanoramaViewerProps {
  scene: Scene
  hotspots: Hotspot[]
  isAddingHotspot: boolean
  onHotspotClick: (hotspot: Hotspot) => void
  onPanoramaClick: (position: { yaw: number; pitch: number }) => void
  onSceneHotspotClick: (targetSceneId: string) => void
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

// Memoize the component to prevent unnecessary re-renders
export const PanoramaViewer = memo(function PanoramaViewer({
  scene,
  hotspots,
  isAddingHotspot,
  onHotspotClick,
  onPanoramaClick,
  onSceneHotspotClick,
}: PanoramaViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<Viewer | null>(null)
  const markersPluginRef = useRef<MarkersPlugin | null>(null)

  // Memoize image URL calculation
  const imageUrl = useMemo(() => {
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

  // Memoize markers configuration - only recreate when hotspots change
  const markers = useMemo(() => {
    return hotspots.map(convertHotspotToMarker)
  }, [hotspots])

  // Initialize viewer on mount
  useEffect(() => {
    if (!containerRef.current) return

    try {
      logMessage('INFO', `Initializing viewer for scene: ${scene.id}`)

      // Create viewer instance
      const viewer = new Viewer({
        container: containerRef.current,
        panorama: imageUrl,
        defaultZoomLvl: 0,
        navbar: ['zoom', 'move', 'fullscreen'],
        plugins: [
          [MarkersPlugin, {
            markers: markers,
          }] as any,
        ],
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

      // Handle panorama clicks for adding hotspots
      viewer.addEventListener('click', (e: any) => {
        if (isAddingHotspot && e.data) {
          onPanoramaClick({
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
      }
    }
  }, []) // Only run on mount/unmount

  // Update panorama when scene changes
  useEffect(() => {
    if (viewerRef.current && imageUrl) {
      try {
        logMessage('INFO', `Updating panorama for scene: ${scene.id}`)
        viewerRef.current.setPanorama(imageUrl)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        logMessage('ERROR', `Failed to update panorama: ${errorMessage}`)
        console.error('Failed to update panorama:', err)
      }
    }
  }, [imageUrl, scene.id])

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

  // Update cursor style based on adding mode
  useEffect(() => {
    if (containerRef.current) {
      if (isAddingHotspot) {
        containerRef.current.classList.add('adding-hotspot')
      } else {
        containerRef.current.classList.remove('adding-hotspot')
      }
    }
  }, [isAddingHotspot])

  return (
    <div 
      ref={containerRef} 
      className="panorama-viewer-container"
      style={{ width: '100%', height: '100%' }}
    />
  )
})
