import React, { useState, useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'
import PDFViewer from './viewers/PDFViewer'
import AudioPlayer from './viewers/AudioPlayer'
import VideoPlayer from './viewers/VideoPlayer'
import ImageViewer from './viewers/ImageViewer'
import '../styles/Viewer.css'

function Viewer() {
  const { selectedFile, closeViewer } = useStore()
  const overlayRef = useRef()

  // Fechar com Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeViewer()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [closeViewer])

  // Fechar ao clicar no overlay
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) {
      closeViewer()
    }
  }

  if (!selectedFile) return null

  const renderViewer = () => {
    switch (selectedFile.type) {
      case 'pdf':
        return <PDFViewer file={selectedFile} />
      case 'audio':
        return <AudioPlayer file={selectedFile} />
      case 'video':
        return <VideoPlayer file={selectedFile} />
      case 'image':
        return <ImageViewer file={selectedFile} />
      default:
        return <div className="viewer-error">Tipo de ficheiro não suportado</div>
    }
  }

  return (
    <div className="viewer-overlay fade-in" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="viewer-container slide-up">
        {/* Header */}
        <div className="viewer-header">
          <div className="viewer-title">
            <span className={`viewer-type-badge ${selectedFile.type}`}>
              {selectedFile.type.toUpperCase()}
            </span>
            <h3>{selectedFile.name}</h3>
          </div>
          <button className="viewer-close" onClick={closeViewer}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Conteúdo */}
        <div className="viewer-content">
          {renderViewer()}
        </div>

        {/* Footer com info */}
        <div className="viewer-footer">
          <span className="file-path" title={selectedFile.relativePath}>
            {selectedFile.relativePath}
          </span>
          <span className="file-size">
            {formatFileSize(selectedFile.size)}
          </span>
        </div>
      </div>
    </div>
  )
}

// Formatar tamanho do ficheiro
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export default Viewer
