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

  // --- Scene Management ---

  async addScene(filePath: string) {
    const fs = require('node:fs')
    const path = require('node:path')
    
    // Read file content
    const buffer = fs.readFileSync(filePath)
    const fileName = path.basename(filePath)
    const mimeType = 'image/jpeg'

    // Convert buffer to array for serialization
    const fileData = [...buffer]

    await this.page.evaluate(({ selector, fileName, fileData, mimeType }) => {
      // Create file from blob
      const blob = new Blob([new Uint8Array(fileData)], { type: mimeType })
      const file = new File([blob], fileName, { type: mimeType })
      
      // Create DataTransfer
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)
      
      // Dispatch drop event
      const event = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer,
      })
      
      const element = document.querySelector(selector)
      if (element) {
        element.dispatchEvent(event)
      } else {
        throw new Error(`Element ${selector} not found`)
      }
    }, { selector: '.drag-drop-card', fileName, fileData, mimeType })
    
    // Wait for the scene to appear in the list
    await this.waitFor('.scene-item')
  }

  async selectScene(nameOrIndex: string | number) {
    if (typeof nameOrIndex === 'number') {
      const scenes = await this.page.$$('.scene-item')
      if (scenes[nameOrIndex]) {
        await scenes[nameOrIndex].click()
      } else {
        throw new Error(`Scene at index ${nameOrIndex} not found`)
      }
    } else {
      await this.click(`.scene-item:has-text("${nameOrIndex}")`)
    }
  }

  async renameScene(oldName: string, newName: string) {
    // 1. Select the scene
    await this.selectScene(oldName)
    
    // 2. Open Scene Settings accordion if closed
    const accordionTrigger = await this.page.locator('button:has-text("Scene Settings")')
    const isExpanded = await accordionTrigger.getAttribute('aria-expanded') === 'true'
    if (!isExpanded) {
      await accordionTrigger.click()
      await this.wait(500) // Animation
    }

    // 3. Click edit icon/name
    // The name is in a div with onClick handler, identified by the pencil icon
    const nameDisplay = await this.page.locator('.space-y-2 .bg-\\[\\#252525\\]:has(.lucide-pencil)')
    await nameDisplay.click()

    // 4. Fill input
    await this.fill('.space-y-2 input', newName)
    
    // 5. Save (click save button)
    await this.click('.space-y-2 button:has(.lucide-save)')
    
    // 6. Verify update in sidebar
    await this.waitFor(`.scene-item:has-text("${newName}")`)
  }

  async deleteScene(name: string) {
    // 1. Select the scene
    await this.selectScene(name)
    
    // 2. Open Scene Settings accordion if closed
    const accordionTrigger = await this.page.locator('button:has-text("Scene Settings")')
    const isExpanded = await accordionTrigger.getAttribute('aria-expanded') === 'true'
    if (!isExpanded) {
      await accordionTrigger.click()
      await this.wait(500)
    }

    // 3. Click Delete Scene button
    await this.click('button:has-text("Delete Scene")')

    // 4. Confirm in dialog
    // The dialog has a "Delete Scene" button too
    const confirmBtn = await this.page.locator('[role="alertdialog"] button:has-text("Delete Scene")')
    await confirmBtn.click()

    // 5. Verify scene is gone
    await this.page.waitForSelector(`.scene-item:has-text("${name}")`, { state: 'hidden' })
  }

  async toggleSceneVisibility(name: string, shouldBeVisible: boolean) {
    await this.selectScene(name)
    
    // Check if visibility toggle in sidebar matches expectation
    // The eye icon logic is a bit complex to check via class, but we can check the switch in settings
    
    // Open Scene Settings
    const accordionTrigger = await this.page.locator('button:has-text("Scene Settings")')
    if (await accordionTrigger.getAttribute('aria-expanded') !== 'true') {
      await accordionTrigger.click()
      await this.wait(500)
    }

    // Find the switch for "Show Scene"
    // It's the first switch in the panel usually, or we can find by label
    // Label "Show Scene" is followed by a Switch
    const switchEl = await this.page.locator('button[role="switch"]').first() // Assuming first switch is visibility
    const isChecked = await switchEl.getAttribute('aria-checked') === 'true'
    
    if (isChecked !== shouldBeVisible) {
      await switchEl.click()
      await this.wait(500) // Wait for update
    }
  }

  async setFeaturedScene(name: string) {
    await this.selectScene(name)
    
    // Open Scene Settings
    const accordionTrigger = await this.page.locator('button:has-text("Scene Settings")')
    if (await accordionTrigger.getAttribute('aria-expanded') !== 'true') {
      await accordionTrigger.click()
      await this.wait(500)
    }

    // Find "Featured Scene" switch
    // It's likely the second switch, or we can look for the label
    // Using a more robust selector:
    const featuredSwitch = await this.page.locator('div:has-text("Featured Scene") + div button[role="switch"]')
    // Or if structure is different:
    // <div ...><Label>Featured Scene</Label>...<Switch>
    // Let's try finding the switch inside the container that has "Featured Scene" text
    // But the text is in a sibling or parent.
    // Let's use the order if labels are consistent.
    // 1. Show Scene
    // 2. Featured Scene
    // 3. Show All Hotspots
    
    const switches = await this.page.locator('button[role="switch"]').all()
    if (switches.length >= 2) {
      const isChecked = await switches[1].getAttribute('aria-checked') === 'true'
      if (!isChecked) {
        await switches[1].click()
        await this.wait(500)
      }
    }
  }

  async setSceneOrientation(name: string, pan: number) {
    await this.selectScene(name)
    
    // Open Scene Settings
    const accordionTrigger = await this.page.locator('button:has-text("Scene Settings")')
    if (await accordionTrigger.getAttribute('aria-expanded') !== 'true') {
      await accordionTrigger.click()
      await this.wait(500)
    }

    // Open Advanced Options
    const advancedBtn = await this.page.locator('button:has-text("Advanced Options")')
    // Check if already open? It renders content if open.
    // If "Scene Orientation" label is visible, it's open.
    if (!(await this.page.isVisible('text=Scene Orientation'))) {
      await advancedBtn.click()
      await this.wait(500)
    }

    // Set Pan
    // Input type number
    const panInput = await this.page.locator('input[placeholder="0"]')
    await panInput.fill(pan.toString())
    
    // Click Apply
    await this.click('button:has-text("Apply")')
    await this.wait(500)
  }

  async addSceneComment(name: string, comment: string) {
    await this.selectScene(name)
    
    // Open Comments accordion
    const accordionTrigger = await this.page.locator('button:has-text("Comments")')
    if (await accordionTrigger.getAttribute('aria-expanded') !== 'true') {
      await accordionTrigger.click()
      await this.wait(500)
    }

    // Fill textarea
    await this.fill('textarea[placeholder*="Add notes"]', comment)
    
    // Trigger blur to save (click outside, e.g. on the accordion trigger)
    await accordionTrigger.click()
    await this.wait(500)
  }
}
