import { beforeAll, afterAll, describe, expect, test } from 'vitest'
import { type ElectronApplication, type Page } from 'playwright'
import { launchApp } from '../utils/fixtures'
import { DashboardPage } from '../pages/DashboardPage'
import { EditorPage } from '../pages/EditorPage'
import { TEST_DATA } from '../utils/test-data'

let electronApp: ElectronApplication
let page: Page
let dashboardPage: DashboardPage
let editorPage: EditorPage

const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false }).replace(/:/g, '-')
const PROJECT_NAME = `Scene Project ${timestamp}`
const SCENE_NAME_DEFAULT = 'Scene 1'
const SCENE_NAME_RENAMED = 'Living Room'

beforeAll(async () => {
  const app = await launchApp()
  electronApp = app.electronApp
  page = app.page
  
  dashboardPage = new DashboardPage(page)
  editorPage = new EditorPage(page)
})

afterAll(async () => {
  await electronApp.close()
})

describe('Scene Management', () => {
  test('should create a project for scene testing', async () => {
    await dashboardPage.createProject(PROJECT_NAME, 'Testing scenes')
    await dashboardPage.openProject(PROJECT_NAME)
    expect(await editorPage.isLoaded()).toBe(true)
  })

  test('should add a scene via drag and drop', async () => {
    await editorPage.addScene(TEST_DATA.IMAGE_1)
    // Verify scene appears in sidebar
    await editorPage.selectScene(SCENE_NAME_DEFAULT)
  })

  test('should rename the scene', async () => {
    await editorPage.renameScene(SCENE_NAME_DEFAULT, SCENE_NAME_RENAMED)
  })

  test('should delete the scene', async () => {
    await editorPage.deleteScene(SCENE_NAME_RENAMED)
  })
})
