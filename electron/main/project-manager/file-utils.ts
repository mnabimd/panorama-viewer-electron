import path from 'node:path'
import fs from 'node:fs/promises'
import { getWorkspacePath } from '../settings-manager'
import type { ProjectMetadata } from './types'

/**
 * Get the projects directory from current workspace settings
 */
export async function getProjectsDir(): Promise<string> {
  const workspacePath = await getWorkspacePath()
  return path.join(workspacePath, 'projects')
}

/**
 * Read and parse project metadata from project.json
 */
export async function readProjectMetadata(projectId: string): Promise<ProjectMetadata> {
  const projectsDir = await getProjectsDir()
  const projectPath = path.join(projectsDir, projectId)
  const projectJsonPath = path.join(projectPath, 'project.json')
  
  const content = await fs.readFile(projectJsonPath, 'utf-8')
  return JSON.parse(content)
}

/**
 * Write project metadata to project.json
 */
export async function writeProjectMetadata(projectId: string, metadata: ProjectMetadata): Promise<void> {
  const projectsDir = await getProjectsDir()
  const projectPath = path.join(projectsDir, projectId)
  const projectJsonPath = path.join(projectPath, 'project.json')
  
  await fs.writeFile(
    projectJsonPath,
    JSON.stringify(metadata, null, 2),
    'utf-8'
  )
}

/**
 * Get the full project path
 */
export async function getProjectPath(projectId: string): Promise<string> {
  const projectsDir = await getProjectsDir()
  return path.join(projectsDir, projectId)
}

/**
 * Ensure a directory exists, creating it if necessary
 */
export async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath)
  } catch {
    await fs.mkdir(dirPath, { recursive: true })
  }
}
