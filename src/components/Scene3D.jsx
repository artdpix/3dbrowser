import React, { Suspense, useMemo, useRef, useState, useEffect } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Text, RoundedBox } from '@react-three/drei'
import { useStore } from '../store/useStore'
import { useStoriesStore } from '../store/useStoriesStore'
import { generateThumbnail, getCachedThumbnail } from '../utils/thumbnailGenerator'
import * as THREE from 'three'

// Cores por tipo de ficheiro
const TYPE_COLORS = {
  pdf: '#ff6b6b',
  audio: '#4ecdc4',
  video: '#ffd93d',
  image: '#a855f7'
}

// Ícones simples por tipo
const TYPE_LABELS = {
  pdf: 'PDF',
  audio: 'MP3',
  video: 'MP4',
  image: 'IMG'
}

// Hook para carregar thumbnail
function useThumbnail(file) {
  const [thumbnail, setThumbnail] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadThumbnail() {
      try {
        // Para itens externos (archive.org), usar o thumbnail diretamente
        if (file.isExternal && file.thumbnail) {
          if (!cancelled) {
            setThumbnail(file.thumbnail)
            setLoading(false)
          }
          return
        }

        // Primeiro verificar cache
        const cached = getCachedThumbnail(file.id)
        if (cached) {
          if (!cancelled) {
            setThumbnail(cached)
            setLoading(false)
          }
          return
        }

        // Gerar novo thumbnail
        const thumb = await generateThumbnail(file)
        if (!cancelled) {
          setThumbnail(thumb)
          setLoading(false)
        }
      } catch (error) {
        console.error('Erro ao carregar thumbnail:', error)
        if (!cancelled) {
          setThumbnail(null)
          setLoading(false)
        }
      }
    }

    // Só gerar para tipos que suportam preview (ou itens externos com thumbnail)
    if (file.isExternal || ['image', 'pdf', 'video'].includes(file.type)) {
      loadThumbnail()
    } else {
      setLoading(false)
    }

    return () => {
      cancelled = true
    }
  }, [file.id, file.type, file.isExternal, file.thumbnail])

  return { thumbnail, loading }
}

// Componente para textura do thumbnail
function ThumbnailPlane({ thumbnail, size = [0.85, 0.85], position = [0, 0, 0.05] }) {
  const [texture, setTexture] = useState(null)

  useEffect(() => {
    if (!thumbnail) {
      setTexture(null)
      return
    }

    try {
      const loader = new THREE.TextureLoader()
      loader.load(
        thumbnail,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace
          setTexture(tex)
        },
        undefined,
        (error) => {
          console.error('Erro ao carregar textura:', error)
          setTexture(null)
        }
      )
    } catch (error) {
      console.error('Erro ao criar textura:', error)
      setTexture(null)
    }
  }, [thumbnail])

  if (!texture) return null

  return (
    <mesh position={position}>
      <planeGeometry args={size} />
      <meshBasicMaterial map={texture} />
    </mesh>
  )
}

