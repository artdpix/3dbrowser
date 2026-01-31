import React, { useState, useCallback } from 'react'
import { searchArchive, getArchiveItem } from '../services/archiveOrgApi'
import { useStoriesStore } from '../store/useStoriesStore'
import '../styles/ArchiveSearch.css'

// Ícones SVG
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
)

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
)

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14M5 12h14" />
  </svg>
)

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

const LoadingSpinner = () => (
  <div className="loading-spinner">
    <div className="spinner"></div>
  </div>
)

// Filtros de tipo de media
const MEDIA_FILTERS = [
  { id: null, label: 'Todos', icon: '📚' },
  { id: 'texts', label: 'Textos', icon: '📄' },
  { id: 'audio', label: 'Áudio', icon: '🎵' },
  { id: 'movies', label: 'Vídeos', icon: '🎬' },
  { id: 'image', label: 'Imagens', icon: '🖼️' }
]

function ArchiveSearch({ isOpen, onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedMedia, setSelectedMedia] = useState(null)
  const [page, setPage] = useState(1)
  const [addedItems, setAddedItems] = useState(new Set())

  const { editingStory, selectedItems, toggleItemSelection, addExternalItem } = useStoriesStore()

  const handleSearch = useCallback(async (newPage = 1) => {
    if (!query.trim()) return

    setLoading(true)
    setError(null)

    try {
      const data = await searchArchive(query, {
        page: newPage,
        rows: 12,
        mediatype: selectedMedia
      })
      setResults(data)
      setPage(newPage)
    } catch (err) {
      setError('Erro ao pesquisar. Tenta novamente.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [query, selectedMedia])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch(1)
    }
  }

  const handleAddToStory = async (item) => {
    if (!editingStory) return

    try {
      // Obter detalhes completos do item
      const details = await getArchiveItem(item.archiveId)

      // Adicionar ao store
      addExternalItem(details)
      toggleItemSelection(details.id)

      // Marcar como adicionado
      setAddedItems(prev => new Set([...prev, item.id]))
    } catch (err) {
      console.error('Erro ao adicionar item:', err)
    }
  }

  const isItemAdded = (itemId) => {
    return addedItems.has(itemId) || selectedItems.includes(itemId)
  }

  if (!isOpen) return null

  return (
    <div className="archive-search-overlay" onClick={onClose}>
      <div className="archive-search-modal" onClick={e => e.stopPropagation()}>
        <div className="archive-search-header">
          <h2>
            <span className="archive-logo">📚</span>
            Pesquisar no Internet Archive
          </h2>
          <button className="close-btn" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="archive-search-content">
          {/* Barra de pesquisa */}
          <div className="search-bar">
            <div className="search-input-wrapper">
              <SearchIcon />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pesquisar por título, autor, assunto..."
                autoFocus
              />
              {query && (
                <button className="clear-btn" onClick={() => setQuery('')}>
                  <CloseIcon />
                </button>
              )}
            </div>
            <button
              className="search-btn"
              onClick={() => handleSearch(1)}
              disabled={loading || !query.trim()}
            >
              {loading ? <LoadingSpinner /> : 'Pesquisar'}
            </button>
          </div>

          {/* Filtros de tipo */}
          <div className="media-filters">
            {MEDIA_FILTERS.map(filter => (
              <button
                key={filter.id || 'all'}
                className={`filter-chip ${selectedMedia === filter.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedMedia(filter.id)
                  if (results) handleSearch(1)
                }}
              >
                <span>{filter.icon}</span>
                {filter.label}
              </button>
            ))}
          </div>

          {/* Mensagem se estiver em modo de edição */}
          {editingStory && (
            <div className="editing-notice" style={{ borderColor: editingStory.color }}>
              <span>A adicionar itens à história:</span>
              <strong style={{ color: editingStory.color }}>{editingStory.name}</strong>
            </div>
          )}

          {/* Erro */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Resultados */}
          {results && (
            <div className="results-section">
              <div className="results-header">
                <span>{results.total.toLocaleString()} resultados encontrados</span>
                <span>Página {results.page} de {results.totalPages}</span>
              </div>

              <div className="results-grid">
                {results.items.map(item => (
                  <div key={item.id} className={`result-card ${isItemAdded(item.id) ? 'added' : ''}`}>
                    <div className="result-thumbnail">
                      <img
                        src={item.thumbnail}
                        alt={item.name}
                        onError={e => {
                          e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%231a1a2e" width="100" height="100"/><text fill="%23666" x="50" y="55" text-anchor="middle" font-size="30">📄</text></svg>'
                        }}
                      />
                      <span className={`type-badge ${item.type}`}>
                        {item.mediatype}
                      </span>
                    </div>
                    <div className="result-info">
                      <h4 title={item.name}>{item.name}</h4>
                      {item.creator && (
                        <p className="creator">{item.creator}</p>
                      )}
                      {item.date && (
                        <p className="date">{item.date}</p>
                      )}
                    </div>
                    <div className="result-actions">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="view-btn"
                      >
                        Ver no Archive
                      </a>
                      {editingStory && (
                        <button
                          className={`add-btn ${isItemAdded(item.id) ? 'added' : ''}`}
                          onClick={() => handleAddToStory(item)}
                          disabled={isItemAdded(item.id)}
                        >
                          {isItemAdded(item.id) ? (
                            <>
                              <CheckIcon />
                              Adicionado
                            </>
                          ) : (
                            <>
                              <PlusIcon />
                              Adicionar
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Paginação */}
              {results.totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => handleSearch(page - 1)}
                    disabled={page <= 1 || loading}
                  >
                    Anterior
                  </button>
                  <span>Página {page} de {results.totalPages}</span>
                  <button
                    onClick={() => handleSearch(page + 1)}
                    disabled={page >= results.totalPages || loading}
                  >
                    Próxima
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Estado inicial */}
          {!results && !loading && !error && (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>Pesquisa no Internet Archive</h3>
              <p>
                Pesquisa milhões de livros, áudios, vídeos e imagens gratuitos.
                {!editingStory && (
                  <><br /><strong>Dica:</strong> Cria ou edita uma história para adicionar itens.</>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ArchiveSearch
