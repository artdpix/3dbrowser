const { contextBridge, ipcRenderer } = require('electron')

// Expõe APIs seguras para o frontend
contextBridge.exposeInMainWorld('electronAPI', {
  // Selecionar pasta
  selectFolder: () => ipcRenderer.invoke('select-folder'),

  // Scan de ficheiros
  scanLibrary: (folderPath) => ipcRenderer.invoke('scan-library', folderPath),

  // Ler ficheiro (para PDF)
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),

  // Ler ficheiro como Data URL (para imagens/media)
  readFileAsDataUrl: (filePath) => ipcRenderer.invoke('read-file-as-data-url', filePath),

  // Obter URL do ficheiro
  getFileUrl: (filePath) => ipcRenderer.invoke('get-file-url', filePath),

  // Verificar se está no Electron
  isElectron: true
})
