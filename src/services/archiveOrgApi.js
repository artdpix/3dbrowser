/**
 * Serviço para interagir com a API do Internet Archive (archive.org)
 */

const BASE_URL = 'https://archive.org'

/**
 * Pesquisar items no archive.org
 * @param {string} query - Termo de pesquisa
 * @param {Object} options - Opções de pesquisa
 * @returns {Promise<Array>} - Lista de items encontrados
 */
export async function searchArchive(query, options = {}) {
  const {
    rows = 20,
    page = 1,
    mediatype = null, // 'texts', 'audio', 'movies', 'image'
    sort = 'downloads desc'
  } = options

  try {
    // Construir query string
    let searchQuery = query

    // Filtrar por tipo de media se especificado
    if (mediatype) {
      searchQuery = `${query} AND mediatype:${mediatype}`
    }

    const params = new URLSearchParams({
      q: searchQuery,
      output: 'json',
      rows: rows.toString(),
      page: page.toString(),
      sort
    })

    const response = await fetch(`${BASE_URL}/advancedsearch.php?${params}`)

    if (!response.ok) {
      throw new Error(`Erro na pesquisa: ${response.status}`)
    }

    const data = await response.json()

    // Mapear resultados para formato da nossa app
    return {
      items: (data.response?.docs || []).map(doc => mapArchiveItem(doc)),
      total: data.response?.numFound || 0,
      page,
      totalPages: Math.ceil((data.response?.numFound || 0) / rows)
    }
  } catch (error) {
    console.error('Erro ao pesquisar archive.org:', error)
    throw error
  }
}

/**
 * Obter detalhes de um item específico
 * @param {string} identifier - ID do item no archive.org
 * @returns {Promise<Object>} - Detalhes do item
 */
export async function getArchiveItem(identifier) {
  try {
    const response = await fetch(`${BASE_URL}/metadata/${identifier}`)

    if (!response.ok) {
      throw new Error(`Erro ao obter item: ${response.status}`)
    }

    const data = await response.json()
    return mapArchiveItemDetails(data)
  } catch (error) {
    console.error('Erro ao obter item do archive.org:', error)
    throw error
  }
}

/**
 * Mapear item do archive.org para formato da nossa app
 */
function mapArchiveItem(doc) {
  const mediatype = doc.mediatype || 'texts'
  const type = mapMediaType(mediatype)

  return {
    id: `archive_${doc.identifier}`,
    archiveId: doc.identifier,
    name: doc.title || doc.identifier,
    description: doc.description || '',
    type,
    mediatype,
    isExternal: true,
    source: 'archive.org',
    creator: Array.isArray(doc.creator) ? doc.creator.join(', ') : doc.creator,
    date: doc.date || doc.year,
    downloads: doc.downloads || 0,
    thumbnail: `${BASE_URL}/services/img/${doc.identifier}`,
    url: `${BASE_URL}/details/${doc.identifier}`,
    // Campos adicionais para compatibilidade
    path: null,
    size: null,
    modified: null
  }
}

/**
 * Mapear detalhes completos de um item
 */
function mapArchiveItemDetails(data) {
  const metadata = data.metadata || {}
  const files = data.files || []
  const mediatype = metadata.mediatype || 'texts'
  const type = mapMediaType(mediatype)

  // Encontrar ficheiro principal
  const mainFile = findMainFile(files, type)

  return {
    id: `archive_${metadata.identifier}`,
    archiveId: metadata.identifier,
    name: metadata.title || metadata.identifier,
    description: metadata.description || '',
    type,
    mediatype,
    isExternal: true,
    source: 'archive.org',
    creator: Array.isArray(metadata.creator) ? metadata.creator.join(', ') : metadata.creator,
    date: metadata.date || metadata.year,
    subject: metadata.subject,
    collection: metadata.collection,
    thumbnail: `${BASE_URL}/services/img/${metadata.identifier}`,
    url: `${BASE_URL}/details/${metadata.identifier}`,
    // URL do ficheiro principal para reprodução
    streamUrl: mainFile ? `${BASE_URL}/download/${metadata.identifier}/${mainFile.name}` : null,
    embedUrl: getEmbedUrl(metadata.identifier, type),
    files: files.map(f => ({
      name: f.name,
      format: f.format,
      size: f.size,
      url: `${BASE_URL}/download/${metadata.identifier}/${f.name}`
    })),
    // Campos para compatibilidade
    path: null,
    size: null,
    modified: null
  }
}

/**
 * Mapear tipo de media do archive.org para tipo da nossa app
 */
function mapMediaType(mediatype) {
  const typeMap = {
    texts: 'pdf',
    audio: 'audio',
    movies: 'video',
    image: 'image',
    etree: 'audio',
    software: 'pdf',
    data: 'pdf'
  }
  return typeMap[mediatype] || 'pdf'
}

/**
 * Encontrar ficheiro principal para reprodução
 */
function findMainFile(files, type) {
  // Prioridades por tipo
  const priorities = {
    pdf: ['.pdf'],
    audio: ['.mp3', '.ogg', '.flac', '.wav'],
    video: ['.mp4', '.ogv', '.webm'],
    image: ['.jpg', '.jpeg', '.png', '.gif']
  }

  const exts = priorities[type] || priorities.pdf

  for (const ext of exts) {
    const file = files.find(f =>
      f.name && f.name.toLowerCase().endsWith(ext) &&
      f.source !== 'derivative' // Preferir ficheiros originais
    )
    if (file) return file
  }

  // Tentar encontrar qualquer ficheiro com as extensões
  for (const ext of exts) {
    const file = files.find(f => f.name && f.name.toLowerCase().endsWith(ext))
    if (file) return file
  }

  return null
}

/**
 * Obter URL de embed para visualização
 */
function getEmbedUrl(identifier, type) {
  switch (type) {
    case 'pdf':
      return `${BASE_URL}/stream/${identifier}/${identifier}_djvu.txt`
    case 'audio':
    case 'video':
      return `${BASE_URL}/embed/${identifier}`
    default:
      return null
  }
}

/**
 * Pesquisar por assunto/subject
 */
export async function searchBySubject(subject, options = {}) {
  return searchArchive(`subject:"${subject}"`, options)
}

/**
 * Pesquisar por coleção
 */
export async function searchByCollection(collection, options = {}) {
  return searchArchive(`collection:${collection}`, options)
}

/**
 * Obter coleções populares
 */
export function getPopularCollections() {
  return [
    { id: 'opensource_audio', name: 'Open Source Audio', mediatype: 'audio' },
    { id: 'opensource_movies', name: 'Open Source Movies', mediatype: 'movies' },
    { id: 'texts', name: 'Texts', mediatype: 'texts' },
    { id: 'image', name: 'Images', mediatype: 'image' },
    { id: 'librivoxaudio', name: 'LibriVox', mediatype: 'audio' },
    { id: 'prelinger', name: 'Prelinger Archives', mediatype: 'movies' },
    { id: 'gutenberg', name: 'Project Gutenberg', mediatype: 'texts' }
  ]
}
