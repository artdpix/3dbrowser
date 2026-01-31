import React, { useState, useEffect, useRef } from 'react'
import '../../styles/VideoPlayer.css'

function VideoPlayer({ file }) {
  const videoRef = useRef()
  const containerRef = useRef()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [videoUrl, setVideoUrl] = useState(null)

  let hideControlsTimeout = useRef()

  // Obter URL do ficheiro (como Data URL)
  useEffect(() => {
    async function loadVideo() {
      try {
        if (window.electronAPI) {
          const result = await window.electronAPI.readFileAsDataUrl(file.path)
          if (!result.success) {
            throw new Error(result.error)
          }
          setVideoUrl(result.dataUrl)
        } else {
          throw new Error('Video player requires Electron')
        }
      } catch (err) {
        setError(err.message)
        setLoading(false)
      }
    }
    loadVideo()
  }, [file.path])

  // Event handlers
  const handleLoadedMetadata = () => {
    setDuration(videoRef.current.duration)
    setLoading(false)
  }

  const handleTimeUpdate = () => {
    setCurrentTime(videoRef.current.currentTime)
  }

  const handleError = () => {
    setError('Erro ao carregar ficheiro de vídeo')
    setLoading(false)
  }

  const handleEnded = () => {
    setIsPlaying(false)
  }

  // Controlos
  const togglePlay = () => {
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (e) => {
    const rect = e.target.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const time = percent * duration
    videoRef.current.currentTime = time
    setCurrentTime(time)
  }

  const handleVolumeChange = (e) => {
    const vol = parseFloat(e.target.value)
    setVolume(vol)
    videoRef.current.volume = vol
  }

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Auto-hide controls
  const handleMouseMove = () => {
    setShowControls(true)
    clearTimeout(hideControlsTimeout.current)
    if (isPlaying) {
      hideControlsTimeout.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }
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
        <p>Erro ao carregar vídeo:</p>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div
      className="video-player"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Vídeo element */}
      {videoUrl && (
        <video
          ref={videoRef}
          src={videoUrl}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onError={handleError}
          onEnded={handleEnded}
          onClick={togglePlay}
          className="video-element"
        />
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="video-loading">
          <div className="spinner"></div>
          <span>A carregar vídeo...</span>
        </div>
      )}

      {/* Play overlay */}
      {!loading && !isPlaying && (
        <div className="video-play-overlay" onClick={togglePlay}>
          <div className="play-button-large">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      )}

      {/* Controlos */}
      <div className={`video-controls ${showControls ? 'visible' : ''}`}>
        {/* Barra de progresso */}
        <div className="video-progress" onClick={handleSeek}>
          <div
            className="progress-fill"
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>

        <div className="controls-row">
          {/* Play/Pause */}
          <button className="control-btn" onClick={togglePlay}>
            {isPlaying ? (
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

          {/* Tempo */}
          <span className="time-display">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          {/* Espaçador */}
          <div className="spacer"></div>

          {/* Volume */}
          <div className="volume-control">
            <button className="control-btn" onClick={() => setVolume(volume > 0 ? 0 : 1)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                {volume > 0 && <path d="M15.54 8.46a5 5 0 010 7.07"/>}
                {volume > 0.5 && <path d="M19.07 4.93a10 10 0 010 14.14"/>}
              </svg>
            </button>
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

          {/* Fullscreen */}
          <button className="control-btn" onClick={toggleFullscreen}>
            {isFullscreen ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default VideoPlayer
