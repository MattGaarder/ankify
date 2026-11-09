/**
 * This file is used specifically for security reasons.
 * Here you can access Nodejs stuff and inject functionality into
 * the renderer thread (accessible there through the "window" object)
 *
 * WARNING!
 * If you import anything from node_modules, then make sure that the package is specified
 * in package.json > dependencies and NOT in devDependencies
 *
 * Example (injects window.myAPI.doAThing() into renderer thread):
 *
 *   import { contextBridge } from 'electron'
 *
 *   contextBridge.exposeInMainWorld('myAPI', {
 *     doAThing: () => {}
 *   })
 *
 * WARNING!
 * If accessing Node functionality (like importing @electron/remote) then in your
 * electron-main.js you will need to set the following when you instantiate BrowserWindow:
 *
 * mainWindow = new BrowserWindow({
 *   // ...
 *   webPreferences: {
 *     // ...
 *     sandbox: false // <-- to be able to import @electron/remote in preload script
 *   }
 * }
 */
// electron-preload.js
// Runs in the **renderer** context but before Vue app.
// We expose a safe, minimal API on window.ankify so the renderer can
// call into main process without Node.js privileges.
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('ankify', {
  resize: (width, height) => ipcRenderer.invoke('window:resize', { width, height }),
  dictLookup: (text) => ipcRenderer.invoke('dict:lookup', text),
  log: (...args) => ipcRenderer.send('ankify:log', args),
  invokeAnki: (action, params) => ipcRenderer.invoke('ankiconnect:invoke', {action, params}),
  tokenize: (text) => ipcRenderer.invoke('morph:tokenize', text)
})
