import { BasePage } from './BasePage'

export class EditorPage extends BasePage {
  private currentProjectName: string = ''

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
    
    // Update tracked project name
    this.currentProjectName = newName
  }

  async navigateToDashboard() {
    await this.click('.back-btn')
    await this.waitFor('.dashboard')
  }

  // Store project name when opening/creating to use for IPC calls
  setProjectContext(projectName: string) {
    this.currentProjectName = projectName
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

  // --- Hotspot Management ---

  async addHotspot(type: 'info' | 'scene', title: string, descriptionOrTarget?: string) {
    console.log(`\n=== Adding ${type} hotspot: "${title}" ===`)
    
    // 0. Ensure any previous dialog is closed
    const existingDialog = await this.page.locator('[role="dialog"]').count()
    if (existingDialog > 0) {
      console.log('⚠️  Dialog still open from previous action, closing it...')
      await this.page.keyboard.press('Escape')
      await this.wait(500)
    }
    
    // 1. Open Hotspots accordion if closed
    const accordionTrigger = await this.page.locator('button:has-text("Hotspots")')
    const isExpanded = await accordionTrigger.getAttribute('aria-expanded')
    console.log(`Hotspots accordion expanded: ${isExpanded}`)
    
    if (isExpanded !== 'true') {
      console.log('Opening Hotspots accordion...')
      await accordionTrigger.click()
      await this.wait(500)
    }

    // Take screenshot before clicking button
    await this.screenshot(`before-click-${type}-button`)

    // 2. Click Add Button (this sets isAddingHotspot = true)
    // Target the button specifically within the Hotspots accordion content
    const buttonText = type === 'info' ? 'Info' : 'Scene'
    console.log(`Looking for button: "${buttonText}"`)
    
    // Find the button within the accordion content (not in dialogs)
    const accordionContent = this.page.locator('[data-state="open"]').filter({ has: this.page.locator('button:has-text("Hotspots")') })
    const button = accordionContent.locator(`button:has-text("${buttonText}")`).first()
    
    const buttonCount = await this.page.locator(`button:has-text("${buttonText}")`).count()
    console.log(`Found ${buttonCount} total buttons with text "${buttonText}"`)
    
    const buttonVisible = await button.isVisible().catch(() => false)
    console.log(`Target button visible: ${buttonVisible}`)
    
    if (!buttonVisible) {
      throw new Error(`Button "${buttonText}" not visible in Hotspots panel!`)
    }
    
    console.log(`Clicking "${buttonText}" button...`)
    await button.click()
    await this.wait(300)
    
    // Take screenshot after clicking button
    await this.screenshot(`after-click-${type}-button`)

    // 3. Wait for 'adding-hotspot' class to be added to container
    console.log('Waiting for adding-hotspot class...')
    let addingModeActive = false
    for (let i = 0; i < 10; i++) {
      const hasClass = await this.page.evaluate((iteration) => {
        const container = document.querySelector('.panorama-viewer-container')
        const classList = container?.classList.toString() || 'container not found'
        console.log(`Iteration ${iteration}: classes = ${classList}`)
        return container && container.classList.contains('adding-hotspot')
      }, i) // Pass i as parameter
      
      console.log(`  Attempt ${i + 1}/10: adding-hotspot class present = ${hasClass}`)
      
      if (hasClass) {
        addingModeActive = true
        console.log('✓ Adding mode activated!')
        break
      }
      await this.wait(200)
    }

    if (!addingModeActive) {
      await this.screenshot('adding-mode-failed')
      console.error('✗ Adding mode never activated!')
      throw new Error('Adding mode (adding-hotspot class) never activated')
    }

    // 4. Small additional delay to ensure click event listener is attached
    await this.wait(500)

    // 5. Take screenshot before click for debugging
    await this.screenshot('before-hotspot-click')

    // 6. Click canvas at a random position to avoid existing markers
    const canvas = this.page.locator('canvas.psv-canvas')
    
    // Generate random position to avoid clicking on existing markers
    const randomX = 200 + Math.floor(Math.random() * 400) // Random between 200-600
    const randomY = 200 + Math.floor(Math.random() * 400) // Random between 200-600
    
    console.log(`Clicking canvas at position (${randomX}, ${randomY}) with force: true...`)
    await canvas.click({ position: { x: randomX, y: randomY }, force: true })
    await this.wait(500)
    
    // Method 2: If dialog didn't open, try event dispatch
    const dialogVisible = await this.page.locator('[role="dialog"]').isVisible().catch(() => false)
    if (!dialogVisible) {
      console.log('Dialog not visible after Playwright click, trying event dispatch...')
      await this.page.evaluate(() => {
        const viewer = document.querySelector('.psv-container')
        if (viewer) {
          const clickEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true,
            clientX: window.innerWidth / 2,
            clientY: window.innerHeight / 2
          })
          viewer.dispatchEvent(clickEvent)
        }
      })
    }

    // 7. Wait for dialog to appear
    await this.waitFor('[role="dialog"]', 15000)
    await this.wait(500) // Wait for dialog to fully render
    
    // 8. Fill dialog fields based on hotspot type
    if (type === 'info') {
      // For info hotspots: fill title and content
      console.log(`Filling info hotspot: title="${title}"`)
      await this.fill('input#infoTitle', title)
      
      if (descriptionOrTarget) {
        await this.fill('textarea#infoContent', descriptionOrTarget)
      }
    } else {
      // For scene hotspots: fill tooltip (optional) and select target scene
      console.log(`Filling scene hotspot: tooltip="${title}", target="${descriptionOrTarget}"`)
      
      // Fill tooltip with the title parameter
      await this.fill('input#tooltip', title)
      
      // Select target scene from dropdown
      if (descriptionOrTarget) {
        // The scene select is a button with role combobox
        const sceneSelect = this.page.locator('button[role="combobox"]').last()
        await sceneSelect.click()
        await this.wait(300)
        // Click the scene option by name
        await this.click(`[role="option"]:has-text("${descriptionOrTarget}")`)
      }
    }
    
    // 9. Click Add Hotspot button
    await this.click('button:has-text("Add Hotspot")')
    
    // 10. Wait for dialog AND backdrop to close completely
    console.log('Waiting for dialog to close...')
    await this.page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 }).catch(() => {})
    await this.page.waitForSelector('.fixed.inset-0.z-50.bg-black\\/50', { state: 'hidden', timeout: 5000 }).catch(() => {})
    await this.wait(1000) // Extra wait to ensure UI state fully resets
    
   // 11. Verify it appears in sidebar
    // Scene hotspots display target scene name, info hotspots display title
    const expectedText = type === 'scene' ? descriptionOrTarget : title
    console.log(`Verifying hotspot "${expectedText}" in sidebar...`)
    await this.waitFor(`.hotspot-item:has-text("${expectedText}")`, 10000)
    console.log(`✓ Hotspot "${expectedText}" successfully added\n`)
 }

  async renameHotspot(oldName: string, newName: string) {
    console.log(`Renaming hotspot from "${oldName}" to "${newName}"`)
    
    // Find the hotspot item and click edit icon (pencil)
    const item = this.page.locator(`.hotspot-item:has-text("${oldName}")`)
    await item.locator('button').filter({ has: this.page.locator('.lucide-pencil') }).click()
    
    // Wait for dialog
    await this.waitFor('[role="dialog"]')
    await this.wait(300)
    
    // Check which type of hotspot by looking for tooltip or infoTitle field
    const hasTooltip = await this.page.locator('input#tooltip').isVisible().catch(() => false)
    const hasInfoTitle = await this.page.locator('input#infoTitle').isVisible().catch(() => false)
    
    if (hasInfoTitle) {
      // Info hotspot - update title
      await this.fill('input#infoTitle', newName)
    } else if (hasTooltip) {
      // Scene hotspot - update tooltip
      await this.fill('input#tooltip', newName)
    }
    
    // Save
    await this.click('button:has-text("Save Changes")')
    await this.wait(500)
    
    // Verify renamed
    await this.waitFor(`.hotspot-item:has-text("${newName}")`)
    console.log(`✓ Hotspot renamed to "${newName}"`)
  }

  async toggleHotspotVisibility(name: string, isVisible: boolean) {
    console.log(`${isVisible ? 'Showing' : 'Hiding'} hotspot "${name}"`)
    
    // Find the hotspot item and click eye icon
    const item = this.page.locator(`.hotspot-item:has-text("${name}")`)
    await item.locator('button').filter({ has: this.page.locator('.lucide-eye, .lucide-eye-off') }).click()
    await this.wait(500)
    
    console.log(`✓ Hotspot "${name}" visibility toggled`)
  }

  async verifyHotspotVisible(name: string, isVisible: boolean) {
    console.log(`Verifying hotspot "${name}" is ${isVisible ? 'visible' : 'hidden'}`)
    
    // Find the hotspot item
    const item = this.page.locator(`.hotspot-item:has-text("${name}")`)
    
    // Check if the eye-off icon is present (hidden) or eye icon (visible)
    if (isVisible) {
      // Should have eye icon (not eye-off)
      const hasEye = await item.locator('.lucide-eye').isVisible()
      if (!hasEye) {
        throw new Error(`Hotspot "${name}" should be visible but is hidden`)
      }
    } else {
      // Should have eye-off icon
      const hasEyeOff = await item.locator('.lucide-eye-off').isVisible()
      if (!hasEyeOff) {
        throw new Error(`Hotspot "${name}" should be hidden but is visible`)
      }
    }
    
    console.log(`✓ Hotspot "${name}" visibility confirmed: ${isVisible ? 'visible' : 'hidden'}`)
  }

  async deleteHotspot(name: string) {
    console.log(`Deleting hotspot "${name}"`)
    
    // Find the hotspot item and click delete icon (trash)
    const item = this.page.locator(`.hotspot-item:has-text("${name}")`)
    await item.locator('button').filter({ has: this.page.locator('.lucide-trash-2') }).click()
    
    // Wait for AlertDialog to appear
    await this.page.waitForSelector('[role="alertdialog"]', { state: 'visible', timeout: 5000 })
    await this.wait(300)
    
    // Click the Delete button in the AlertDialog
    await this.page.locator('[role="alertdialog"] button:has-text("Delete")').click()
    await this.wait(500)
    
    // Verify deleted (should not be in sidebar)
    await this.page.waitForSelector(`.hotspot-item:has-text("${name}")`, { state: 'hidden', timeout: 5000 })
    console.log(`✓ Hotspot "${name}" deleted`)
  }

  // --- Player Mode ---

  async enterPlayMode() {
    console.log('Entering Player/Preview Mode...')
    
    // Click the Play button in the right sidebar header
    // It has text "Play" and class "publish-btn"
    await this.click('button:has-text("Play")')
    
    // Wait for Close Preview button to appear
    await this.waitFor('button:has-text("Close Preview")')
    await this.wait(500) // Animation buffer
    console.log('✓ Entered Player Mode')
  }

  async exitPlayMode() {
    console.log('Exiting Player/Preview Mode...')
    
    // Click Close Preview button
    await this.click('button:has-text("Close Preview")')
    
    // Wait for Play button to reappear
    await this.waitFor('button:has-text("Play")')
    await this.wait(500) // Animation buffer
    console.log('✓ Exited Player Mode')
  }

  async verifyPlayerMode(isActive: boolean) {
    console.log(`Verifying Player Mode is ${isActive ? 'ACTIVE' : 'INACTIVE'}...`)
    
    if (isActive) {
      // 1. Close Preview button should be visible
      const closeBtn = await this.page.locator('button:has-text("Close Preview")').isVisible()
      if (!closeBtn) throw new Error('Player Mode: Close Preview button missing')
      
      // 2. Sidebars should be hidden
      // Right sidebar
      const rightSidebar = await this.page.locator('.editor-sidebar-right').isVisible()
      if (rightSidebar) throw new Error('Player Mode: Right sidebar should be hidden')
      
      // Left sidebar (check for project name input or back button)
      const backBtn = await this.page.locator('.back-btn').isVisible()
      if (backBtn) throw new Error('Player Mode: Left sidebar (back button) should be hidden')
      
    } else {
      // 1. Close Preview button should be hidden
      const closeBtn = await this.page.locator('button:has-text("Close Preview")').isVisible()
      if (closeBtn) throw new Error('Editor Mode: Close Preview button should be hidden')
      
      // 2. Sidebars should be visible
      const rightSidebar = await this.page.locator('.editor-sidebar-right').isVisible()
      if (!rightSidebar) throw new Error('Editor Mode: Right sidebar should be visible')
      
      const backBtn = await this.page.locator('.back-btn').isVisible()
      if (!backBtn) throw new Error('Editor Mode: Left sidebar should be visible')
    }
    console.log(`✓ Player Mode state verified: ${isActive}`)
  }
}
