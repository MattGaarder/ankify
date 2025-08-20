// electron-main.js
import { app, BrowserWindow, Tray, Menu, nativeImage } from 'electron'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'

// fallback in case process.platform is undefined
const platform = process.platform || os.platform()

// ESM-safe __dirname
const currentDir = fileURLToPath(new URL('.', import.meta.url))

let mainWindow = null
let tray = null

async function createWindow () {
  console.log('[main] createWindow called')

  mainWindow = new BrowserWindow({
    width: 400,
    height: 300,
    webPreferences: {
      contextIsolation: true,
      preload: path.resolve(
        currentDir,
        path.join(process.env.QUASAR_ELECTRON_PRELOAD_FOLDER, 'electron-preload' + process.env.QUASAR_ELECTRON_PRELOAD_EXTENSION)
      )
    }
  })

  if (process.env.DEV) {
    console.log('[main] loading DEV url:', process.env.APP_URL)
    await mainWindow.loadURL(process.env.APP_URL)
  } else {
    console.log('[main] loading PROD index.html')
    await mainWindow.loadFile('index.html')
  }

  mainWindow.on('closed', () => {
    console.log('[main] window closed')
    mainWindow = null
  })

  mainWindow.webContents.on('did-start-loading', () => {
    console.log('[main] renderer did-start-loading')
  })

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[main] renderer did-finish-load')
  })
}

// ==== APP EVENTS ====
app.whenReady().then(() => {
  console.log('[main] app is ready')
  createWindow()
  console.log('[main] creating tray')
  const trayPath = path.resolve(process.cwd(), 'src-electron/icons/trayTemplate.png')
  const trayImage = nativeImage.createFromPath(trayPath).resize({ width: 15, height: 15 })
  trayImage.setTemplateImage(true)
  tray = new Tray(trayImage); 
  tray.setTitle('⚡');                

  tray.setToolTip('Ankify')
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Show/Hide', click: () => {
        if (!mainWindow) return
        if (mainWindow.isVisible()) { console.log('[main] hiding'); mainWindow.hide() }
        else { console.log('[main] showing'); mainWindow.show(); mainWindow.focus() }
      }},
    { type: 'separator' },
    { label: 'Quit', role: 'quit' }
  ]))
  tray.on('click', () => {
    console.log('[main] tray clicked')
    if (!mainWindow) return
    if (mainWindow.isVisible()) { mainWindow.hide() } else { mainWindow.show(); mainWindow.focus() }
  })
})

app.on('window-all-closed', () => {
  console.log('[main] all windows closed')
  if (platform !== 'darwin') {
    console.log('[main] quitting app')
    app.quit()
  }
})

app.on('activate', () => {
  console.log('[main] activate event')
  if (mainWindow === null) {
    createWindow()
  }
})


