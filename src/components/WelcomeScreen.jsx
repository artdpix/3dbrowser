import React from 'react'
import '../styles/WelcomeScreen.css'

function WelcomeScreen({ onSelectFolder, loading, error }) {
  return (
    <div className="welcome-screen">
      <div className="welcome-content slide-up">
        <div className="welcome-icon">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="20" width="25" height="60" rx="2" fill="#6c63ff" opacity="0.8"/>
            <rect x="40" y="30" width="25" height="50" rx="2" fill="#ff6b6b" opacity="0.8"/>
            <rect x="70" y="25" width="20" height="55" rx="2" fill="#4ecdc4" opacity="0.8"/>
            <circle cx="50" cy="50" r="45" stroke="#6c63ff" strokeWidth="2" strokeDasharray="8 4"/>
          </svg>
        </div>

        <h1>3D Library Viewer</h1>
        <p className="welcome-description">
          Explora a tua biblioteca multimédia num ambiente 3D interativo.
          <br />
          Suporta PDFs, ficheiros de áudio e vídeo.
        </p>

        {error && (
          <div className="welcome-error">
            {error}
          </div>
        )}

        <button
          className="select-folder-btn"
          onClick={onSelectFolder}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="btn-spinner"></span>
              A carregar...
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
              </svg>
              Selecionar Pasta da Biblioteca
            </>
          )}
        </button>

        <div className="welcome-features">
          <div className="feature">
            <span className="feature-icon pdf">PDF</span>
            <span>Documentos</span>
          </div>
          <div className="feature">
            <span className="feature-icon audio">MP3</span>
            <span>Áudio</span>
          </div>
          <div className="feature">
            <span className="feature-icon video">MP4</span>
            <span>Vídeo</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WelcomeScreen