// Componente para cada item da biblioteca
function LibraryItem({ file, position, onClick, isSelected, isSelectionMode, storyColor }) {
  const meshRef = useRef()
  const [hovered, setHovered] = useState(false)
  const { thumbnail, loading } = useThumbnail(file)

  const color = TYPE_COLORS[file.type] || '#6c63ff'
  const showThumbnail = thumbnail && !loading

  useFrame(() => {
    if (meshRef.current) {
      const targetScale = hovered ? 1.15 : (isSelected ? 1.05 : 1)
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1
      )
      if (hovered) {
        meshRef.current.rotation.y += 0.01
      }
      if (isSelected && !hovered) {
        meshRef.current.rotation.y += 0.005
      }
    }
  })

  const handleClick = (e) => {
    e.stopPropagation()
    onClick(file)
  }

  return (
    <group position={position}>
      {/* Indicador de seleção */}
      {isSelectionMode && isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
          <ringGeometry args={[0.9, 1.1, 32]} />
          <meshBasicMaterial color={storyColor || '#ffd93d'} transparent opacity={0.8} />
        </mesh>
      )}

      <group
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'auto'
        }}
      >
        {file.type === 'pdf' ? (
          // Livro/Documento para PDF
          <group>
            <RoundedBox args={[0.9, 1.2, 0.1]} radius={0.02}>
              <meshStandardMaterial
                color={isSelected ? storyColor : (hovered ? '#ff8888' : '#ffffff')}
                metalness={0.1}
                roughness={0.8}
                emissive={isSelected ? storyColor : '#000'}
                emissiveIntensity={isSelected ? 0.2 : 0}
              />
            </RoundedBox>
            {/* Thumbnail do PDF */}
            {showThumbnail ? (
              <ThumbnailPlane thumbnail={thumbnail} size={[0.75, 1.0]} position={[0, 0, 0.06]} />
            ) : (
              // Placeholder enquanto carrega
              <mesh position={[0, 0, 0.06]}>
                <planeGeometry args={[0.75, 1.0]} />
                <meshStandardMaterial color={loading ? '#e0e0e0' : color} />
              </mesh>
            )}
            {/* Lombada do livro */}
            <mesh position={[-0.45, 0, 0]}>
              <boxGeometry args={[0.05, 1.2, 0.1]} />
              <meshStandardMaterial color={isSelected ? storyColor : color} />
            </mesh>
          </group>
        ) : file.type === 'audio' ? (
          // Disco para áudio (mantém visual original)
          <group>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.5, 0.5, 0.05, 32]} />
              <meshStandardMaterial
                color={isSelected ? storyColor : (hovered ? '#6fefe6' : color)}
                metalness={0.3}
                roughness={0.4}
                emissive={isSelected ? storyColor : '#000'}
                emissiveIntensity={isSelected ? 0.3 : 0}
              />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.15, 0.15, 0.06, 32]} />
              <meshStandardMaterial color="#1a1a2e" />
            </mesh>
            {/* Grooves do disco */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
              <ringGeometry args={[0.2, 0.45, 32]} />
              <meshStandardMaterial color="#333" transparent opacity={0.3} />
            </mesh>
          </group>
        ) : file.type === 'image' ? (
          // Quadro/moldura para imagem
          <group>
            {/* Moldura */}
            <RoundedBox args={[1.1, 1.1, 0.08]} radius={0.02}>
              <meshStandardMaterial
                color={isSelected ? storyColor : (hovered ? '#c084fc' : '#2a2a4e')}
                metalness={0.3}
                roughness={0.5}
              />
            </RoundedBox>
            {/* Conteúdo da imagem */}
            {showThumbnail ? (
              <ThumbnailPlane thumbnail={thumbnail} size={[0.95, 0.95]} position={[0, 0, 0.045]} />
            ) : (
              <mesh position={[0, 0, 0.045]}>
                <planeGeometry args={[0.95, 0.95]} />
                <meshStandardMaterial
                  color={loading ? '#3a3a5e' : color}
                  emissive={hovered ? color : '#000'}
                  emissiveIntensity={hovered ? 0.3 : 0}
                />
              </mesh>
            )}
          </group>
        ) : (
          // Ecrã para vídeo
          <group>
            {/* Monitor/Ecrã */}
            <RoundedBox args={[1.3, 0.9, 0.08]} radius={0.02}>
              <meshStandardMaterial
                color={isSelected ? storyColor : '#1a1a2e'}
                metalness={0.5}
                roughness={0.3}
              />
            </RoundedBox>
            {/* Ecrã com thumbnail */}
            {showThumbnail ? (
              <ThumbnailPlane thumbnail={thumbnail} size={[1.15, 0.75]} position={[0, 0, 0.045]} />
            ) : (
              <mesh position={[0, 0, 0.045]}>
                <planeGeometry args={[1.15, 0.75]} />
                <meshStandardMaterial
                  color={loading ? '#2a2a4e' : color}
                  emissive={hovered ? color : '#000'}
                  emissiveIntensity={hovered ? 0.3 : 0}
                />
              </mesh>
            )}
            {/* Botão de play overlay */}
            {showThumbnail && (
              <mesh position={[0, 0, 0.05]}>
                <circleGeometry args={[0.15, 32]} />
                <meshBasicMaterial color="#000" transparent opacity={0.5} />
              </mesh>
            )}
            {/* Base do monitor */}
            <mesh position={[0, -0.55, 0]}>
              <boxGeometry args={[0.3, 0.15, 0.08]} />
              <meshStandardMaterial color="#1a1a2e" metalness={0.5} />
            </mesh>
          </group>
        )}

        {/* Label do tipo */}
        <Text
          position={[0, -0.9, 0]}
          fontSize={0.12}
          color={isSelected ? '#fff' : '#666'}
          anchorX="center"
          anchorY="middle"
        >
          {TYPE_LABELS[file.type]}
        </Text>
      </group>

      {/* Nome do ficheiro */}
      <Text
        position={[0, 1.0, 0]}
        fontSize={0.11}
        color="#fff"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.4}
        textAlign="center"
      >
        {file.name.length > 18 ? file.name.substring(0, 18) + '...' : file.name}
      </Text>

      {/* Indicador de seleção (checkmark) */}
      {isSelectionMode && isSelected && (
        <group position={[0.65, 0.65, 0.2]}>
          <mesh>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshBasicMaterial color={storyColor || '#22c55e'} />
          </mesh>
        </group>
      )}

      {/* Indicador de hover */}
      {hovered && (
        <pointLight position={[0, 0, 1]} intensity={0.5} color={isSelected ? storyColor : color} distance={3} />
      )}
    </group>
  )
}

