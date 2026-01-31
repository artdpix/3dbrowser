import React, { useState, useEffect, useRef } from 'react'
import '../../styles/AudioPlayer.css'

function AudioPlayer({ file }) {
  const audioRef = useRef()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [audioUrl, setAudioUrl] = useState(null)

  // Obter URL do ficheiro (como Data URL)
  useEffect(() => {
    async function loadAudio() {
      try {
        if (window.electronAPI) {
          const result = await window.electronAPI.readFileAsDataUrl(file.path)
          if (!result.success) {
            throw new Error(result.error)
          }
          setAudioUrl(result.dataUrl)
        } else {
          throw new Error('Audio player requires Electron')
        }
      } catch (err) {
        setError(err.message)
        setLoading(false)
      }
    }
    loadAudio()
  }, [file.path])

  // Event handlers
  const handleLoadedMetadata = () => {
    setDuration(audioRef.current.duration)
    setLoading(false)
  }

  const handleTimeUpdate = () => {
    setCurrentTime(audioRef.current.currentTime)
  }

  const handleError = () => {
    setError('Erro ao carregar ficheiro de áudio')
    setLoading(false)
  }

  const handleEnded = () => {
    setIsPlaying(false)
    setCurrentTime(0)
  }

  // Controlos
  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (e) => {
    const rect = e.target.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const time = percent * duration
    audioRef.current.currentTime = time
    setCurrentTime(time)
  }

  const handleVolumeChange = (e) => {
    const vol = parseFloat(e.target.value)
    setVolume(vol)
    audioRef.current.volume = vol
  }

  const skip = (seconds) => {
    audioRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds))
  }

  // Formatar tempo
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (error) {
    return (
      <div className="viewer-error">
        <p>Erro ao carregar áudio:</p>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="audio-player">
      {/* Áudio element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onError={handleError}
          onEnded={handleEnded}
        />
      )}

      {/* Visualização */}
      <div className="audio-visual">
        <div className={`audio-disc ${isPlaying ? 'spinning' : ''}`}>
          <div className="disc-inner">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Controlos principais */}
      <div className="audio-controls">
        <button className="skip-btn" onClick={() => skip(-10)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 19l-7-7 7-7M18 19l-7-7 7-7"/>
          </svg>
          <span>10s</span>
        </button>

        <button className="play-btn" onClick={togglePlay} disabled={loading}>
          {loading ? (
            <div className="mini-spinner"></div>
          ) : isPlaying ? (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1"/>
              <rect x="14" y="4" width="4" height="16" rx="1"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>

        <button className="skip-btn" onClick={() => skip(10)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 5l7 7-7 7M6 5l7 7-7 7"/>
          </svg>
          <span>10s</span>
        </button>
      </div>

      {/* Barra de progresso */}
      <div className="audio-progress">
        <span className="time">{formatTime(currentTime)}</span>
        <div className="progress-bar" onClick={handleSeek}>
          <div
            className="progress-fill"
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>
        <span className="time">{formatTime(duration)}</span>
      </div>

      {/* Volume */}
      <div className="audio-volume">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 5L6 9H2v6h4l5 4V5z"/>
          {volume > 0 && <path d="M15.54 8.46a5 5 0 010 7.07"/>}
          {volume > 0.5 && <path d="M19.07 4.93a10 10 0 010 14.14"/>}
        </svg>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={handleVolumeChange}
          className="volume-slider"
        />
      </div>
    </div>
  )
}

export default AudioPlayer
