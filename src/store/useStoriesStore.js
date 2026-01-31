import { create } from 'zustand'

// Chaves para localStorage
const STORAGE_KEY = '3dlibrary-stories'
const EXTERNAL_ITEMS_KEY = '3dlibrary-external-items'

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

// Carregar itens externos do localStorage
function loadExternalItemsFromStorage() {
  try {
    const saved = localStorage.getItem(EXTERNAL_ITEMS_KEY)
    return saved ? JSON.parse(saved) : {}
  } catch {
    return {}
  }
}

// Guardar itens externos no localStorage
function saveExternalItemsToStorage(items) {
  try {
    localStorage.setItem(EXTERNAL_ITEMS_KEY, JSON.stringify(items))
  } catch (e) {
    console.error('Erro ao guardar itens externos:', e)
  }
}

export const useStoriesStore = create((set, get) => ({
  // Lista de histórias
  stories: loadStoriesFromStorage(),

  // Itens externos (do archive.org) - mapa por ID
  externalItems: loadExternalItemsFromStorage(),

  // História atualmente selecionada para visualização
  activeStory: null,

  // Modo de edição (selecionar objetos para uma história)
  editingStory: null,
  selectedItems: [],

  // Modal de criação/edição
  isModalOpen: false,
  modalMode: 'create', // 'create' ou 'edit'

  // Estado da pesquisa do Archive
  isArchiveSearchOpen: false,

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

  // Abrir/fechar pesquisa do Archive
  openArchiveSearch: () => set({ isArchiveSearchOpen: true }),
  closeArchiveSearch: () => set({ isArchiveSearchOpen: false }),

  // Adicionar item externo (do archive.org)
  addExternalItem: (item) => {
    const { externalItems } = get()
    const updated = { ...externalItems, [item.id]: item }
    set({ externalItems: updated })
    saveExternalItemsToStorage(updated)
  },

  // Obter item externo por ID
  getExternalItem: (itemId) => {
    const { externalItems } = get()
    return externalItems[itemId] || null
  },

  // Remover item externo
  removeExternalItem: (itemId) => {
    const { externalItems } = get()
    const updated = { ...externalItems }
    delete updated[itemId]
    set({ externalItems: updated })
    saveExternalItemsToStorage(updated)
  },

  // Obter items de uma história (com dados completos dos ficheiros e itens externos)
  getStoryItems: (storyId, allFiles) => {
    const { stories, externalItems } = get()
    const story = stories.find(s => s.id === storyId)
    if (!story) return []

    return story.items
      .map(itemId => {
        // Primeiro tentar encontrar nos ficheiros locais
        const localFile = allFiles.find(f => f.id === itemId)
        if (localFile) return localFile

        // Se não encontrar, procurar nos itens externos
        return externalItems[itemId] || null
      })
      .filter(Boolean)
  },

  // Obter todos os itens externos como array
  getAllExternalItems: () => {
    const { externalItems } = get()
    return Object.values(externalItems)
  }
}))
