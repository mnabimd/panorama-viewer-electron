import { ipcMain, app } from 'electron'
import log from 'electron-log/main'
import path from 'node:path'

// Configure electron-log
log.initialize()

// Set custom log file path
const logPath = path.join(app.getPath('documents'), 'ABNabi360', 'debug.log')
log.transports.file.resolvePathFn = () => logPath
log.transports.file.level = 'info'
log.transports.console.level = 'info'
log.errorHandler.startCatching()

// Export log instance for use in other files
export const logger = log

export function setupLogger() {
  log.info('Logger initialized')
  log.info(`App Version: ${app.getVersion()}`)
  log.info(`User Data Path: ${app.getPath('userData')}`)
  log.info(`Executable Path: ${app.getPath('exe')}`)
  
  // Handle log messages from renderer
  ipcMain.handle('log-message', async (_, { level, context, file, message }: { 
    level: string, 
    context: string, 
    file: string,
    message: string 
  }) => {
    const logMessage = `[${context}] [${file}] ${message}`
    
    switch (level.toLowerCase()) {
      case 'error':
        log.error(logMessage)
        break
      case 'warn':
        log.warn(logMessage)
        break
      case 'info':
        log.info(logMessage)
        break
      case 'debug':
        log.debug(logMessage)
        break
      default:
        log.info(logMessage)
    }
    return { success: true }
  })
}
