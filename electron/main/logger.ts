import { ipcMain, app } from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'

const LOG_FILE_PATH = path.join(app.getPath('documents'), 'ABNabi360', 'debug.log')

export function setupLogger() {
  ipcMain.handle('log-message', async (_, { level, context, file, message }: { 
    level: string, 
    context: string, 
    file: string,
    message: string 
  }) => {
    try {
      const timestamp = new Date().toISOString()
      const logEntry = `[${timestamp}] [${level}] [${context}] [${file}] ${message}\n`
      
      // Ensure directory exists
      const logDir = path.dirname(LOG_FILE_PATH)
      try {
        await fs.access(logDir)
      } catch {
        await fs.mkdir(logDir, { recursive: true })
      }

      await fs.appendFile(LOG_FILE_PATH, logEntry, 'utf-8')
      return { success: true }
    } catch (error) {
      console.error('Failed to write log:', error)
      return { success: false, error }
    }
  })
}
