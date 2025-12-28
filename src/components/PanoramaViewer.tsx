import { useEffect, useRef, useMemo, useCallback, memo } from 'react'
import { ReactPhotoSphereViewer } from 'react-photo-sphere-viewer'
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin'
import { Scene, Hotspot } from '@/types/project.types'
import { convertHotspotToMarker } from '@/utils/panorama.utils'
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
  const photoSphereRef = useRef<any>(null)
  const markersPluginRef = useRef<any>(null)

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

  // Setup plugins configuration - markers are already memoized for performance
  const plugins = [
    [
      MarkersPlugin,
      {
        markers: markers,
      },
    ] as [typeof MarkersPlugin, any],
  ]



  // Memoize viewer ready handler
  const handleReady = useCallback((instance: any) => {
    // Only log on initial load, not on every render
    if (!markersPluginRef.current) {
      logMessage('INFO', `Viewer ready for scene: ${scene.id}`)
    }
    
    const markersPlugin = instance.getPlugin(MarkersPlugin)
    if (!markersPlugin) return

    markersPluginRef.current = markersPlugin

    // Remove old listener if exists to prevent duplicates
    markersPlugin.removeEventListener('select-marker')
    
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
  }, [scene.id, onSceneHotspotClick, onHotspotClick])

  // Memoize panorama click handler
  const handleClick = useCallback((instance: any) => {
    if (isAddingHotspot) {
      const data = instance.data
      onPanoramaClick({
        yaw: data.yaw,
        pitch: data.pitch,
      })
    }
  }, [isAddingHotspot, onPanoramaClick])

  // Update markers when hotspots change - optimized
  useEffect(() => {
    if (!markersPluginRef.current) return

    try {
      const markersPlugin = markersPluginRef.current
      markersPlugin.clearMarkers()
      markersPlugin.setMarkers(markers)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      logMessage('ERROR', `Failed to update markers: ${errorMessage}`)
      console.error('Failed to update markers:', err)
    }
  }, [markers])

  // Update cursor style based on adding mode
  useEffect(() => {
    const container = document.querySelector('.panorama-viewer-container')
    if (container) {
      if (isAddingHotspot) {
        container.classList.add('adding-hotspot')
      } else {
        container.classList.remove('adding-hotspot')
      }
    }
  }, [isAddingHotspot])

  return (
    <div className="panorama-viewer-container">
      <ReactPhotoSphereViewer
        ref={photoSphereRef}
        src={imageUrl}
        height="100%"
        width="100%"
        defaultZoomLvl={0}
        navbar={['zoom', 'move', 'fullscreen']}
        plugins={plugins}
        onReady={handleReady}
        onClick={handleClick}
        mousewheel={true}
        mousemove={true}
        keyboard="fullscreen"
      />
    </div>
  )
})
