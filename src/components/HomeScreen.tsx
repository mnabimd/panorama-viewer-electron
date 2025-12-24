import { useState } from "react"
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
import "./HomeScreen.css"

export function HomeScreen() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [titleError, setTitleError] = useState(false)

  const handleNewProject = () => {
    setIsDialogOpen(true)
    // Reset form
    setTitle("")
    setDescription("")
    setCategory("")
    setTitleError(false)
  }

  const handleContinue = () => {
    if (!title.trim()) {
      setTitleError(true)
      return
    }
    
    // TODO: Handle project creation
    console.log({ title, description, category })
    setIsDialogOpen(false)
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
    if (titleError && e.target.value.trim()) {
      setTitleError(false)
    }
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
                  <SelectItem value="real-estate">Real Estate</SelectItem>
                  <SelectItem value="tourism">Tourism</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="events">Events</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
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
