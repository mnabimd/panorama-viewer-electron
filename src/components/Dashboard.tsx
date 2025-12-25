import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, Plus, User, Image as ImageIcon, Eye, Share2, Folder } from "lucide-react"
import "./Dashboard.css"

interface Project {
  id: string
  name: string
  description: string
  scenes: Record<string, any>
  updatedAt: string
  cover?: string
}

interface DashboardProps {
  projects: Project[]
  onNewProject: () => void
}

export function Dashboard({ projects, onNewProject }: DashboardProps) {
  const [filter, setFilter] = useState("all")

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <h1 className="app-title">360 Panorama Viewer</h1>
        
        <div className="header-actions">
          <div className="search-container">
            <Search className="search-icon" size={18} />
            <Input 
              type="text" 
              placeholder="Search" 
              className="search-input"
            />
          </div>

          <Button 
            onClick={onNewProject}
            className="new-project-btn-header"
          >
            New Project <Plus size={18} className="ml-1" />
          </Button>

          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-orange-500 text-white">
              <User size={18} />
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="projects-section">
          <div className="filter-bar">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button className="add-btn" onClick={onNewProject}>
              <Plus size={16} />
            </button>
          </div>

          <div className="projects-grid">
            {projects.map((project) => (
              <div key={project.id} className="project-card">
                <div className="card-thumbnail">
                  {project.cover ? (
                    <img src={`file://${project.cover}`} alt={project.name} />
                  ) : (
                    <div className="thumbnail-placeholder">
                      <ImageIcon size={32} />
                      <span>No Preview</span>
                    </div>
                  )}
                </div>
                <div className="card-content">
                  <div className="card-tags">
                    <span className="tag">
                      <ImageIcon size={12} />
                      {Object.keys(project.scenes || {}).length}
                    </span>
                    <span className="tag">Draft</span>
                  </div>
                  <h3 className="project-title">{project.name}</h3>
                  <p className="project-desc">{project.description || "No description"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Statistics Section */}
        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-icon">
              <Folder size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{projects.length}</span>
              <span className="stat-label">Total Projects</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <ImageIcon size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value">156</span>
              <span className="stat-label">360° Images</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <Eye size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value">2.1k</span>
              <span className="stat-label">Total Views</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <Share2 size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value">12</span>
              <span className="stat-label">Publish Projects</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
