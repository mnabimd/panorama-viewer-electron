import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Save, X, Pencil, Trash2 } from "lucide-react"
import { Scene, Hotspot } from "@/types/project.types"

interface SceneSettingsPanelProps {
  currentScene: Scene | undefined
  scenes: Scene[]
  activeScene: string
  allHotspotsVisible: boolean
  hotspots: Hotspot[]
  editingSceneName: boolean
  tempSceneName: string
  isDeletingScene: boolean
  onTempSceneNameChange: (name: string) => void
  onStartEditSceneName: () => void
  onSaveSceneName: () => void
  onCancelEditSceneName: () => void
  onToggleSceneVisibility: (e: React.MouseEvent, sceneId: string) => void
  onToggleFeatured: (checked: boolean) => void
  onToggleAllHotspots: (checked: boolean) => void
  onReplaceImage: () => void
  onDeleteScene: () => void
  onUpdateCoordinates: (longitude: number | undefined, latitude: number | undefined) => void
}

export function SceneSettingsPanel({
  currentScene,
  scenes,
  activeScene,
  allHotspotsVisible,
  hotspots,
  editingSceneName,
  tempSceneName,
  isDeletingScene,
  onTempSceneNameChange,
  onStartEditSceneName,
  onSaveSceneName,
  onCancelEditSceneName,
  onToggleSceneVisibility,
  onToggleFeatured,
  onToggleAllHotspots,
  onReplaceImage,
  onDeleteScene,
  onUpdateCoordinates
}: SceneSettingsPanelProps) {
  // Local state for GPS inputs to allow typing
  const [localLongitude, setLocalLongitude] = useState<string>('')
  const [localLatitude, setLocalLatitude] = useState<string>('')

  // Update local state when scene changes
  useEffect(() => {
    setLocalLongitude(currentScene?.coordinates?.[0]?.toString() ?? '')
    setLocalLatitude(currentScene?.coordinates?.[1]?.toString() ?? '')
  }, [currentScene?.id, currentScene?.coordinates])

  if (!currentScene) {
    return <p className="text-sm text-gray-500">No scene selected</p>
  }

  const handleSaveCoordinates = () => {
    const lon = localLongitude ? parseFloat(localLongitude) : undefined
    const lat = localLatitude ? parseFloat(localLatitude) : undefined
    onUpdateCoordinates(lon, lat)
  }

  return (
    <>
      {/* Scene Name */}
      <div className="space-y-2">
        <Label className="text-xs text-gray-400">Scene Name</Label>
        {editingSceneName ? (
          <div className="flex gap-2">
            <Input
              value={tempSceneName}
              onChange={(e) => onTempSceneNameChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSaveSceneName()}
              className="bg-[#252525] border-gray-700 text-white text-sm"
              autoFocus
            />
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={onSaveSceneName}
              className="shrink-0"
            >
              <Save size={16} />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={onCancelEditSceneName}
              className="shrink-0"
            >
              <X size={16} />
            </Button>
          </div>
        ) : (
          <div 
            className="flex items-center justify-between p-2 bg-[#252525] rounded-md cursor-pointer hover:bg-[#2a2a2a]"
            onClick={onStartEditSceneName}
          >
            <span className="text-sm">{currentScene.name}</span>
            <Pencil size={14} className="text-gray-500" />
          </div>
        )}
      </div>

      {/* Scene Visibility */}
      <div className="flex items-center justify-between">
        <Label className="text-xs text-gray-400">Show Scene</Label>
        <Switch
          checked={currentScene.isVisible !== false}
          onCheckedChange={() => onToggleSceneVisibility({ stopPropagation: () => {} } as React.MouseEvent, activeScene)}
        />
      </div>

      {/* Featured Scene */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-xs text-gray-400">Featured Scene</Label>
          <p className="text-xs text-gray-600">Mark as main/indexed scene</p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Switch
                  checked={currentScene.isFeatured === true}
                  onCheckedChange={onToggleFeatured}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-[#333] text-white border-gray-600">
              <p className="max-w-xs">
                When enabled, this scene will be set as the main entry point for your project.
                Only one scene can be featured at a time.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* All Hotspots Visibility */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-xs text-gray-400">Show All Hotspots</Label>
          <p className="text-xs text-gray-600">{hotspots.length} hotspot{hotspots.length !== 1 ? 's' : ''}</p>
        </div>
        <Switch
          checked={allHotspotsVisible}
          onCheckedChange={onToggleAllHotspots}
        />
      </div>

      {/* GPS Coordinates */}
      <div className="space-y-2">
        <Label className="text-xs text-gray-400">GPS Coordinates (Optional)</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="longitude" className="text-xs text-gray-500">Longitude</Label>
            <Input
              id="longitude"
              type="number"
              step="any"
              value={localLongitude}
              onChange={(e) => setLocalLongitude(e.target.value)}
              onBlur={handleSaveCoordinates}
              placeholder="e.g., -122.4194"
              className="bg-[#252525] border-gray-700 text-white text-sm w-[80%]"
            />
          </div>
          <div>
            <Label htmlFor="latitude" className="text-xs text-gray-500">Latitude</Label>
            <Input
              id="latitude"
              type="number"
              step="any"
              value={localLatitude}
              onChange={(e) => setLocalLatitude(e.target.value)}
              onBlur={handleSaveCoordinates}
              placeholder="e.g., 37.7749"
              className="bg-[#252525] border-gray-700 text-white text-sm w-[80%]"
            />
          </div>
        </div>
        <p className="text-xs text-gray-600">Location for map display</p>
      </div>

      {/* Replace Scene Image */}
      <div className="space-y-2">
        <Label className="text-xs text-gray-400">Replace Scene Image</Label>
        <Button
          variant="outline"
          size="sm"
          className="w-full border-gray-700 hover:bg-gray-800"
          onClick={onReplaceImage}
        >
          Choose New Image
        </Button>
      </div>

      {/* Delete Scene */}
      <Button
        variant="destructive"
        size="sm"
        className="w-full"
        onClick={onDeleteScene}
        disabled={isDeletingScene}
      >
        <Trash2 size={16} className="mr-2" />
        {isDeletingScene ? 'Deleting...' : 'Delete Scene'}
      </Button>
    </>
  )
}
