import { BasePage } from './BasePage'

export class DashboardPage extends BasePage {
  async isLoaded() {
    await this.waitFor('.dashboard')
    return true
  }

  async openNewProjectDialog() {
    // Try header button first, then main button (empty state)
    try {
      await this.click('.new-project-btn-header')
    } catch {
      await this.click('.new-project-btn-main')
    }
    await this.waitFor('.dialog-content')
  }

  async createProject(name: string, description: string, category = 'Real Estate') {
    await this.openNewProjectDialog()
    
    await this.fill('input#title', name)
    await this.fill('textarea#description', description)
    
    // Select category if different from default
    if (category !== 'Real Estate') {
      await this.click('.form-select')
      await this.click(`[role="option"]:has-text("${category}")`)
    }

    await this.click('button:has-text("Continue")')
    await this.waitFor('.dialog-content', 1000).catch(() => {}) // Wait for close
    await this.waitFor(`.project-card:has-text("${name}")`)
  }

  async openProject(name: string) {
    await this.click(`.project-card:has-text("${name}")`)
    await this.waitFor('.project-editor')
  }

  async deleteProject(name: string) {
    // Right click on project card
    const card = await this.waitFor(`.project-card:has-text("${name}")`)
    if (card) {
      await card.click({ button: 'right' })
      await this.page.waitForTimeout(500) // Wait for context menu animation
    }
    
    // Click delete in context menu
    await this.click('[role="menuitem"]:has-text("Delete")')
    
    // Confirm deletion
    // Use a more specific selector to avoid clicking the context menu item again if it persists
    await this.click('button.bg-red-600:has-text("Delete")')
    
    // Wait for card to disappear
    await this.page.waitForSelector(`.project-card:has-text("${name}")`, { state: 'hidden' })
  }

  async hasProject(name: string) {
    const cards = await this.page.$$(`.project-card:has-text("${name}")`)
    return cards.length > 0
  }

  async addCategory(name: string) {
    await this.click('.add-btn')
    await this.waitFor('text=Add Category')
    await this.fill('input#name', name)
    await this.click('button:has-text("Add Category")')
    await this.waitFor(`button.filter-btn:has-text("${name}")`)
  }

  async deleteCategory(name: string) {
    const categoryBtn = await this.waitFor(`button.filter-btn:has-text("${name}")`)
    if (categoryBtn) {
      await categoryBtn.click({ button: 'right' })
    }
    await this.click('text=Delete Category')
    await this.click('button:has-text("Delete")')
    await this.page.waitForSelector(`button.filter-btn:has-text("${name}")`, { state: 'hidden' })
  }

  async hasCategory(name: string) {
    const btns = await this.page.$$(`button.filter-btn:has-text("${name}")`)
    return btns.length > 0
  }
}
