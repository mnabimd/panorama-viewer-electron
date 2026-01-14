import { BasePage } from './BasePage'

export class EditorPage extends BasePage {
  async isLoaded() {
    await this.waitFor('.project-editor')
    return true
  }

  async getProjectName() {
    const element = await this.waitFor('.project-name')
    return element.textContent()
  }

  async openProjectProperties() {
    // Simulate menu action or shortcut
    await this.page.evaluate(() => {
      window.dispatchEvent(new Event('open-project-properties'))
    })
    await this.waitFor('text=Project Properties')
  }

  async renameProject(newName: string) {
    await this.openProjectProperties()
    await this.fill('input#project-name', '')
    await this.fill('input#project-name', newName)
    
    // Scroll to save button if needed
    const saveBtn = await this.page.locator('button:has-text("Save Changes")')
    await saveBtn.scrollIntoViewIfNeeded()
    await this.screenshot('debug-before-save-rename')
    await saveBtn.click()
    
    // Wait for dialog to close completely
    try {
      // Use role=dialog to avoid matching the success toast
      await this.page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 })
    } catch (e) {
      await this.screenshot('debug-dialog-not-closed')
      throw e
    }
    
    await this.wait(1000) // Buffer for React state update
    await this.screenshot('debug-after-save-rename')
  }

  async navigateToDashboard() {
    await this.click('.back-btn')
    await this.waitFor('.dashboard')
  }
}
