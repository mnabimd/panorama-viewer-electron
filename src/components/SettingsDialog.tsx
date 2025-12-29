import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { Loader2, FolderOpen, Check, AlertCircle, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { AppSettings, WorkspaceInfo } from "@/types/settings"
import "./SettingsDialog.css"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onWorkspaceChanged?: () => void
}

export function SettingsDialog({ open, onOpenChange, onWorkspaceChanged }: SettingsDialogProps) {
  const { toast } = useToast()
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(false)
  
  // Update section states
  const [checkingUpdate, setCheckingUpdate] = useState(false)
  const [updateStatus, setUpdateStatus] = useState<{
    available: boolean
    currentVersion: string
    newVersion?: string
    message?: string
  } | null>(null)
  
  // Workspace section states
  const [selectedWorkspace, setSelectedWorkspace] = useState("")
  const [workspaceInfo, setWorkspaceInfo] = useState<WorkspaceInfo | null>(null)
  const [checkingWorkspace, setCheckingWorkspace] = useState(false)
  const [connectingWorkspace, setConnectingWorkspace] = useState(false)

  // Load settings when dialog opens
  useEffect(() => {
    if (open) {
      loadSettings()
    }
  }, [open])

  const loadSettings = async () => {
    try {
      setLoading(true)
      // @ts-ignore
      const appSettings = await window.ipcRenderer.invoke('get-app-settings')
      setSettings(appSettings)
      setSelectedWorkspace(appSettings.workspacePath)
      
      // Load current workspace info
      // @ts-ignore
      const info = await window.ipcRenderer.invoke('get-workspace-info')
      setWorkspaceInfo(info)
    } catch (error) {
      console.error('Failed to load settings:', error)
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCheckForUpdates = async () => {
    try {
      setCheckingUpdate(true)
      // @ts-ignore
      const result = await window.ipcRenderer.invoke('check-update')
      
      if (result.error) {
        setUpdateStatus({
          available: false,
          currentVersion: result.version || "0.0.1",
          message: result.message || "Update check failed"
        })
      } else {
        setUpdateStatus({
          available: result.update || false,
          currentVersion: result.version || "0.0.1",
          newVersion: result.newVersion,
          message: result.update ? "Update available!" : "You're up to date"
        })
      }
    } catch (error) {
      console.error('Failed to check for updates:', error)
      toast({
        title: "Error",
        description: "Failed to check for updates",
        variant: "destructive",
      })
    } finally {
      setCheckingUpdate(false)
    }
  }

  const handleBrowseWorkspace = async () => {
    try {
      // @ts-ignore
      const result = await window.ipcRenderer.invoke('select-directory')
      
      if (!result.canceled && result.path) {
        setSelectedWorkspace(result.path)
        setWorkspaceInfo(null) // Reset info when path changes
      }
    } catch (error) {
      console.error('Failed to select directory:', error)
      toast({
        title: "Error",
        description: "Failed to open directory picker",
        variant: "destructive",
      })
    }
  }

  const handleCheckWorkspace = async () => {
    if (!selectedWorkspace) return

    try {
      setCheckingWorkspace(true)
      // @ts-ignore
      const info = await window.ipcRenderer.invoke('check-workspace-projects', selectedWorkspace)
      setWorkspaceInfo(info)
      
      if (!info.isValid) {
        toast({
          title: "Invalid Workspace",
          description: info.error || "Cannot use this directory as workspace",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Failed to check workspace:', error)
      toast({
        title: "Error",
        description: "Failed to check workspace",
        variant: "destructive",
      })
    } finally {
      setCheckingWorkspace(false)
    }
  }

  const handleConnectWorkspace = async () => {
    if (!selectedWorkspace || !workspaceInfo) return

    // If no projects found, ask for confirmation
    if (!workspaceInfo.hasProjects) {
      const confirmed = confirm(
        "No projects found in this workspace. Do you want to use this location for new projects?"
      )
      if (!confirmed) return
    }

    try {
      setConnectingWorkspace(true)
      // @ts-ignore
      const result = await window.ipcRenderer.invoke('update-workspace', selectedWorkspace)
      
      if (result.success) {
        toast({
          title: "Workspace Changed",
          description: `Now using: ${selectedWorkspace}`,
        })
        setSettings(result.settings)
        
        // Notify parent to refresh projects
        if (onWorkspaceChanged) {
          onWorkspaceChanged()
        }
        
        // Close dialog
        onOpenChange(false)
      } else {
        toast({
          title: "Failed to Change Workspace",
          description: result.error || "Unknown error",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Failed to update workspace:', error)
      toast({
        title: "Error",
        description: "Failed to update workspace",
        variant: "destructive",
      })
    } finally {
      setConnectingWorkspace(false)
    }
  }

  const handlePhotoCompressionToggle = async (enabled: boolean) => {
    // This is disabled for now, but we'll keep the handler for future implementation
    toast({
      title: "Coming Soon",
      description: "Photo compression feature will be available in a future update",
    })
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>App Settings</DialogTitle>
          <DialogDescription>
            Manage your application preferences and workspace
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Check for Updates Section */}
          <div className="settings-section">
            <h3 className="text-lg font-semibold mb-3">Updates</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Current Version</p>
                  <p className="text-sm text-muted-foreground">
                    {updateStatus?.currentVersion || settings?.lastUpdatedAt ? "0.0.1" : "Loading..."}
                  </p>
                </div>
                <Button
                  onClick={handleCheckForUpdates}
                  disabled={checkingUpdate}
                  variant="outline"
                >
                  {checkingUpdate && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Check for Updates
                </Button>
              </div>

              {updateStatus && (
                <div className={`update-status ${updateStatus.available ? 'available' : 'up-to-date'}`}>
                  {updateStatus.available ? (
                    <>
                      <AlertCircle className="h-4 w-4" />
                      <div>
                        <p className="font-medium">Update Available: v{updateStatus.newVersion}</p>
                        <p className="text-sm">{updateStatus.message}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <p>{updateStatus.message}</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Workspace Section */}
          <div className="settings-section">
            <h3 className="text-lg font-semibold mb-3">Workspace</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="current-workspace">Current Workspace</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="current-workspace"
                    value={selectedWorkspace}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    onClick={handleBrowseWorkspace}
                    variant="outline"
                    size="icon"
                  >
                    <FolderOpen className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {selectedWorkspace !== settings?.workspacePath && (
                <div className="flex gap-2">
                  <Button
                    onClick={handleCheckWorkspace}
                    disabled={checkingWorkspace || !selectedWorkspace}
                    variant="outline"
                    className="flex-1"
                  >
                    {checkingWorkspace && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Check Workspace
                  </Button>
                  <Button
                    onClick={handleConnectWorkspace}
                    disabled={!workspaceInfo || !workspaceInfo.isValid || connectingWorkspace}
                    className="flex-1"
                  >
                    {connectingWorkspace && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Connect
                  </Button>
                </div>
              )}

              {workspaceInfo && (
                <div className={`workspace-info ${workspaceInfo.isValid ? 'valid' : 'invalid'}`}>
                  {workspaceInfo.isValid ? (
                    <>
                      <Info className="h-4 w-4" />
                      <div>
                        <p className="font-medium">
                          {workspaceInfo.hasProjects
                            ? `Found ${workspaceInfo.projectCount} project${workspaceInfo.projectCount !== 1 ? 's' : ''}`
                            : 'No projects found'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {workspaceInfo.hasProjects
                            ? 'This workspace contains existing projects'
                            : 'This will be used for new projects'}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4" />
                      <p>{workspaceInfo.error || 'Invalid workspace'}</p>
                    </>
                  )}
                </div>
              )}

              {settings?.recentWorkspaces && settings.recentWorkspaces.length > 0 && (
                <div>
                  <Label className="text-sm text-muted-foreground">Recent Workspaces</Label>
                  <div className="mt-2 space-y-1">
                    {settings.recentWorkspaces.slice(0, 3).map((workspace, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedWorkspace(workspace)
                          setWorkspaceInfo(null)
                        }}
                        className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors font-mono"
                      >
                        {workspace}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Photo Compression Section */}
          <div className="settings-section">
            <h3 className="text-lg font-semibold mb-3">Photo Compression</h3>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="photo-compression">Enable Photo Compression</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically compress photos when adding to projects (Coming soon)
                </p>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Switch
                        id="photo-compression"
                        checked={settings?.photoCompressionEnabled || false}
                        onCheckedChange={handlePhotoCompressionToggle}
                        disabled={true}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Coming soon</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
