import React from 'react'
import { useStoriesStore } from '../store/useStoriesStore'
import '../styles/StoriesList.css'

function StoriesList() {
  const {
    stories,
    activeStory,
    editingStory,
    setActiveStory,
    openModal,
    startEditingStory,
    deleteStory
  } = useStoriesStore()

  const handleDelete = (e, story) => {
    e.stopPropagation()
    if (confirm(`Tens a certeza que queres eliminar "${story.name}"?`)) {
      deleteStory(story.id)
    }
  }

  const handleEdit = (e, story) => {
    e.stopPropagation()
    openModal('edit', story)
  }

  const handleAddItems = (e, story) => {
    e.stopPropagation()
    startEditingStory(story)
  }

  return (
    <div className="stories-list">
      <div className="stories-header">
        <h3>Histórias</h3>
        <button
          className="create-story-btn"
          onClick={() => openModal('create')}
          title="Criar nova história"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      {stories.length === 0 ? (
        <div className="stories-empty">
          <p>Nenhuma história criada</p>
          <button onClick={() => openModal('create')}>
            Criar primeira história
          </button>
        </div>
      ) : (
        <div className="stories-items">
          {stories.map(story => (
            <div
              key={story.id}
              className={`story-item ${activeStory?.id === story.id ? 'active' : ''} ${editingStory?.id === story.id ? 'editing' : ''}`}
              onClick={() => setActiveStory(story)}
              style={{ '--story-color': story.color }}
            >
              <div className="story-color-indicator" />
              <div className="story-info">
                <span className="story-name">{story.name}</span>
                <span className="story-count">
                  {story.items.length} {story.items.length === 1 ? 'item' : 'itens'}
                </span>
              </div>
              <div className="story-actions">
                <button
                  className="story-action-btn"
                  onClick={(e) => handleAddItems(e, story)}
                  title="Adicionar/remover itens"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                </button>
                <button
                  className="story-action-btn"
                  onClick={(e) => handleEdit(e, story)}
                  title="Editar história"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  className="story-action-btn delete"
                  onClick={(e) => handleDelete(e, story)}
                  title="Eliminar história"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default StoriesList
