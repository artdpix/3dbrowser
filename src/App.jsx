import React, { useState, useEffect } from 'react'
import { useStore } from './store/useStore'
import { useStoriesStore } from './store/useStoriesStore'
import Scene3D from './components/Scene3D'
import Sidebar from './components/Sidebar'
import Viewer from './components/Viewer'
import WelcomeScreen from './components/WelcomeScreen'
import StoryModal from './components/StoryModal'
import SelectionBar from './components/SelectionBar'
import ArchiveSearch from './components/ArchiveSearch'
import './styles/App.css'

function App() {
  const { libraryPath, files, selectedFile, setLibraryPath, setFiles } = useStore()
  const { isArchiveSearchOpen, closeArchiveSearch } = useStoriesStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Carregar biblioteca guardada
  useEffect(() => {
    const savedPath = localStorage.getItem('libraryPath')
    if (savedPath) {
      loadLibrary(savedPath)
    }
  }, [])

  const loadLibrary = async (folderPath) => {
    if (!window.electronAPI) {
      // Modo de desenvolvimento sem Electron
      setError('A executar em modo web. Usa o Electron para aceder a ficheiros locais.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await window.electronAPI.scanLibrary(folderPath)

      if (result.error) {
        setError(result.error)
        return
      }

      setLibraryPath(folderPath)
      setFiles(result.files)
      localStorage.setItem('libraryPath', folderPath)
    } catch (err) {
      setError('Erro ao carregar biblioteca: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const selectFolder = async () => {
    if (!window.electronAPI) {
      setError('Funcionalidade disponível apenas no Electron')
      return
    }

    const folderPath = await window.electronAPI.selectFolder()
    if (folderPath) {
      loadLibrary(folderPath)
    }
  }

  // Ecrã de boas-vindas se não houver biblioteca
  if (!libraryPath || files.length === 0) {
    return (
      <WelcomeScreen
        onSelectFolder={selectFolder}
        loading={loading}
        error={error}
      />
    )
  }

  return (
    <div className="app">
      <Sidebar onChangeLibrary={selectFolder} />
      <main className="main-content">
        <SelectionBar />
        <Scene3D />
      </main>
      {selectedFile && <Viewer />}
      <StoryModal />
      <ArchiveSearch isOpen={isArchiveSearchOpen} onClose={closeArchiveSearch} />
    </div>
  )
}

export default App
