import { create } from 'zustand'

export const useStore = create((set, get) => ({
  // Estado da biblioteca
  libraryPath: null,
  files: [],
  filteredFiles: [],

  // Filtros
  searchQuery: '',
  activeFilter: 'all', // 'all', 'pdf', 'audio', 'video', 'image'

  // Ficheiro selecionado
  selectedFile: null,

  // Paginação
  currentPage: 0,
  itemsPerPage: 50,

  // Ações
  setLibraryPath: (path) => set({ libraryPath: path }),

  setFiles: (files) => {
    set({ files, filteredFiles: files, currentPage: 0 })
  },

  setSearchQuery: (query) => {
    const { files, activeFilter } = get()
    set({
      searchQuery: query,
      filteredFiles: filterFiles(files, query, activeFilter),
      currentPage: 0
    })
  },

  setActiveFilter: (filter) => {
    const { files, searchQuery } = get()
    set({
      activeFilter: filter,
      filteredFiles: filterFiles(files, searchQuery, filter),
      currentPage: 0
    })
  },

  selectFile: (file) => set({ selectedFile: file }),

  closeViewer: () => set({ selectedFile: null }),

  nextPage: () => {
    const { currentPage, filteredFiles, itemsPerPage } = get()
    const maxPage = Math.floor(filteredFiles.length / itemsPerPage)
    if (currentPage < maxPage) {
      set({ currentPage: currentPage + 1 })
    }
  },

  prevPage: () => {
    const { currentPage } = get()
    if (currentPage > 0) {
      set({ currentPage: currentPage - 1 })
    }
  },

  setPage: (page) => set({ currentPage: page }),

  // Obter ficheiros da página atual
  getCurrentPageFiles: () => {
    const { filteredFiles, currentPage, itemsPerPage } = get()
    const start = currentPage * itemsPerPage
    return filteredFiles.slice(start, start + itemsPerPage)
  },

  // Estatísticas
  getStats: () => {
    const { files } = get()
    return {
      total: files.length,
      pdf: files.filter(f => f.type === 'pdf').length,
      audio: files.filter(f => f.type === 'audio').length,
      video: files.filter(f => f.type === 'video').length,
      image: files.filter(f => f.type === 'image').length
    }
  }
}))

// Função auxiliar para filtrar ficheiros
function filterFiles(files, query, filter) {
  return files.filter(file => {
    // Filtro por tipo
    if (filter !== 'all' && file.type !== filter) {
      return false
    }

    // Filtro por pesquisa
    if (query) {
      const searchLower = query.toLowerCase()
      return (
        file.name.toLowerCase().includes(searchLower) ||
        file.relativePath.toLowerCase().includes(searchLower)
      )
    }

    return true
  })
}
