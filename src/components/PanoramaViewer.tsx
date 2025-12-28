import { useEffect, useRef, useState } from 'react'
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

export function PanoramaViewer({
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
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize viewer
  useEffect(() => {
    if (!containerRef.current) return

    try {
      setIsLoading(true)
      setError(null)

      logMessage('INFO', `Initializing viewer for scene: ${scene.id} (${scene.imagePath})`)

      // Create viewer instance
      const viewer = new Viewer({
        container: containerRef.current,
        panorama: scene.imagePath,
        navbar: [
          'zoom',
          'move',
          'fullscreen',
        ],
        defaultYaw: 0,
        defaultPitch: 0,
        minFov: 30,
        maxFov: 90,
        defaultZoomLvl: 50,
        mousewheel: true,
        mousemove: true,
        keyboard: 'fullscreen',
        fisheye: false,
        plugins: [
          [MarkersPlugin, {
            markers: [],
          }],
        ],
      })

      viewerRef.current = viewer
      markersPluginRef.current = viewer.getPlugin(MarkersPlugin) as MarkersPlugin

      // Handle ready event
      viewer.addEventListener('ready', () => {
        logMessage('INFO', 'Viewer ready')
        setIsLoading(false)
      })

      // Handle click events
      viewer.addEventListener('click', (e) => {
        // If in adding mode, capture position
        if (isAddingHotspot) {
          onPanoramaClick({
            yaw: e.data.yaw,
            pitch: e.data.pitch,
          })
        }
      })

      // Handle marker clicks
      if (markersPluginRef.current) {
        markersPluginRef.current.addEventListener('select-marker', ({ marker }) => {
          const hotspot = marker.data?.hotspot as Hotspot
          if (hotspot) {
            // Handle different hotspot types
            if (hotspot.type === 'scene') {
              onSceneHotspotClick(hotspot.targetSceneId)
            } else {
              onHotspotClick(hotspot)
            }
          }
        })
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      logMessage('ERROR', `Failed to initialize panorama viewer: ${errorMessage}`)
      console.error('Failed to initialize panorama viewer:', err)
      setError('Failed to initialize viewer')
      setIsLoading(false)
    }

    // Cleanup
    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy()
        viewerRef.current = null
        markersPluginRef.current = null
      }
    }
  }, [scene.id, scene.imagePath]) // Reinitialize when scene changes

  // Update markers when hotspots change
  useEffect(() => {
    if (!markersPluginRef.current) return

    try {
      // Clear existing markers
      markersPluginRef.current.clearMarkers()

      // Add new markers
      const markers = hotspots.map(convertHotspotToMarker)
      markersPluginRef.current.setMarkers(markers)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      logMessage('ERROR', `Failed to update markers: ${errorMessage}`)
      console.error('Failed to update markers:', err)
    }
  }, [hotspots])

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

  if (error) {
    return (
      <div className="panorama-viewer-container">
        <div className="panorama-loading">
          <div className="text-center">
            <p className="text-red-500 mb-2">⚠️ {error}</p>
            <p className="text-sm text-gray-400">Please check the image path and try again</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="panorama-viewer-container" ref={containerRef}>
      {isLoading && (
        <div className="panorama-loading">
          <div className="text-center">
            <div className="mb-2">Loading panorama...</div>
            <div className="text-sm text-gray-400">{scene.name}</div>
          </div>
        </div>
      )}
    </div>
  )
}
