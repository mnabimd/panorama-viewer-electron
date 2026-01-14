import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { launchApp } from '../utils/fixtures'
import { DashboardPage } from '../pages/DashboardPage'
import { EditorPage } from '../pages/EditorPage'
import { TEST_DATA } from '../utils/test-data'

describe('Hotspot Interaction', () => {
  let app: any
  let dashboardPage: DashboardPage
  let editorPage: EditorPage

  const PROJECT_NAME = `Hotspot Test Project - ${Date.now()}`
  const SCENE_1_NAME = 'Living Room'
  const SCENE_2_NAME = 'Kitchen'

  beforeAll(async () => {
    app = await launchApp()
    dashboardPage = new DashboardPage(app.page)
    editorPage = new EditorPage(app.page)
  })

  afterAll(async () => {
    await app.electronApp.close()
  })

  test('should create project and add scenes', async () => {
    await dashboardPage.createProject(PROJECT_NAME, 'Testing hotspots')
    await dashboardPage.openProject(PROJECT_NAME)
    
    // Set project context so EditorPage knows which project to use for IPC calls
    editorPage.setProjectContext(PROJECT_NAME)
    
    // Add Scene 1
    await editorPage.addScene(TEST_DATA.IMAGE_1)
    await editorPage.renameScene('Scene 1', SCENE_1_NAME)
    
    // Add Scene 2
    await editorPage.addScene(TEST_DATA.IMAGE_2)
    await editorPage.renameScene('Scene 2', SCENE_2_NAME)
    
    // Go back to Scene 1
    await editorPage.selectScene(SCENE_1_NAME)
  }, 60000)

  test('should add info hotspot', async () => {
    await editorPage.addHotspot('info', 'Coffee Table', 'This is a nice table')
  }, 60000)

  test('should add scene link hotspot', async () => {
    // Workaround: Navigate to another scene and back to reset UI state
    await editorPage.selectScene(SCENE_2_NAME)
    await editorPage.wait(500)
    await editorPage.selectScene(SCENE_1_NAME)
    await editorPage.wait(500)
    
    await editorPage.addHotspot('scene', 'Go to Kitchen', SCENE_2_NAME)
  }, 60000)

  test('should manage extended hotspot lifecycle (Books)', async () => {
    // Navigate to reset state
    await editorPage.selectScene(SCENE_2_NAME)
    await editorPage.wait(500)
    await editorPage.selectScene(SCENE_1_NAME)
    await editorPage.wait(500)
    
    // Add "Books"
    await editorPage.addHotspot('info', 'Books', 'Reading material')
    
    // Rename to "Library"
    await editorPage.renameHotspot('Books', 'Library')
    
    // Hide it
    await editorPage.toggleHotspotVisibility('Library', false)
    await editorPage.verifyHotspotVisible('Library', false)
    
    // Navigate to Scene 2
    await editorPage.selectScene(SCENE_2_NAME)
    
    // Navigate back to Scene 1
    await editorPage.selectScene(SCENE_1_NAME)
    
    // Verify "Library" is still hidden
    await editorPage.verifyHotspotVisible('Library', false)
    
    // Show it again
    await editorPage.toggleHotspotVisibility('Library', true)
    await editorPage.verifyHotspotVisible('Library', true)
  }, 60000)

  test('should delete hotspots', async () => {
    await editorPage.deleteHotspot('Library')
    await editorPage.deleteHotspot('Coffee Table')
    await editorPage.deleteHotspot(SCENE_2_NAME) // Scene hotspots show target scene name
  }, 60000)

  test('should delete project', async () => {
    await app.page.reload()
    await editorPage.wait(2000)
    await editorPage.navigateToDashboard()
    await dashboardPage.deleteProject(PROJECT_NAME)
  })
})
