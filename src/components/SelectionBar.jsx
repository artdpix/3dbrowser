import React from 'react'
import { useStoriesStore } from '../store/useStoriesStore'
import '../styles/SelectionBar.css'

function SelectionBar() {
  const {
    editingStory,
    selectedItems,
    finishEditingStory,
    cancelEditingStory
  } = useStoriesStore()

  if (!editingStory) return null

  return (
    <div className="selection-bar slide-up" style={{ '--story-color': editingStory.color }}>
      <div className="selection-info">
        <div className="selection-story">
          <div className="story-indicator" />
          <span>A editar: <strong>{editingStory.name}</strong></span>
        </div>
        <div className="selection-count">
          {selectedItems.length} {selectedItems.length === 1 ? 'item selecionado' : 'itens selecionados'}
        </div>
      </div>

      <div className="selection-hint">
        Clica nos objetos 3D para adicionar/remover da história
      </div>

      <div className="selection-actions">
        <button className="btn-cancel" onClick={cancelEditingStory}>
          Cancelar
        </button>
        <button
          className="btn-save"
          onClick={finishEditingStory}
          style={{ backgroundColor: editingStory.color }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          Guardar ({selectedItems.length})
        </button>
      </div>
    </div>
  )
}

export default SelectionBar
