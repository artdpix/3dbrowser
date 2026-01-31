import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

// Configurar worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

// Cache de thumbnails em memória
const thumbnailCache = new Map()

// Tamanho do thumbnail
const THUMB_SIZE = 128

// Tamanho máximo de ficheiro para gerar thumbnail (50MB)
const MAX_FILE_SIZE_FOR_THUMB = 50 * 1024 * 1024

/**
 * Gera thumbnail para um ficheiro
 * @param {Object} file - Objeto do ficheiro com path e type
 * @returns {Promise<string|null>} - Data URL do thumbnail ou null
 */
export async function generateThumbnail(file) {
  // Verificar cache
  if (thumbnailCache.has(file.id)) {
    return thumbnailCache.get(file.id)
  }

  try {
    let thumbnail = null

    switch (file.type) {
      case 'image':
        thumbnail = await generateImageThumbnail(file)
        break
      case 'pdf':
        thumbnail = await generatePDFThumbnail(file)
        break
      case 'video':
        thumbnail = await generateVideoThumbnail(file)
        break
      default:
        return null
    }

    // Guardar em cache
    if (thumbnail) {
      thumbnailCache.set(file.id, thumbnail)
      // Também guardar em localStorage para persistência
      saveThumbnailToStorage(file.id, thumbnail)
    }

    return thumbnail
  } catch (error) {
    console.error('Erro ao gerar thumbnail:', error)
    return null
  }
}

/**
 * Obtém thumbnail do cache ou storage
 */
export function getCachedThumbnail(fileId) {
  if (thumbnailCache.has(fileId)) {
    return thumbnailCache.get(fileId)
  }

  // Tentar carregar do localStorage
  const stored = loadThumbnailFromStorage(fileId)
  if (stored) {
    thumbnailCache.set(fileId, stored)
    return stored
  }

  return null
}

/**
 * Gera thumbnail para imagem
 */
async function generateImageThumbnail(file) {
  if (!window.electronAPI) return null

  const result = await window.electronAPI.readFileAsDataUrl(file.path)
  if (!result.success) return null

  return resizeImage(result.dataUrl, THUMB_SIZE)
}

/**
 * Gera thumbnail para PDF (primeira página)
 */
async function generatePDFThumbnail(file) {
  if (!window.electronAPI) return null

  try {
    const result = await window.electronAPI.readFile(file.path)
    if (!result.success) return null

    // Converter base64 para Uint8Array
    const binaryString = atob(result.data)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // Carregar PDF
    const pdf = await pdfjsLib.getDocument({ data: bytes }).promise
    const page = await pdf.getPage(1)

    // Calcular escala para thumbnail
    const viewport = page.getViewport({ scale: 1 })
    const scale = THUMB_SIZE / Math.max(viewport.width, viewport.height)
    const scaledViewport = page.getViewport({ scale })

    // Criar canvas
    const canvas = document.createElement('canvas')
    canvas.width = scaledViewport.width
    canvas.height = scaledViewport.height
    const context = canvas.getContext('2d')

    // Fundo branco
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)

    // Renderizar página
    await page.render({
      canvasContext: context,
      viewport: scaledViewport
    }).promise

    return canvas.toDataURL('image/jpeg', 0.7)
  } catch (error) {
    console.error('Erro ao gerar thumbnail PDF:', error)
    return null
  }
}

/**
 * Gera thumbnail para vídeo (frame do meio)
 * Nota: Para vídeos grandes, não geramos thumbnail para evitar problemas de memória
 */
async function generateVideoThumbnail(file) {
  if (!window.electronAPI) return null

  // Verificar tamanho do ficheiro - vídeos muito grandes não devem ser convertidos para base64
  if (file.size && file.size > MAX_FILE_SIZE_FOR_THUMB) {
    console.log('Vídeo muito grande para thumbnail:', file.name)
    return null
  }

  return new Promise(async (resolve) => {
    let timeoutId = null
    let video = null

    try {
      const result = await window.electronAPI.readFileAsDataUrl(file.path)
      if (!result.success) {
        resolve(null)
        return
      }

      video = document.createElement('video')
      video.preload = 'metadata'
      video.muted = true
      video.playsInline = true
      video.crossOrigin = 'anonymous'

      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId)
        if (video) {
          video.onloadedmetadata = null
          video.onseeked = null
          video.onerror = null
          video.src = ''
          video.load()
        }
      }

      video.onloadedmetadata = () => {
        // Ir para 10% do vídeo para evitar frames pretos
        if (video.duration && video.duration > 0) {
          video.currentTime = Math.min(video.duration * 0.1, 5)
        } else {
          video.currentTime = 1
        }
      }

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas')
          const vw = video.videoWidth || 320
          const vh = video.videoHeight || 240
          const aspectRatio = vw / vh

          if (aspectRatio > 1) {
            canvas.width = THUMB_SIZE
            canvas.height = Math.round(THUMB_SIZE / aspectRatio)
          } else {
            canvas.height = THUMB_SIZE
            canvas.width = Math.round(THUMB_SIZE * aspectRatio)
          }

          const context = canvas.getContext('2d')
          context.drawImage(video, 0, 0, canvas.width, canvas.height)

          const thumbnail = canvas.toDataURL('image/jpeg', 0.7)
          cleanup()
          resolve(thumbnail)
        } catch (e) {
          console.error('Erro ao capturar frame:', e)
          cleanup()
          resolve(null)
        }
      }

      video.onerror = (e) => {
        console.error('Erro ao carregar vídeo para thumbnail:', e)
        cleanup()
        resolve(null)
      }

      // Timeout de segurança (5 segundos)
      timeoutId = setTimeout(() => {
        console.log('Timeout ao gerar thumbnail do vídeo')
        cleanup()
        resolve(null)
      }, 5000)

      video.src = result.dataUrl
    } catch (error) {
      console.error('Erro ao gerar thumbnail vídeo:', error)
      resolve(null)
    }
  })
}

/**
 * Redimensiona uma imagem
 */
function resizeImage(dataUrl, maxSize) {
  return new Promise((resolve) => {
    const img = new Image()

    img.onload = () => {
      const canvas = document.createElement('canvas')
      let width = img.width
      let height = img.height

      // Calcular novas dimensões mantendo aspect ratio
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width
          width = maxSize
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height
          height = maxSize
        }
      }

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      resolve(canvas.toDataURL('image/jpeg', 0.7))
    }

    img.onerror = () => resolve(null)
    img.src = dataUrl
  })
}

/**
 * Guardar thumbnail no localStorage
 */
function saveThumbnailToStorage(fileId, thumbnail) {
  try {
    // Usar um prefixo para organizar
    const key = `thumb_${fileId.substring(0, 32)}`
    localStorage.setItem(key, thumbnail)
  } catch (e) {
    // localStorage pode estar cheio, ignorar
    console.warn('Não foi possível guardar thumbnail:', e)
  }
}

/**
 * Carregar thumbnail do localStorage
 */
function loadThumbnailFromStorage(fileId) {
  try {
    const key = `thumb_${fileId.substring(0, 32)}`
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

/**
 * Limpar cache de thumbnails
 */
export function clearThumbnailCache() {
  thumbnailCache.clear()
  // Limpar localStorage também
  const keys = Object.keys(localStorage).filter(k => k.startsWith('thumb_'))
  keys.forEach(k => localStorage.removeItem(k))
}
