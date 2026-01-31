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
          {selectedFile.isExternal ? (
            <>
              <span className="file-source">
                <span className="source-badge">Archive.org</span>
                {selectedFile.creator && <span className="creator">{selectedFile.creator}</span>}
              </span>
              <a
                href={selectedFile.url}
                target="_blank"
                rel="noopener noreferrer"
                className="archive-link"
              >
                Ver no Archive.org
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
                </svg>
              </a>
            </>
          ) : (
            <>
              <span className="file-path" title={selectedFile.relativePath}>
                {selectedFile.relativePath}
              </span>
              <span className="file-size">
                {formatFileSize(selectedFile.size)}
              </span>
            </>
          )}
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
