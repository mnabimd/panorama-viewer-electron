import path from 'node:path'
import {
  type ElectronApplication,
  type Page,
  _electron as electron,
} from 'playwright'

const root = path.join(__dirname, '../../..')

export const launchApp = async () => {
  const electronApp = await electron.launch({
    args: ['.', '--no-sandbox'],
    cwd: root,
    env: { ...process.env, NODE_ENV: 'development' },
  })
  
  const page = await electronApp.firstWindow()
  
  // Maximize window for consistent testing
  const mainWin = await electronApp.browserWindow(page)
  await mainWin.evaluate((win) => win.maximize())
  
  // Wait for app to load
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(2000)

  return { electronApp, page }
}
