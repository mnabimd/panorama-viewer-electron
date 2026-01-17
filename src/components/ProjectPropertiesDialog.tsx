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
  const [selectedMapFile, setSelectedMapFile] = useState<string | null>(null)
  const [isUploadingMap, setIsUploadingMap] = useState(false)
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

            {/* Map Section */}
            <div className="space-y-2 pt-4 border-t">
              <Label>Project Map</Label>
              <p className="text-sm text-muted-foreground">
                Upload a floor plan or site map to enable navigation
              </p>
              
              {selectedMapFile && (
                <div className="text-sm bg-muted p-2 rounded">
                  <span className="text-muted-foreground">Selected: </span>
                  <span className="font-mono">{selectedMapFile.split('/').pop()}</span>
                </div>
              )}
              
              <Button
                variant="outline"
                size="sm"
                disabled={!projectData || isUploadingMap}
                onClick={async () => {
                  // @ts-ignore
                  await window.ipcRenderer.invoke('log-message', {
                    level: 'INFO',
                    context: 'ProjectPropertiesDialog',
                    file: 'src/components/ProjectPropertiesDialog.tsx',
                    message: 'Upload button clicked'
                  })
                  
                  if (!projectData) {
                    // @ts-ignore
                    await window.ipcRenderer.invoke('log-message', {
                      level: 'WARN',
                      context: 'ProjectPropertiesDialog',
                      file: 'src/components/ProjectPropertiesDialog.tsx',
                      message: 'No project data, returning'
                    })
                    return
                  }
                  
                  try {
                    // @ts-ignore
                    await window.ipcRenderer.invoke('log-message', {
                      level: 'INFO',
                      context: 'ProjectPropertiesDialog',
                      file: 'src/components/ProjectPropertiesDialog.tsx',
                      message: 'Calling select-image-file'
                    })
                    
                    // @ts-ignore
                    const result = await window.ipcRenderer.invoke('select-image-file')
                    
                    // @ts-ignore
                    await window.ipcRenderer.invoke('log-message', {
                      level: 'INFO',
                      context: 'ProjectPropertiesDialog',
                      file: 'src/components/ProjectPropertiesDialog.tsx',
                      message: `File selection result: ${JSON.stringify(result)}`
                    })

                    if (result && !result.canceled && result.filePaths && result.filePaths.length > 0) {
                      // @ts-ignore
                      await window.ipcRenderer.invoke('log-message', {
                        level: 'INFO',
                        context: 'ProjectPropertiesDialog',
                        file: 'src/components/ProjectPropertiesDialog.tsx',
                        message: `File selected: ${result.filePaths[0]}`
                      })
                      
                      setSelectedMapFile(result.filePaths[0])
                      setIsUploadingMap(true)
                      
                      // Upload immediately
                      // @ts-ignore
                      await window.ipcRenderer.invoke('log-message', {
                        level: 'INFO',
                        context: 'ProjectPropertiesDialog',
                        file: 'src/components/ProjectPropertiesDialog.tsx',
                        message: `Starting upload for project: ${projectData.id}`
                      })
                      
                      // @ts-ignore
                      const uploadResult = await window.ipcRenderer.invoke('upload-map-image', {
                        projectId: projectData.id,
                        imagePath: result.filePaths[0]
                      })
                      
                      // @ts-ignore
                      await window.ipcRenderer.invoke('log-message', {
                        level: 'INFO',
                        context: 'ProjectPropertiesDialog',
                        file: 'src/components/ProjectPropertiesDialog.tsx',
                        message: `Upload result: ${JSON.stringify(uploadResult)}`
                      })

                      setIsUploadingMap(false)

                      if (uploadResult.success) {
                        toast({
                          title: 'Success',
                          description: 'Map uploaded successfully. Reload the project to see it.'
                        })
                      } else {
                        toast({
                          title: 'Error',
                          description: uploadResult.error || 'Failed to upload map',
                          variant: 'destructive'
                        })
                        setSelectedMapFile(null)
                      }
                    } else {
                      // @ts-ignore
                      await window.ipcRenderer.invoke('log-message', {
                        level: 'INFO',
                        context: 'ProjectPropertiesDialog',
                        file: 'src/components/ProjectPropertiesDialog.tsx',
                        message: 'File selection canceled or no file'
                      })
                    }
                  } catch (err) {
                    // @ts-ignore
                    await window.ipcRenderer.invoke('log-message', {
                      level: 'ERROR',
                      context: 'ProjectPropertiesDialog',
                      file: 'src/components/ProjectPropertiesDialog.tsx',
                      message: `Error during upload: ${err instanceof Error ? err.message : String(err)}`
                    })
                    
                    setIsUploadingMap(false)
                    setSelectedMapFile(null)
                    toast({
                      title: 'Error',
                      description: err instanceof Error ? err.message : 'Failed to upload map',
                      variant: 'destructive'
                    })
                  }
                }}
              >
                {isUploadingMap ? 'Uploading...' : selectedMapFile ? 'Change Map Image' : 'Upload Map Image'}
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">Project ID</Label>
              <div className="text-sm font-mono bg-muted p-2 rounded">
                {projectData.id}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">File Path</Label>
              <div className="text-sm font-mono bg-muted p-2 rounded break-all">
                {projectData.path}
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
