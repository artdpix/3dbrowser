const { app, BrowserWindow, ipcMain, dialog, protocol, net } = require('electron')
const path = require('path')
const fs = require('fs')
const url = require('url')

let mainWindow

// Registar protocolo personalizado para servir ficheiros locais
function registerLocalFileProtocol() {
  protocol.handle('local-file', (request) => {
    const filePath = decodeURIComponent(request.url.replace('local-file://', ''))
    return net.fetch(url.pathToFileURL(filePath).toString())
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    },
    icon: path.join(__dirname, '../public/icon.png'),
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#1a1a2e'
  })

  // Em desenvolvimento, carrega do servidor Vite
  if (process.env.NODE_ENV !== 'production') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    // Em produção, carrega os ficheiros compilados
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

// Selecionar pasta da biblioteca
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Seleciona a pasta da tua biblioteca'
  })

  if (result.canceled) return null
  return result.filePaths[0]
})

// Scan de ficheiros na pasta
ipcMain.handle('scan-library', async (event, folderPath) => {
  if (!folderPath || !fs.existsSync(folderPath)) {
    return { files: [], error: 'Pasta não encontrada' }
  }

  const supportedExtensions = ['.pdf', '.mp3', '.mp4', '.wav', '.ogg', '.webm', '.m4a', '.mkv', '.avi', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg']
  const files = []

  function scanDir(dir, relativePath = '') {
    try {
      const items = fs.readdirSync(dir)

      for (const item of items) {
        const fullPath = path.join(dir, item)
        const relPath = path.join(relativePath, item)

        try {
          const stat = fs.statSync(fullPath)

          if (stat.isDirectory()) {
            scanDir(fullPath, relPath)
          } else {
            const ext = path.extname(item).toLowerCase()
            if (supportedExtensions.includes(ext)) {
              const type = ext === '.pdf' ? 'pdf'
                : ['.mp3', '.wav', '.ogg', '.m4a'].includes(ext) ? 'audio'
                : ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'].includes(ext) ? 'image'
                : 'video'

              files.push({
                id: Buffer.from(fullPath).toString('base64'),
                name: path.basename(item, ext),
                extension: ext,
                type,
                path: fullPath,
                relativePath: relPath,
                size: stat.size,
                modified: stat.mtime
              })
            }
          }
        } catch (e) {
          // Ignora ficheiros sem permissão
        }
      }
    } catch (e) {
      // Ignora pastas sem permissão
    }
  }

  scanDir(folderPath)

  return {
    files: files.sort((a, b) => a.name.localeCompare(b.name)),
    total: files.length,
    counts: {
      pdf: files.filter(f => f.type === 'pdf').length,
      audio: files.filter(f => f.type === 'audio').length,
      video: files.filter(f => f.type === 'video').length,
      image: files.filter(f => f.type === 'image').length
    }
  }
})

// Ler ficheiro como buffer (para PDFs)
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const buffer = fs.readFileSync(filePath)
    return { data: buffer.toString('base64'), success: true }
  } catch (error) {
    return { error: error.message, success: false }
  }
})

// Obter URL do ficheiro para media (usando protocolo personalizado)
ipcMain.handle('get-file-url', async (event, filePath) => {
  // Usar protocolo personalizado para contornar restrições de segurança
  return `local-file://${encodeURIComponent(filePath)}`
})

// Ler ficheiro como data URL (alternativa para imagens/media)
ipcMain.handle('read-file-as-data-url', async (event, filePath) => {
  try {
    const buffer = fs.readFileSync(filePath)
    const ext = path.extname(filePath).toLowerCase()

    // Determinar MIME type
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
      '.svg': 'image/svg+xml',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.m4a': 'audio/mp4',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mkv': 'video/x-matroska',
      '.avi': 'video/x-msvideo'
    }

    const mimeType = mimeTypes[ext] || 'application/octet-stream'
    const base64 = buffer.toString('base64')

    return {
      dataUrl: `data:${mimeType};base64,${base64}`,
      success: true
    }
  } catch (error) {
    return { error: error.message, success: false }
  }
})

app.whenReady().then(() => {
  registerLocalFileProtocol()
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
