import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft, Search, Plus, Pencil } from "lucide-react"
import { Scene } from "@/types/project.types"
import { SceneListItem } from "./SceneListItem"

interface EditorLeftSidebarProps {
  projectName: string
  isEditingName: boolean
  searchQuery: string
  scenes: Scene[]
  filteredScenes: Scene[]
  activeScene: string
  onNavigateBack: () => void
  onProjectNameChange: (name: string) => void
  onStartEditName: () => void
  onRenameProject: () => void
  onSearchChange: (query: string) => void
  onNewImage: () => void
  onSceneSelect: (sceneId: string) => void
  onToggleSceneVisibility: (e: React.MouseEvent, sceneId: string) => void
  onDeleteAllScenes: () => void
}

export function EditorLeftSidebar({
  projectName,
  isEditingName,
  searchQuery,
  scenes,
  filteredScenes,
  activeScene,
  onNavigateBack,
  onProjectNameChange,
  onStartEditName,
  onRenameProject,
  onSearchChange,
  onNewImage,
  onSceneSelect,
  onToggleSceneVisibility,
  onDeleteAllScenes
}: EditorLeftSidebarProps) {
  return (
    <aside className="editor-sidebar-left">
      <div className="sidebar-header-content">
        <Button 
          variant="ghost" 
          size="icon" 
          className="back-btn"
          onClick={onNavigateBack}
        >
          <ChevronLeft />
        </Button>
        
        <div className="project-name-container">
          {isEditingName ? (
            <Input
              value={projectName}
              onChange={(e) => onProjectNameChange(e.target.value)}
              onBlur={onRenameProject}
              onKeyDown={(e) => e.key === 'Enter' && onRenameProject()}
              autoFocus
              className="edit-name-input"
            />
          ) : (
            <span 
              className="project-name" 
              onClick={onStartEditName}
              title={projectName}
            >
              {projectName}
            </span>
          )}
          {!isEditingName && (
            <Pencil 
              size={14} 
              className="cursor-pointer text-gray-500 hover:text-white shrink-0 ml-auto"
              onClick={onStartEditName} 
            />
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-4 bg-[#333] p-2 rounded-md">
          <Search size={16} className="text-gray-400" />
          <input 
            type="text" 
            placeholder="Search" 
            className="bg-transparent border-none outline-none text-sm w-full text-white"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <Button className="new-image-btn" onClick={onNewImage}>
          <Plus size={16} className="mr-2" /> New Image
        </Button>

        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs text-gray-400">{scenes.length} scene{scenes.length !== 1 ? 's' : ''}</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="delete-all-btn text-red-500 hover:text-red-400 h-auto p-0"
            onClick={() => scenes.length > 1 && onDeleteAllScenes()}
            disabled={scenes.length <= 1}
          >
            Delete All
          </Button>
        </div>

        <div className="scene-list">
          {filteredScenes.map((scene) => (
            <SceneListItem
              key={scene.id}
              scene={scene}
              isActive={activeScene === scene.id}
              onSelect={onSceneSelect}
              onToggleVisibility={onToggleSceneVisibility}
            />
          ))}
        </div>
      </div>
    </aside>
  )
}
