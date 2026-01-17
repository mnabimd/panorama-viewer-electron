import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Scene } from '@/types/project.types'

interface MapMarkerDialogProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  scenes: Scene[]
  position: { x: number; y: number } | null
  currentSceneId?: string
  onSaved: () => void
}

export function MapMarkerDialog({
  isOpen,
  onClose,
  projectId,
  scenes,
  position,
  currentSceneId,
  onSaved
}: MapMarkerDialogProps) {
  const [selectedSceneId, setSelectedSceneId] = useState('')
  const [label, setLabel] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Reset form when dialog opens and set default scene
  useEffect(() => {
    if (isOpen) {
      setSelectedSceneId(currentSceneId || '')
      setLabel('')
    }
  }, [isOpen, currentSceneId])

  const handleSave = async () => {
    if (!selectedSceneId || !position) return

    setIsSaving(true)
    try {
      // @ts-ignore
      const result = await window.ipcRenderer.invoke('add-map-marker', {
        projectId,
        sceneId: selectedSceneId,
        position,
        label: label.trim() || undefined
      })

      if (result.success) {
        onSaved()
      }
    } catch (error) {
      console.error('Failed to add marker:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-width-[425px]">
        <DialogHeader>
          <DialogTitle>Add Map Marker</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Position Display */}
          <div className="space-y-2">
            <Label>Position</Label>
            <div className="text-sm text-gray-400">
              {position ? `${position.x.toFixed(1)}%, ${position.y.toFixed(1)}%` : 'Not set'}
            </div>
          </div>

          {/* Scene Selector */}
          <div className="space-y-2">
            <Label htmlFor="scene">Connected Scene *</Label>
            <Select value={selectedSceneId} onValueChange={setSelectedSceneId}>
              <SelectTrigger id="scene">
                <SelectValue placeholder="Select a scene" />
              </SelectTrigger>
              <SelectContent>
                {scenes.map(scene => (
                  <SelectItem key={scene.id} value={scene.id}>
                    {scene.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Label Input */}
          <div className="space-y-2">
            <Label htmlFor="label">Label (Optional)</Label>
            <Textarea
              id="label"
              placeholder="Enter a label for this marker..."
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-gray-400">
              If empty, "No description" will be shown
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!selectedSceneId || isSaving}
          >
            {isSaving ? 'Adding...' : 'Add Marker'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
