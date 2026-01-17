import { useState, useRef, useEffect, useMemo } from 'react'
import { X, Plus, Upload, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MapConfig, MapMarker, Scene } from '@/types/project.types'
import { MapMarkerDialog } from './MapMarkerDialog'
import { MapUploadDialog } from './MapUploadDialog'
import './MiniMap.css'

interface MiniMapProps {
  projectId: string
  mapConfig?: MapConfig
  currentSceneId: string
  scenes: Scene[]
  onNavigateToScene: (sceneId: string) => void
  onMapConfigUpdate: () => void
}

export function MiniMap({
  projectId,
  mapConfig,
  currentSceneId,
  scenes,
  onNavigateToScene,
  onMapConfigUpdate
}: MiniMapProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isPlacingMarker, setIsPlacingMarker] = useState(false)
  const [pendingMarkerPosition, setPendingMarkerPosition] = useState<{ x: number; y: number } | null>(null)
  const [isMarkerDialogOpen, setIsMarkerDialogOpen] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [mapUpdateTimestamp, setMapUpdateTimestamp] = useState(Date.now())
  const mapImageRef = useRef<HTMLImageElement>(null)

  // Don't render if no map image
  if (!mapConfig?.imagePath) {
    return null
  }

  const handleMapClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!isExpanded) {
      // Expand the map
      setIsExpanded(true)
      return
    }

    // If placing marker, calculate position relative to the image
    if (isPlacingMarker && mapImageRef.current) {
      const img = e.currentTarget
      const rect = img.getBoundingClientRect()
      
      // Calculate click position relative to the image
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      
      // Only create marker if click is within bounds
      if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
        setPendingMarkerPosition({ x, y })
        setIsMarkerDialogOpen(true)
        setIsPlacingMarker(false)
      }
    }
  }

  const handleMarkerClick = (e: React.MouseEvent, marker: MapMarker) => {
    e.stopPropagation()
    if (!isPlacingMarker) {
      onNavigateToScene(marker.sceneId)
      if (isExpanded) {
        setIsExpanded(false)
      }
    }
  }

  const handleAddMarker = () => {
    setIsPlacingMarker(true)
  }

  const handleMarkerSaved = async () => {
    setIsMarkerDialogOpen(false)
    setPendingMarkerPosition(null)
    await onMapConfigUpdate()
  }

  const handleDeleteMarker = async (markerId: string) => {
    try {
      // @ts-ignore
      const result = await window.ipcRenderer.invoke('delete-map-marker', {
        projectId,
        markerId
      })

      if (result.success) {
        await onMapConfigUpdate()
      }
    } catch (error) {
      console.error('Failed to delete marker:', error)
    }
  }

  const handleUploadComplete = async () => {
    setIsUploadDialogOpen(false)
    setMapUpdateTimestamp(Date.now()) // Force image reload by updating timestamp
    await onMapConfigUpdate()
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsExpanded(false)
      setIsPlacingMarker(false)
    }
  }

  const getSceneName = (sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId)
    return scene?.name || 'Unknown Scene'
  }

  // Convert file path to file:// URL if needed and add cache-busting parameter
  const mapImageUrl = useMemo(() => {
    if (!mapConfig.imagePath) return ''
    
    const baseUrl = mapConfig.imagePath.startsWith('http') || mapConfig.imagePath.startsWith('data:')
      ? mapConfig.imagePath
      : mapConfig.imagePath.startsWith('file://')
      ? mapConfig.imagePath
      : `file://${mapConfig.imagePath}`
    
    // Add cache-busting parameter to force reload when map is updated
    return `${baseUrl}?t=${mapUpdateTimestamp}`
  }, [mapConfig.imagePath, mapUpdateTimestamp])

  // Find the active marker
  const activeMarker = mapConfig.markers.find(m => m.sceneId === currentSceneId)

  if (!isExpanded) {
    // Collapsed state - zoom to active marker if present
    const zoomLevel = activeMarker ? 1.7 : 1 // 70% zoom = 1.7x scale
    const translateX = activeMarker ? (50 - activeMarker.position.x) : 0
    const translateY = activeMarker ? (50 - activeMarker.position.y) : 0

    return (
      <>
        <div 
          className="mini-map-collapsed"
          onClick={handleMapClick}
          style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transparent', // Let CSS handle the glossy background
            overflow: 'hidden'
          }}
        >
          <div 
            style={{ 
              position: 'relative', 
              maxWidth: '100%', 
              maxHeight: '100%',
              transform: `scale(${zoomLevel}) translate(${translateX}%, ${translateY}%)`,
              transformOrigin: 'center center',
              transition: 'transform 0.3s ease'
            }}
          >
            <img 
              src={mapImageUrl} 
              alt="Project Map" 
              className="mini-map-image"
              style={{ 
                display: 'block', 
                maxWidth: '100%', 
                maxHeight: '100%',
                width: 'auto',
                height: 'auto'
              }}
            />
            
            {/* Markers - positioned relative to the image */}
            {mapConfig.markers.map(marker => (
              <div
                key={marker.id}
                className={`map-marker ${marker.sceneId === currentSceneId ? 'map-marker-active' : 'map-marker-regular'}`}
                style={{
                  position: 'absolute',
                  left: `${marker.position.x}%`,
                  top: `${marker.position.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                onClick={(e) => handleMarkerClick(e, marker)}
                title={`${getSceneName(marker.sceneId)}${marker.label ? `: ${marker.label}` : ' - No description'}`}
              />
            ))}
          </div>
        </div>

        <MapMarkerDialog
          isOpen={isMarkerDialogOpen}
          onClose={() => {
            setIsMarkerDialogOpen(false)
            setPendingMarkerPosition(null)
          }}
          projectId={projectId}
          scenes={scenes}
          position={pendingMarkerPosition}
          currentSceneId={currentSceneId}
          onSaved={handleMarkerSaved}
        />

        <MapUploadDialog
          isOpen={isUploadDialogOpen}
          onClose={() => setIsUploadDialogOpen(false)}
          projectId={projectId}
          onUploadComplete={handleUploadComplete}
        />
      </>
    )
  }

  // Expanded state
  return (
    <>
      <div 
        className="mini-map-expanded px-5"
        onClick={handleBackdropClick}
      >
        <div className="mini-map-content-sidebar">
          {/* Marker List Sidebar - Vertical on the left */}
          <div className="mini-map-marker-sidebar">
            {/* Add Marker Button - Orange/Primary */}
            <button
              onClick={handleAddMarker}
              disabled={isPlacingMarker}
              className={`
                mini-map-action-button-vertical mini-map-action-button-primary
                ${isPlacingMarker ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">
                {isPlacingMarker ? 'Click on map...' : 'Add Marker'}
              </span>
            </button>

            {/* Upload Map Button - Purple */}
            <button
              onClick={() => setIsUploadDialogOpen(true)}
              className="mini-map-action-button-vertical mini-map-action-button-purple"
            >
              <Upload className="w-4 h-4" />
              <span className="text-sm font-medium">Upload Map</span>
            </button>

            {/* Marker Items */}
            <div className="mini-map-marker-list-vertical">
              {mapConfig.markers.length === 0 ? (
                <p className="text-sm text-gray-400 px-3 py-2">No markers yet</p>
              ) : (
                mapConfig.markers.map(marker => (
                  <div
                    key={marker.id}
                    className={`mini-map-marker-item-vertical ${marker.sceneId === currentSceneId ? 'active' : ''}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {getSceneName(marker.sceneId)}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {marker.label || 'No description'}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={() => handleDeleteMarker(marker.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Map Container */}
          <div 
            id="mini-map-image-container-main"
            className="mini-map-image-container"
            style={{ cursor: isPlacingMarker ? 'crosshair' : 'default' }}
          >
            {/* Close Button - Absolutely positioned */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(false)}
              className="absolute top-4 right-4 z-10 bg-[#252525]/80 hover:bg-[#333] backdrop-blur-sm"
            >
              <X className="w-5 h-5" />
            </Button>

            <div style={{ position: 'relative', display: 'inline-block' }}>
              <img 
                ref={mapImageRef}
                src={mapImageUrl} 
                alt="Project Map" 
                className="mini-map-image-expanded"
                onClick={handleMapClick}
                style={{ display: 'block' }}
              />
              
              {/* Markers - positioned relative to the image */}
              {mapConfig.markers.map(marker => (
                <div
                  key={marker.id}
                  className={`map-marker map-marker-expanded ${marker.sceneId === currentSceneId ? 'map-marker-active' : 'map-marker-regular'}`}
                  style={{
                    position: 'absolute',
                    left: `${marker.position.x}%`,
                    top: `${marker.position.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  onClick={(e) => handleMarkerClick(e, marker)}
                  title={`${getSceneName(marker.sceneId)}${marker.label ? `: ${marker.label}` : ' - No description'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <MapMarkerDialog
        isOpen={isMarkerDialogOpen}
        onClose={() => {
          setIsMarkerDialogOpen(false)
          setPendingMarkerPosition(null)
        }}
        projectId={projectId}
        scenes={scenes}
        position={pendingMarkerPosition}
        currentSceneId={currentSceneId}
        onSaved={handleMarkerSaved}
      />

      <MapUploadDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        projectId={projectId}
        onUploadComplete={handleUploadComplete}
      />
    </>
  )
}
