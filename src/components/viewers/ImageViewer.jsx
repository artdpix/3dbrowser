import React, { useState, useEffect, useRef } from 'react'
import '../../styles/ImageViewer.css'

function ImageViewer({ file }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [imageUrl, setImageUrl] = useState(null)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef()

  // Obter URL da imagem (como Data URL)
  useEffect(() => {
    async function loadImage() {
      try {
        if (window.electronAPI) {
          const result = await window.electronAPI.readFileAsDataUrl(file.path)
          if (!result.success) {
            throw new Error(result.error)
          }
          setImageUrl(result.dataUrl)
        } else {
          throw new Error('Image viewer requires Electron')
        }
      } catch (err) {
        setError(err.message)
        setLoading(false)
      }
    }
    loadImage()
  }, [file.path])

  const handleImageLoad = () => {
    setLoading(false)
  }

  const handleImageError = () => {
    setError('Erro ao carregar imagem')
    setLoading(false)
  }

  // Zoom
  const zoomIn = () => setScale(Math.min(scale + 0.25, 5))
  const zoomOut = () => setScale(Math.max(scale - 0.25, 0.25))
  const resetZoom = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  // Zoom com scroll
  const handleWheel = (e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setScale(Math.max(0.25, Math.min(5, scale + delta)))
  }

  // Arrastar imagem
  const handleMouseDown = (e) => {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  if (error) {
    return (
      <div className="viewer-error">
        <p>Erro ao carregar imagem:</p>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="image-viewer">
      {/* Controlos */}
      <div className="image-controls">
        <div className="image-zoom">
          <button onClick={zoomOut} disabled={scale <= 0.25}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35M8 11h6"/>
            </svg>
          </button>
          <span className="zoom-indicator">{Math.round(scale * 100)}%</span>
          <button onClick={zoomIn} disabled={scale >= 5}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35M11 8v6M8 11h6"/>
            </svg>
          </button>
          <button onClick={resetZoom} className="reset-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Container da imagem */}
      <div
        className="image-container"
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
      >
        {loading && (
          <div className="viewer-loading">
            <div className="spinner"></div>
            <span>A carregar imagem...</span>
          </div>
        )}

        {imageUrl && (
          <img
            src={imageUrl}
            alt={file.name}
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              opacity: loading ? 0 : 1
            }}
            draggable={false}
          />
        )}
      </div>
    </div>
  )
}

export default ImageViewer
