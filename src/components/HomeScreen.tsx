import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, Plus, User } from "lucide-react"
import { useNavigate } from "react-router-dom"
import "./HomeScreen.css"

export function HomeScreen() {
  const navigate = useNavigate()

  const handleNewProject = () => {
    // Navigate to new project screen (to be implemented)
    navigate('/new-project')
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

          {/* User Avatar with Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="avatar-btn">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-orange-500 text-white">
                    <User size={18} />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Help</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
    </div>
  )
}
