import { contextBridge, ipcRenderer } from "electron"

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("api", {
  runNucleiScan: (options: any) => ipcRenderer.invoke("run-nuclei-scan", options),
  getTemplates: () => ipcRenderer.invoke("get-templates"),
  saveTemplate: (template: { name: string; content: string }) => ipcRenderer.invoke("save-template", template),
  loadTemplate: (options: { path: string }) => ipcRenderer.invoke("load-template", options),
  selectFile: (options: { directory?: boolean; filters?: { name: string; extensions: string[] }[] }) =>
    ipcRenderer.invoke("select-file", options),
  selectSavePath: (options: { defaultPath?: string; filters?: { name: string; extensions: string[] }[] }) =>
    ipcRenderer.invoke("select-save-path", options),
  getTemplateTree: () => ipcRenderer.invoke("get-template-tree"), // Added template tree handler
  onNucleiOutput: (callback: (output: string) => void) =>
    ipcRenderer.on("nuclei-output", (_, output) => callback(output)),
  onNucleiError: (callback: (error: string) => void) => ipcRenderer.on("nuclei-error", (_, error) => callback(error)),
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners("nuclei-output")
    ipcRenderer.removeAllListeners("nuclei-error")
  },
})
