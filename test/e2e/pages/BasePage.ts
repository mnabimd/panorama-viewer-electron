import { type Page } from 'playwright'

export class BasePage {
  protected page: Page

  constructor(page: Page) {
    this.page = page
  }

  async waitFor(selector: string, optionsOrTimeout: number | { state?: 'attached' | 'detached' | 'visible' | 'hidden', timeout?: number } = 10000) {
    const options = typeof optionsOrTimeout === 'number' ? { timeout: optionsOrTimeout } : optionsOrTimeout
    return this.page.waitForSelector(selector, options)
  }

  async click(selector: string) {
    const element = await this.waitFor(selector)
    await element.click()
  }

  async fill(selector: string, value: string) {
    const element = await this.waitFor(selector)
    await element.fill(value)
  }

  async screenshot(name: string) {
    await this.page.screenshot({ path: `test/screenshots/${name}.png` })
  }

  async wait(ms: number) {
    await this.page.waitForTimeout(ms)
  }
}
