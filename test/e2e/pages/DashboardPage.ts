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
    await card.click({ button: 'right' })
    
    // Click delete in context menu
    await this.click('text=Delete')
    
    // Confirm deletion
    await this.click('button:has-text("Delete")')
    
    // Wait for card to disappear
    await this.page.waitForSelector(`.project-card:has-text("${name}")`, { state: 'hidden' })
  }

  async hasProject(name: string) {
    const cards = await this.page.$$(`.project-card:has-text("${name}")`)
    return cards.length > 0
  }
}
