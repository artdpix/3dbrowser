import { create } from 'zustand'

// Chave para localStorage
const STORAGE_KEY = '3dlibrary-stories'

// Carregar histórias do localStorage
function loadStoriesFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

// Guardar histórias no localStorage
function saveStoriesToStorage(stories) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stories))
  } catch (e) {
    console.error('Erro ao guardar histórias:', e)
  }
}

export const useStoriesStore = create((set, get) => ({
  // Lista de histórias
  stories: loadStoriesFromStorage(),

  // História atualmente selecionada para visualização
  activeStory: null,

  // Modo de edição (selecionar objetos para uma história)
  editingStory: null,
  selectedItems: [],

  // Modal de criação/edição
  isModalOpen: false,
  modalMode: 'create', // 'create' ou 'edit'

  // Ações - Criar história
  createStory: (name, description = '', color = '#6c63ff') => {
    const { stories } = get()
    const newStory = {
      id: Date.now().toString(),
      name,
      description,
      color,
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const updated = [...stories, newStory]
    set({ stories: updated })
    saveStoriesToStorage(updated)

    return newStory
  },

  // Atualizar história
  updateStory: (storyId, updates) => {
    const { stories } = get()
    const updated = stories.map(story =>
      story.id === storyId
        ? { ...story, ...updates, updatedAt: new Date().toISOString() }
        : story
    )

    set({ stories: updated })
    saveStoriesToStorage(updated)
  },

  // Eliminar história
  deleteStory: (storyId) => {
    const { stories, activeStory, editingStory } = get()
    const updated = stories.filter(story => story.id !== storyId)

    set({
      stories: updated,
      activeStory: activeStory?.id === storyId ? null : activeStory,
      editingStory: editingStory?.id === storyId ? null : editingStory
    })
    saveStoriesToStorage(updated)
  },

  // Definir história ativa (para visualização)
  setActiveStory: (story) => set({ activeStory: story }),

  // Voltar à biblioteca principal
  exitStoryView: () => set({ activeStory: null }),

  // Começar a editar uma história (modo seleção)
  startEditingStory: (story) => {
    set({
      editingStory: story,
      selectedItems: story.items.map(item => item.id)
    })
  },

  // Terminar edição
  finishEditingStory: () => {
    const { editingStory, selectedItems, stories } = get()

    if (editingStory) {
      // Guardar os items selecionados na história
      const updated = stories.map(story =>
        story.id === editingStory.id
          ? {
              ...story,
              items: selectedItems,
              updatedAt: new Date().toISOString()
            }
          : story
      )

      set({
        stories: updated,
        editingStory: null,
        selectedItems: []
      })
      saveStoriesToStorage(updated)
    } else {
      set({ editingStory: null, selectedItems: [] })
    }
  },

  // Cancelar edição
  cancelEditingStory: () => {
    set({ editingStory: null, selectedItems: [] })
  },

  // Toggle seleção de um item
  toggleItemSelection: (itemId) => {
    const { selectedItems } = get()
    const isSelected = selectedItems.includes(itemId)

    set({
      selectedItems: isSelected
        ? selectedItems.filter(id => id !== itemId)
        : [...selectedItems, itemId]
    })
  },

  // Verificar se um item está selecionado
  isItemSelected: (itemId) => {
    return get().selectedItems.includes(itemId)
  },

  // Modal
  openModal: (mode = 'create', story = null) => {
    set({
      isModalOpen: true,
      modalMode: mode,
      editingStory: story
    })
  },

  closeModal: () => {
    set({ isModalOpen: false })
  },

  // Obter items de uma história (com dados completos dos ficheiros)
  getStoryItems: (storyId, allFiles) => {
    const { stories } = get()
    const story = stories.find(s => s.id === storyId)
    if (!story) return []

    return story.items
      .map(itemId => allFiles.find(f => f.id === itemId))
      .filter(Boolean)
  }
}))
