import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useCategories } from '@/hooks/useCategories'
import { FolderOpen } from 'lucide-react'

interface ProjectPropertiesDialogProps {
  open: boolean
  onClose: () => void
  projectId: string
}

interface ProjectData {
  id: string
  name: string
  description: string
  category?: string
  createdAt: string
  updatedAt: string
  path: string
  scenes: any[]
}

export function ProjectPropertiesDialog({ 
  open, 
  onClose, 
  projectId 
}: ProjectPropertiesDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [projectData, setProjectData] = useState<ProjectData | null>(null)
  const [editedName, setEditedName] = useState('')
  const [editedDescription, setEditedDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [projectSize, setProjectSize] = useState<string | null>(null)
  const [isCalculatingSize, setIsCalculatingSize] = useState(false)
  const { categories } = useCategories()

  useEffect(() => {
    if (open && projectId) {
      loadProjectData()
    }
  }, [open, projectId])

  const loadProjectData = async () => {
    try {
      setLoading(true)
      const data = await window.ipcRenderer.invoke('get-project-by-id', projectId)
      setProjectData(data)
      setEditedName(data.name)
      setEditedDescription(data.description || '')
      
      // Start calculating project size asynchronously
      calculateProjectSize(data.path)
    } catch (error) {
      console.error('Failed to load project data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load project data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateProjectSize = async (projectPath: string) => {
    try {
      setIsCalculatingSize(true)
      setProjectSize(null)
      // @ts-ignore
      const result = await window.ipcRenderer.invoke('calculate-directory-size', projectPath)
      if (result.success) {
        setProjectSize(formatBytes(result.size))
      } else {
        setProjectSize('Unable to calculate')
      }
    } catch (error) {
      console.error('Failed to calculate project size:', error)
      setProjectSize('Unable to calculate')
    } finally {
      setIsCalculatingSize(false)
    }
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const handleOpenFolder = async () => {
    if (!projectData) return
    try {
      // @ts-ignore
      const result = await window.ipcRenderer.invoke('open-folder-in-explorer', projectData.path)
      if (!result.success) {
        toast({
          title: 'Error',
          description: 'Failed to open folder',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Failed to open folder:', error)
      toast({
        title: 'Error',
        description: 'Failed to open folder',
        variant: 'destructive'
      })
    }
  }

  const handleSave = async () => {
    if (!projectData) return

    try {
      setIsSaving(true)
      
      // Rename project if name changed
      if (editedName !== projectData.name && editedName.trim()) {
        await window.ipcRenderer.invoke('rename-project', {
          projectId: projectData.id,
          newName: editedName.trim()
        })
      }

      // Update description (you might need to add this handler)
      if (editedDescription !== projectData.description) {
        await window.ipcRenderer.invoke('update-project-description', {
          projectId: projectData.id,
          description: editedDescription
        })
      }

      toast({
        title: 'Success',
        description: 'Project properties updated successfully'
      })
      
      onClose()
    } catch (error) {
      console.error('Failed to save project properties:', error)
      toast({
        title: 'Error',
        description: 'Failed to save project properties',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString()
    } catch {
      return dateString
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Project Properties</DialogTitle>
          <DialogDescription>
            View and edit project information
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading project data...
          </div>
        ) : projectData ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder="Enter project name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-description">Description</Label>
              <Textarea
                id="project-description"
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                placeholder="Enter project description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Category</Label>
                <div className="text-sm">
                  {categories.find(c => c.id === projectData.category)?.label || projectData.category || 'No category'}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Total Scenes</Label>
                <div className="text-sm">{projectData.scenes?.length || 0}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Created</Label>
                <div className="text-sm">{formatDate(projectData.createdAt)}</div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Last Modified</Label>
                <div className="text-sm">{formatDate(projectData.updatedAt)}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Project ID</Label>
                <div className="text-sm font-mono bg-muted p-2 rounded">
                  {projectData.id}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Project Size</Label>
                <div className="text-sm bg-muted p-2 rounded">
                  {isCalculatingSize ? 'Calculating...' : projectSize || 'Unknown'}
                </div>
              </div>
            </div>


            <div className="space-y-2">
              <Label className="text-muted-foreground">File Path</Label>
              <div className="flex gap-2">
                <div className="text-sm font-mono bg-muted p-2 rounded break-all flex-1">
                  {projectData.path}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenFolder}
                  className="shrink-0"
                >
                  <FolderOpen size={16} className="mr-1" />
                  Open Folder
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Failed to load project data
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || loading || !projectData}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
