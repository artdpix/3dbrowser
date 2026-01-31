import React from 'react'
import { useStore } from '../store/useStore'
import { useStoriesStore } from '../store/useStoriesStore'
import StoriesList from './StoriesList'
import '../styles/Sidebar.css'

function Sidebar({ onChangeLibrary }) {
  const {
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    filteredFiles,
    currentPage,
    itemsPerPage,
    nextPage,
    prevPage,
    getStats
  } = useStore()

  const { activeStory, exitStoryView, editingStory, openArchiveSearch } = useStoriesStore()

  const stats = getStats()
  const totalPages = Math.ceil(filteredFiles.length / itemsPerPage)

  const filters = [
    { key: 'all', label: 'Todos', count: stats.total, color: '#6c63ff' },
    { key: 'pdf', label: 'PDFs', count: stats.pdf, color: '#ff6b6b' },
    { key: 'audio', label: 'Áudio', count: stats.audio, color: '#4ecdc4' },
    { key: 'video', label: 'Vídeo', count: stats.video, color: '#ffd93d' },
    { key: 'image', label: 'Imagens', count: stats.image, color: '#a855f7' }
  ]

  // Se estiver a ver uma história, mostrar interface diferente
  if (activeStory) {
    return (
      <aside className="sidebar">
        <div className="sidebar-header">
          <button className="back-btn" onClick={exitStoryView}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Voltar
          </button>
        </div>

        <div className="story-view-info" style={{ '--story-color': activeStory.color }}>
          <div className="story-color-bar" />
          <h2>{activeStory.name}</h2>
          {activeStory.description && (
            <p className="story-description">{activeStory.description}</p>
          )}
          <div className="story-meta">
            <span>{activeStory.items.length} itens</span>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="instructions">
            <p><strong>Controlos:</strong></p>
            <p>Arrastar: Rodar vista</p>
            <p>Scroll: Zoom</p>
            <p>Clique: Abrir ficheiro</p>
          </div>
        </div>
      </aside>
    )
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>3D Library</h2>
        <button className="change-library-btn" onClick={onChangeLibrary} title="Mudar biblioteca">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
          </svg>
        </button>
      </div>

      {/* Pesquisa */}
      <div className="search-container">
        <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          type="text"
          placeholder="Pesquisar ficheiros..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        {searchQuery && (
          <button className="clear-search" onClick={() => setSearchQuery('')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="filters">
        {filters.map(filter => (
          <button
            key={filter.key}
            className={`filter-btn ${activeFilter === filter.key ? 'active' : ''}`}
            onClick={() => setActiveFilter(filter.key)}
            style={{ '--filter-color': filter.color }}
          >
            <span className="filter-label">{filter.label}</span>
            <span className="filter-count">{filter.count}</span>
          </button>
        ))}
      </div>

      {/* Botão Archive.org */}
      <button className="archive-btn" onClick={openArchiveSearch}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
        </svg>
        <span>Pesquisar no Archive.org</span>
        {editingStory && <span className="badge">Adicionar</span>}
      </button>

      {/* Resultados */}
      <div className="results-info">
        <span>{filteredFiles.length} ficheiro{filteredFiles.length !== 1 ? 's' : ''}</span>
        {filteredFiles.length > itemsPerPage && (
          <span className="page-info">
            Página {currentPage + 1} de {totalPages}
          </span>
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            onClick={prevPage}
            disabled={currentPage === 0}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <span className="page-numbers">
            {currentPage + 1} / {totalPages}
          </span>
          <button
            className="page-btn"
            onClick={nextPage}
            disabled={currentPage >= totalPages - 1}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>
      )}

      {/* Lista de Histórias */}
      <StoriesList />

      {/* Instruções */}
      <div className="sidebar-footer">
        <div className="instructions">
          <p><strong>Controlos:</strong></p>
          <p>Arrastar: Rodar vista</p>
          <p>Scroll: Zoom</p>
          <p>Clique: Abrir ficheiro</p>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
