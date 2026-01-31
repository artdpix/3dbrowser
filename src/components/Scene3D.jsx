import React, { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Text, RoundedBox } from '@react-three/drei'
import { useStore } from '../store/useStore'
import { useStoriesStore } from '../store/useStoriesStore'
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

// Componente para cada item da biblioteca
function LibraryItem({ file, position, onClick, isSelected, isSelectionMode, storyColor }) {
  const meshRef = useRef()
  const [hovered, setHovered] = React.useState(false)

  const color = TYPE_COLORS[file.type] || '#6c63ff'

  useFrame(() => {
    if (meshRef.current) {
      // Animação suave de hover/seleção
      const targetScale = hovered ? 1.15 : (isSelected ? 1.05 : 1)
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1
      )
      // Rotação suave quando hover
      if (hovered) {
        meshRef.current.rotation.y += 0.01
      }
      // Animação de seleção
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
      {/* Indicador de seleção (anel à volta) */}
      {isSelectionMode && isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
          <ringGeometry args={[0.9, 1.1, 32]} />
          <meshBasicMaterial color={storyColor || '#ffd93d'} transparent opacity={0.8} />
        </mesh>
      )}

      {/* Objeto 3D baseado no tipo */}
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
          <RoundedBox args={[0.8, 1.1, 0.15]} radius={0.02}>
            <meshStandardMaterial
              color={isSelected ? storyColor : (hovered ? '#ff8888' : color)}
              metalness={0.1}
              roughness={0.8}
              emissive={isSelected ? storyColor : '#000'}
              emissiveIntensity={isSelected ? 0.3 : 0}
            />
          </RoundedBox>
        ) : file.type === 'audio' ? (
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
          </group>
        ) : file.type === 'image' ? (
          <group>
            <RoundedBox args={[1.0, 1.0, 0.08]} radius={0.02}>
              <meshStandardMaterial
                color={isSelected ? storyColor : (hovered ? '#c084fc' : '#1a1a2e')}
                metalness={0.3}
                roughness={0.5}
              />
            </RoundedBox>
            <mesh position={[0, 0, 0.045]}>
              <planeGeometry args={[0.85, 0.85]} />
              <meshStandardMaterial
                color={isSelected ? storyColor : (hovered ? '#d8b4fe' : color)}
                emissive={isSelected ? storyColor : (hovered ? color : '#000')}
                emissiveIntensity={isSelected ? 0.4 : (hovered ? 0.4 : 0.1)}
              />
            </mesh>
          </group>
        ) : (
          <group>
            <RoundedBox args={[1.2, 0.8, 0.08]} radius={0.02}>
              <meshStandardMaterial
                color={isSelected ? storyColor : '#2a2a4e'}
                metalness={0.5}
                roughness={0.3}
              />
            </RoundedBox>
            <mesh position={[0, 0, 0.045]}>
              <planeGeometry args={[1.1, 0.7]} />
              <meshStandardMaterial
                color={isSelected ? storyColor : (hovered ? '#ffe066' : color)}
                emissive={isSelected ? storyColor : (hovered ? color : '#000')}
                emissiveIntensity={isSelected ? 0.4 : (hovered ? 0.3 : 0)}
              />
            </mesh>
          </group>
        )}

        {/* Label do tipo */}
        <Text
          position={[0, -0.8, 0]}
          fontSize={0.15}
          color={isSelected ? '#fff' : '#888'}
          anchorX="center"
          anchorY="middle"
        >
          {TYPE_LABELS[file.type]}
        </Text>
      </group>

      {/* Nome do ficheiro */}
      <Text
        position={[0, 0.9, 0]}
        fontSize={0.12}
        color="#fff"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.5}
        textAlign="center"
      >
        {file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name}
      </Text>

      {/* Indicador de seleção (checkmark) */}
      {isSelectionMode && isSelected && (
        <group position={[0.6, 0.6, 0.2]}>
          <mesh>
            <sphereGeometry args={[0.15, 16, 16]} />
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
      {/* Chão */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.1} roughness={0.9} />
      </mesh>

      {/* Paredes traseiras */}
      <mesh position={[0, 5, -15]}>
        <planeGeometry args={[50, 15]} />
        <meshStandardMaterial color="#16213e" metalness={0} roughness={1} />
      </mesh>

      {/* Luzes ambiente */}
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

  // Determinar que ficheiros mostrar
  const filesToShow = useMemo(() => {
    if (activeStory) {
      // Mostrar apenas os itens da história ativa
      return getStoryItems(activeStory.id, allFiles)
    }
    return getCurrentPageFiles()
  }, [activeStory, allFiles, getCurrentPageFiles, getStoryItems])

  // Handler de clique - diferente em modo seleção vs normal
  const handleItemClick = (file) => {
    if (editingStory) {
      // Modo seleção: toggle seleção
      toggleItemSelection(file.id)
    } else {
      // Modo normal: abrir viewer
      selectFile(file)
    }
  }

  // Calcular posições
  const itemPositions = useMemo(() => {
    if (activeStory && filesToShow.length > 0) {
      // Layout em círculo para histórias
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

    // Layout em grid para biblioteca
    const cols = 8
    const spacingX = 2
    const spacingZ = 2.5
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
      {/* Câmera e controlos */}
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

      {/* Iluminação */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={0.5} castShadow />

      {/* Ambiente */}
      <fog attach="fog" args={['#1a1a2e', 15, 50]} />

      {/* Sala */}
      <GalleryRoom storyColor={storyColor} />

      {/* Título da história (se ativa) */}
      {activeStory && (
        <Text
          position={[0, 4, 0]}
          fontSize={0.8}
          color={activeStory.color}
          anchorX="center"
          anchorY="middle"
          font={undefined}
        >
          {activeStory.name}
        </Text>
      )}

      {/* Items */}
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

      {/* Mensagem se não houver ficheiros */}
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

// Componente wrapper com Canvas
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
