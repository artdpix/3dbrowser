import React, { useState, useEffect } from 'react'
import { useStoriesStore } from '../store/useStoriesStore'
import '../styles/StoryModal.css'

const PRESET_COLORS = [
  '#6c63ff', // Roxo
  '#ff6b6b', // Vermelho
  '#4ecdc4', // Turquesa
  '#ffd93d', // Amarelo
  '#a855f7', // Violeta
  '#22c55e', // Verde
  '#f97316', // Laranja
  '#ec4899', // Rosa
  '#06b6d4', // Ciano
  '#8b5cf6'  // Índigo
]

function StoryModal() {
  const {
    isModalOpen,
    modalMode,
    editingStory,
    closeModal,
    createStory,
    updateStory
  } = useStoriesStore()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])

  // Preencher campos quando a editar
  useEffect(() => {
    if (modalMode === 'edit' && editingStory) {
      setName(editingStory.name)
      setDescription(editingStory.description || '')
      setColor(editingStory.color || PRESET_COLORS[0])
    } else {
      setName('')
      setDescription('')
      setColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)])
    }
  }, [modalMode, editingStory, isModalOpen])

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!name.trim()) return

    if (modalMode === 'create') {
      createStory(name.trim(), description.trim(), color)
    } else if (editingStory) {
      updateStory(editingStory.id, {
        name: name.trim(),
        description: description.trim(),
        color
      })
    }

    closeModal()
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      closeModal()
    }
  }

  if (!isModalOpen) return null

  return (
    <div className="story-modal-overlay fade-in" onClick={handleOverlayClick}>
      <div className="story-modal slide-up">
        <div className="story-modal-header">
          <h2>{modalMode === 'create' ? 'Nova História' : 'Editar História'}</h2>
          <button className="modal-close-btn" onClick={closeModal}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="story-name">Nome</label>
            <input
              id="story-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome da história..."
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="story-description">Descrição (opcional)</label>
            <textarea
              id="story-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreve a tua história..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Cor</label>
            <div className="color-picker">
              {PRESET_COLORS.map(presetColor => (
                <button
                  key={presetColor}
                  type="button"
                  className={`color-option ${color === presetColor ? 'selected' : ''}`}
                  style={{ backgroundColor: presetColor }}
                  onClick={() => setColor(presetColor)}
                />
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={closeModal}>
              Cancelar
            </button>
            <button type="submit" className="btn-submit" style={{ backgroundColor: color }}>
              {modalMode === 'create' ? 'Criar História' : 'Guardar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default StoryModal
