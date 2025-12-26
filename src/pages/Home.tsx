import { useState, useEffect } from "react"
import { Dashboard } from "./Dashboard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Plus, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { PROJECT_CATEGORIES } from "@/constants"
import "./Home.css"

export function Home() {
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("real-estate")
  const [titleError, setTitleError] = useState(false)

  const fetchProjects = async () => {
    try {
      // @ts-ignore
      const result = await window.ipcRenderer.invoke('get-projects')
      setProjects(result)
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const handleNewProject = () => {
    setIsDialogOpen(true)
    // Reset form
    setTitle("")
    setDescription("")
    setCategory("real-estate")
    setTitleError(false)
  }

  const handleContinue = async () => {
    if (!title.trim()) {
      setTitleError(true)
      return
    }
    
    try {
      // @ts-ignore
      const result = await window.ipcRenderer.invoke('create-project', {
        name: title,
        description,
        category
      })

      if (result.success) {
        console.log('Project created:', result)
        setIsDialogOpen(false)
        toast({
          title: "Project created successfully",
          description: `Project "${title}" has been created.`,
        })
        // Reset form
        setTitle("")
        setDescription("")
        setCategory("real-estate")
        // Refresh list
        fetchProjects()
      }
    } catch (error) {
      console.error('Failed to create project:', error)
      // TODO: Show error toast
    }
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
    if (titleError && e.target.value.trim()) {
      setTitleError(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-[#1a1a1a] text-white">Loading...</div>
  }

  if (projects.length > 0) {
    return (
      <>
        <Dashboard 
          projects={projects} 
          onNewProject={handleNewProject} 
          onRefresh={fetchProjects}
        />
        {/* New Project Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="dialog-content">
            <DialogHeader>
              <DialogTitle className="dialog-title">Create new Project</DialogTitle>
            </DialogHeader>
            
            <div className="dialog-form">
              {/* Title Field */}
              <div className="form-field">
                <Label htmlFor="title" className="form-label">
                  Title
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={handleTitleChange}
                  className={`form-input ${titleError ? 'input-error' : ''}`}
                  placeholder=""
                />
                {titleError && (
                  <p className="error-message">Title is not empty</p>
                )}
              </div>

              {/* Description Field */}
              <div className="form-field">
                <Label htmlFor="description" className="form-label">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-textarea"
                  rows={4}
                  placeholder=""
                />
              </div>

              {/* Category Field */}
              <div className="form-field">
                <Label htmlFor="category" className="form-label">
                  Category
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="form-select">
                    <SelectValue placeholder="" />
                  </SelectTrigger>
                  <SelectContent className="select-content">
                    {PROJECT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Continue Button */}
              <Button 
                onClick={handleContinue}
                className="continue-btn"
              >
                Continue
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <div className="home-screen">
      {/* Header */}
      <header className="home-header">
        <h1 className="app-title">360 Panorama Viewer</h1>
        
        <div className="header-actions">
          {/* Search Bar */}
          <div className="search-container">
            <Search className="search-icon" size={18} />
            <Input 
              type="text" 
              placeholder="Search" 
              className="search-input"
            />
          </div>

          {/* New Project Button */}
          <Button 
            onClick={handleNewProject}
            className="new-project-btn-header"
          >
            New Project <Plus size={18} className="ml-1" />
          </Button>

          {/* User Avatar */}
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-orange-500 text-white">
              <User size={18} />
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Main Content - Empty State */}
      <main className="home-main">
        <div className="empty-state">
          <p className="empty-message">You don't have any project yet</p>
          <Button 
            onClick={handleNewProject}
            className="new-project-btn-main"
            size="lg"
          >
            <Plus size={20} className="mr-2" />
            New Project
          </Button>
        </div>
      </main>

      {/* New Project Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="dialog-content">
          <DialogHeader>
            <DialogTitle className="dialog-title">Create new Project</DialogTitle>
          </DialogHeader>
          
          <div className="dialog-form">
            {/* Title Field */}
            <div className="form-field">
              <Label htmlFor="title" className="form-label">
                Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={handleTitleChange}
                className={`form-input ${titleError ? 'input-error' : ''}`}
                placeholder=""
              />
              {titleError && (
                <p className="error-message">Title is not empty</p>
              )}
            </div>

            {/* Description Field */}
            <div className="form-field">
              <Label htmlFor="description" className="form-label">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-textarea"
                rows={4}
                placeholder=""
              />
            </div>

            {/* Category Field */}
            <div className="form-field">
              <Label htmlFor="category" className="form-label">
                Category
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="form-select">
                  <SelectValue placeholder="" />
                </SelectTrigger>
                <SelectContent className="select-content">
                  {PROJECT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Continue Button */}
            <Button 
              onClick={handleContinue}
              className="continue-btn"
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
