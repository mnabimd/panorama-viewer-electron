import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Link2, Info, MapPin } from "lucide-react"

// Hotspot types from backend
type HotspotType = 'scene' | 'info' | 'url'

interface BaseHotspot {
  id?: string
  type: HotspotType
  position: {
    yaw: number
    pitch: number
  }
  tooltip?: string
}

interface SceneHotspot extends BaseHotspot {
  type: 'scene'
  targetSceneId: string
  transition?: 'fade' | 'slide' | 'none'
}

interface InfoHotspot extends BaseHotspot {
  type: 'info'
  title: string
  content: string
  imageUrl?: string
}

interface UrlHotspot extends BaseHotspot {
  type: 'url'
  url: string
  openInNewTab?: boolean
}

type Hotspot = SceneHotspot | InfoHotspot | UrlHotspot

interface Scene {
  id: string
  name: string
  image?: string
}

interface HotspotDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'add' | 'edit'
  existingHotspot?: Hotspot
  availableScenes: Scene[]
  onSubmit: (hotspotData: Omit<Hotspot, 'id'>) => Promise<void>
}

export function HotspotDialog({
  open,
  onOpenChange,
  mode,
  existingHotspot,
  availableScenes,
  onSubmit
}: HotspotDialogProps) {
  const [hotspotType, setHotspotType] = useState<HotspotType>('scene')
  const [tooltip, setTooltip] = useState('')
  
  // Scene hotspot fields
  const [targetSceneId, setTargetSceneId] = useState('')
  const [transition, setTransition] = useState<'fade' | 'slide' | 'none'>('fade')
  
  // Info hotspot fields
  const [infoTitle, setInfoTitle] = useState('')
  const [infoContent, setInfoContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  
  // URL hotspot fields
  const [url, setUrl] = useState('')
  const [openInNewTab, setOpenInNewTab] = useState(true)
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form with existing hotspot data in edit mode
  useEffect(() => {
    if (mode === 'edit' && existingHotspot) {
      setHotspotType(existingHotspot.type)
      setTooltip(existingHotspot.tooltip || '')
      
      if (existingHotspot.type === 'scene') {
        setTargetSceneId(existingHotspot.targetSceneId)
        setTransition(existingHotspot.transition || 'fade')
      } else if (existingHotspot.type === 'info') {
        setInfoTitle(existingHotspot.title)
        setInfoContent(existingHotspot.content)
        setImageUrl(existingHotspot.imageUrl || '')
      } else if (existingHotspot.type === 'url') {
        setUrl(existingHotspot.url)
        setOpenInNewTab(existingHotspot.openInNewTab ?? true)
      }
    } else {
      // Reset form for add mode
      resetForm()
    }
  }, [mode, existingHotspot, open])

  const resetForm = () => {
    setHotspotType('scene')
    setTooltip('')
    setTargetSceneId('')
    setTransition('fade')
    setInfoTitle('')
    setInfoContent('')
    setImageUrl('')
    setUrl('')
    setOpenInNewTab(true)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      // Dummy position values as per user request
      const position = { yaw: 0, pitch: 0 }
      
      let hotspotData: Omit<Hotspot, 'id'>
      
      if (hotspotType === 'scene') {
        if (!targetSceneId) {
          alert('Please select a target scene')
          setIsSubmitting(false)
          return
        }
        const sceneData: Omit<SceneHotspot, 'id'> = {
          type: 'scene',
          position,
          tooltip: tooltip || undefined,
          targetSceneId,
          transition
        }
        hotspotData = sceneData
      } else if (hotspotType === 'info') {
        if (!infoTitle || !infoContent) {
          alert('Please fill in title and content')
          setIsSubmitting(false)
          return
        }
        const infoData: Omit<InfoHotspot, 'id'> = {
          type: 'info',
          position,
          tooltip: tooltip || undefined,
          title: infoTitle,
          content: infoContent,
          imageUrl: imageUrl || undefined
        }
        hotspotData = infoData
      } else {
        if (!url) {
          alert('Please enter a URL')
          setIsSubmitting(false)
          return
        }
        const urlData: Omit<UrlHotspot, 'id'> = {
          type: 'url',
          position,
          tooltip: tooltip || undefined,
          url,
          openInNewTab
        }
        hotspotData = urlData
      }
      
      await onSubmit(hotspotData)
      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error('Failed to submit hotspot:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-[#1a1a1a] text-white border-gray-700">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add New Hotspot' : 'Edit Hotspot'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Hotspot Type Selection */}
          <div className="space-y-2">
            <Label>Hotspot Type</Label>
            <Select 
              value={hotspotType} 
              onValueChange={(value) => setHotspotType(value as HotspotType)}
              disabled={mode === 'edit'}
            >
              <SelectTrigger className="bg-[#252525] border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#252525] border-gray-700">
                <SelectItem value="scene">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} />
                    <span>Scene Link</span>
                  </div>
                </SelectItem>
                <SelectItem value="info">
                  <div className="flex items-center gap-2">
                    <Info size={16} />
                    <span>Information</span>
                  </div>
                </SelectItem>
                <SelectItem value="url">
                  <div className="flex items-center gap-2">
                    <Link2 size={16} />
                    <span>External URL</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Common Field: Tooltip */}
          <div className="space-y-2">
            <Label htmlFor="tooltip">Tooltip (Optional)</Label>
            <Input
              id="tooltip"
              value={tooltip}
              onChange={(e) => setTooltip(e.target.value)}
              placeholder="Hover text for this hotspot"
              className="bg-[#252525] border-gray-700"
            />
          </div>

          {/* Scene Hotspot Fields */}
          {hotspotType === 'scene' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="targetScene">Target Scene *</Label>
                <Select value={targetSceneId} onValueChange={setTargetSceneId}>
                  <SelectTrigger className="bg-[#252525] border-gray-700">
                    <SelectValue placeholder="Select a scene" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#252525] border-gray-700">
                    {availableScenes.map((scene) => (
                      <SelectItem key={scene.id} value={scene.id}>
                        {scene.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transition">Transition Effect</Label>
                <Select value={transition} onValueChange={(value) => setTransition(value as 'fade' | 'slide' | 'none')}>
                  <SelectTrigger className="bg-[#252525] border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#252525] border-gray-700">
                    <SelectItem value="fade">Fade</SelectItem>
                    <SelectItem value="slide">Slide</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Info Hotspot Fields */}
          {hotspotType === 'info' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="infoTitle">Title *</Label>
                <Input
                  id="infoTitle"
                  value={infoTitle}
                  onChange={(e) => setInfoTitle(e.target.value)}
                  placeholder="Information title"
                  className="bg-[#252525] border-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="infoContent">Content *</Label>
                <Textarea
                  id="infoContent"
                  value={infoContent}
                  onChange={(e) => setInfoContent(e.target.value)}
                  placeholder="Information content"
                  className="bg-[#252525] border-gray-700 min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                <Input
                  id="imageUrl"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="bg-[#252525] border-gray-700"
                />
              </div>
            </>
          )}

          {/* URL Hotspot Fields */}
          {hotspotType === 'url' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="url">URL *</Label>
                <Input
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="bg-[#252525] border-gray-700"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="openInNewTab"
                  checked={openInNewTab}
                  onChange={(e) => setOpenInNewTab(e.target.checked)}
                  className="w-4 h-4"
                />
                <Label htmlFor="openInNewTab" className="cursor-pointer">
                  Open in new tab
                </Label>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isSubmitting ? 'Saving...' : mode === 'add' ? 'Add Hotspot' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
