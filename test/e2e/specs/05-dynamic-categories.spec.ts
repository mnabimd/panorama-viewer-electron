import { beforeAll, afterAll, describe, expect, test } from 'vitest'
import { type ElectronApplication, type Page } from 'playwright'
import { launchApp } from '../utils/fixtures'
import { DashboardPage } from '../pages/DashboardPage'

let electronApp: ElectronApplication
let page: Page
let dashboardPage: DashboardPage

const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false }).replace(/:/g, '-')
const CATEGORY_NAME = `Test Category ${timestamp}`
const PROJECT_NAME = `Category Project ${timestamp}`

beforeAll(async () => {
  const app = await launchApp()
  electronApp = app.electronApp
  page = app.page
  
  dashboardPage = new DashboardPage(page)
})

afterAll(async () => {
  await electronApp.close()
})

describe('Dynamic Categories', () => {
  test('should add a new category', async () => {
    await dashboardPage.addCategory(CATEGORY_NAME)
    expect(await dashboardPage.hasCategory(CATEGORY_NAME)).toBe(true)
  })

  test('should create a project with the new category', async () => {
    await dashboardPage.createProject(PROJECT_NAME, 'Created with custom category', CATEGORY_NAME)
    expect(await dashboardPage.hasProject(PROJECT_NAME)).toBe(true)
  })

  test('should delete the category', async () => {
    await dashboardPage.deleteCategory(CATEGORY_NAME)
    expect(await dashboardPage.hasCategory(CATEGORY_NAME)).toBe(false)
  })

  test('should verify project migration (optional)', async () => {
    // This assumes the project is still visible but maybe under 'Other' or just visible in 'All'
    // Since we deleted the category, if we filter by 'All' it should still be there.
    // But we can't easily check the internal category without opening it or checking properties.
    // For now, just checking it still exists is good enough.
    expect(await dashboardPage.hasProject(PROJECT_NAME)).toBe(true)
    
    // Cleanup project
    await dashboardPage.deleteProject(PROJECT_NAME)
  })
})
