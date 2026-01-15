import { Menu, MenuItem, BrowserWindow, MenuItemConstructorOptions, app } from 'electron'

/**
 * Create application menu
 * @param mainWindow - The main browser window
 */
export function createMenu(mainWindow: BrowserWindow): void {
  const isMac = process.platform === 'darwin'

  const template: MenuItemConstructorOptions[] = [
    // File Menu
    {
      label: 'File',
      submenu: [
        {
          label: 'New Project',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu:new-project')
          }
        },
        {
          label: 'Save Project',
          accelerator: 'CmdOrCtrl+S',
          enabled: false, // Disabled as per user request
          click: () => {
            mainWindow.webContents.send('menu:save-project')
          }
        },
        {
          label: 'Save Project As',
          accelerator: 'CmdOrCtrl+Shift+S',
          enabled: false, // Placeholder for future implementation
          click: () => {
            // To be implemented
          }
        },
        { type: 'separator' },
        {
          label: 'Import Scenes',
          accelerator: 'CmdOrCtrl+I',
          click: () => {
            mainWindow.webContents.send('menu:import-scenes')
          }
        },
        {
          label: 'Export Project',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            mainWindow.webContents.send('menu:export-project')
          }
        },
        {
          label: 'Export for Web',
          enabled: false, // Placeholder for future implementation
          click: () => {
            // To be implemented
          }
        },
        { type: 'separator' },
        {
          label: 'Quit App',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit()
          }
        }
      ]
    },
    
    // View Menu
    {
      label: 'View',
      submenu: [
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => {
            const currentZoom = mainWindow.webContents.getZoomLevel()
            mainWindow.webContents.setZoomLevel(currentZoom + 0.5)
          }
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            const currentZoom = mainWindow.webContents.getZoomLevel()
            mainWindow.webContents.setZoomLevel(currentZoom - 0.5)
          }
        },
        {
          label: 'Actual Size',
          accelerator: 'CmdOrCtrl+0',
          click: () => {
            mainWindow.webContents.setZoomLevel(0)
          }
        },
        { type: 'separator' },
        {
          label: 'Fullscreen',
          accelerator: 'F11',
          click: () => {
            const isFullScreen = mainWindow.isFullScreen()
            mainWindow.setFullScreen(!isFullScreen)
          }
        },
        { type: 'separator' },
        {
          label: 'Toggle Right Sidebar',
          accelerator: 'CmdOrCtrl+B',
          click: () => {
            mainWindow.webContents.send('menu:toggle-sidebar')
          }
        }
      ]
    },
    
    // Project Menu
    {
      label: 'Project',
      submenu: [
        {
          label: 'Preview Mode',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            mainWindow.webContents.send('menu:preview-mode')
          }
        },
        {
          label: 'Project Properties',
          click: () => {
            mainWindow.webContents.send('menu:project-properties')
          }
        },
        {
          label: 'Validate Project',
          enabled: false, // Placeholder for future implementation
          click: () => {
            // To be implemented
          }
        },
        { type: 'separator' },
        {
          label: 'Reload App',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.reload()
          }
        }
      ]
    },
    
    // Advanced Menu
    {
      label: 'Advanced',
      submenu: [
        {
          label: 'Toggle Developer Menu',
          click: () => {
            const currentMenu = Menu.getApplicationMenu()
            if (currentMenu) {
              // Toggle visibility - this is a visual indicator
              mainWindow.webContents.send('menu:toggle-dev-menu')
            }
          }
        },
        {
          label: 'Open DevTools',
          accelerator: 'F12',
          click: () => {
            mainWindow.webContents.toggleDevTools()
          }
        },
        {
          label: 'Clear Cache',
          click: async () => {
            await mainWindow.webContents.session.clearCache()
            mainWindow.webContents.send('menu:cache-cleared')
          }
        },
        {
          label: 'Reload & Clear Cache',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: async () => {
            await mainWindow.webContents.session.clearCache()
            mainWindow.reload()
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}
