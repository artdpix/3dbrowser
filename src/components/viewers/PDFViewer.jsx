import React, { useState, useEffect, useRef } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import '../../styles/PDFViewer.css'

// Configurar worker do PDF.js (usando import local)
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

function PDFViewer({ file }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [scale, setScale] = useState(1.5)
  const [pdfDoc, setPdfDoc] = useState(null)
  const canvasRef = useRef()

  // Para itens externos do archive.org, usar o viewer embutido deles
  if (file.isExternal && file.archiveId) {
    return (
      <div className="pdf-viewer pdf-viewer-external">
        <iframe
          src={`https://archive.org/embed/${file.archiveId}`}
          title={file.name}
          className="archive-embed"
          allowFullScreen
        />
      </div>
    )
  }

  // Carregar PDF local
  useEffect(() => {
    let cancelled = false

    async function loadPDF() {
      setLoading(true)
      setError(null)

      try {
        let pdfData

        if (window.electronAPI) {
          // No Electron, ler o ficheiro local
          const result = await window.electronAPI.readFile(file.path)
          if (!result.success) {
            throw new Error(result.error)
          }
          // Converter base64 para Uint8Array
          const binaryString = atob(result.data)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          pdfData = { data: bytes }
        } else {
          throw new Error('PDF viewer requires Electron')
        }

        const pdf = await pdfjsLib.getDocument(pdfData).promise

        if (!cancelled) {
          setPdfDoc(pdf)
          setNumPages(pdf.numPages)
          setCurrentPage(1)
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message)
          setLoading(false)
        }
      }
    }

    loadPDF()

    return () => {
      cancelled = true
    }
  }, [file.path])

  // Renderizar página
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return

    let cancelled = false

    async function renderPage() {
      try {
        const page = await pdfDoc.getPage(currentPage)
        const viewport = page.getViewport({ scale })

        const canvas = canvasRef.current
        const context = canvas.getContext('2d')

        canvas.height = viewport.height
        canvas.width = viewport.width

        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise
      } catch (err) {
        if (!cancelled) {
          console.error('Error rendering page:', err)
        }
      }
    }

    renderPage()

    return () => {
      cancelled = true
    }
  }, [pdfDoc, currentPage, scale])

  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1)
  }

  const goToNextPage = () => {
    if (currentPage < numPages) setCurrentPage(currentPage + 1)
  }

  const zoomIn = () => setScale(Math.min(scale + 0.25, 3))
  const zoomOut = () => setScale(Math.max(scale - 0.25, 0.5))

  if (loading) {
    return (
      <div className="viewer-loading">
        <div className="spinner"></div>
        <span>A carregar PDF...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="viewer-error">
        <p>Erro ao carregar PDF:</p>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="pdf-viewer">
      {/* Controlos */}
      <div className="pdf-controls">
        <div className="pdf-nav">
          <button onClick={goToPrevPage} disabled={currentPage <= 1}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <span className="page-indicator">
            {currentPage} / {numPages}
          </span>
          <button onClick={goToNextPage} disabled={currentPage >= numPages}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>

        <div className="pdf-zoom">
          <button onClick={zoomOut} disabled={scale <= 0.5}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35M8 11h6"/>
            </svg>
          </button>
          <span className="zoom-indicator">{Math.round(scale * 100)}%</span>
          <button onClick={zoomIn} disabled={scale >= 3}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35M11 8v6M8 11h6"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Canvas do PDF */}
      <div className="pdf-canvas-container">
        <canvas ref={canvasRef} className="pdf-canvas" />
      </div>
    </div>
  )
}

export default PDFViewer