// Sala/Galeria
function GalleryRoom({ storyColor }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.1} roughness={0.9} />
      </mesh>

      <mesh position={[0, 5, -15]}>
        <planeGeometry args={[50, 15]} />
        <meshStandardMaterial color="#16213e" metalness={0} roughness={1} />
      </mesh>

      <pointLight position={[0, 8, 0]} intensity={0.5} color="#fff" />
      <pointLight position={[-10, 5, 5]} intensity={0.3} color={storyColor || '#6c63ff'} />
      <pointLight position={[10, 5, 5]} intensity={0.3} color="#4ecdc4" />
    </group>
  )
}

// Componente principal da cena
function Scene() {
  const { getCurrentPageFiles, selectFile, files: allFiles } = useStore()
  const {
    activeStory,
    editingStory,
    selectedItems,
    toggleItemSelection,
    getStoryItems
  } = useStoriesStore()

  const filesToShow = useMemo(() => {
    if (activeStory) {
      return getStoryItems(activeStory.id, allFiles)
    }
    return getCurrentPageFiles()
  }, [activeStory, allFiles, getCurrentPageFiles, getStoryItems])

  const handleItemClick = (file) => {
    if (editingStory) {
      toggleItemSelection(file.id)
    } else {
      selectFile(file)
    }
  }

  const itemPositions = useMemo(() => {
    if (activeStory && filesToShow.length > 0) {
      const radius = Math.max(5, filesToShow.length * 0.8)
      return filesToShow.map((file, index) => {
        const angle = (index / filesToShow.length) * Math.PI * 2 - Math.PI / 2
        return {
          file,
          position: [
            Math.cos(angle) * radius,
            0,
            Math.sin(angle) * radius
          ]
        }
      })
    }

    const cols = 8
    const spacingX = 2.2
    const spacingZ = 2.8
    const startX = -((cols - 1) * spacingX) / 2

    return filesToShow.map((file, index) => {
      const col = index % cols
      const row = Math.floor(index / cols)
      return {
        file,
        position: [
          startX + col * spacingX,
          0,
          -row * spacingZ
        ]
      }
    })
  }, [filesToShow, activeStory])

  const storyColor = activeStory?.color || editingStory?.color

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={activeStory ? [0, 8, 15] : [0, 3, 12]}
        fov={60}
      />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={40}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 0, 0]}
      />

      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={0.6} castShadow />

      <fog attach="fog" args={['#1a1a2e', 15, 50]} />

      <GalleryRoom storyColor={storyColor} />

      {activeStory && (
        <Text
          position={[0, 4, 0]}
          fontSize={0.8}
          color={activeStory.color}
          anchorX="center"
          anchorY="middle"
        >
          {activeStory.name}
        </Text>
      )}

      {itemPositions.map(({ file, position }) => (
        <LibraryItem
          key={file.id}
          file={file}
          position={position}
          onClick={handleItemClick}
          isSelected={selectedItems.includes(file.id)}
          isSelectionMode={!!editingStory}
          storyColor={storyColor}
        />
      ))}

      {filesToShow.length === 0 && (
        <Text
          position={[0, 1, 0]}
          fontSize={0.5}
          color="#666"
          anchorX="center"
          anchorY="middle"
        >
          {activeStory ? 'Esta história está vazia' : 'Nenhum ficheiro encontrado'}
        </Text>
      )}
    </>
  )
}

function Scene3D() {
  return (
    <Canvas
      shadows
      gl={{ antialias: true, alpha: false }}
      style={{ background: '#1a1a2e' }}
    >
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  )
}

export default Scene3D
