import React, { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Environment, Text, RoundedBox } from '@react-three/drei'
import { useStore } from '../store/useStore'
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
function LibraryItem({ file, position, onClick }) {
  const meshRef = useRef()
  const [hovered, setHovered] = React.useState(false)

  const color = TYPE_COLORS[file.type] || '#6c63ff'

  useFrame((state) => {
    if (meshRef.current) {
      // Animação suave de hover
      const targetScale = hovered ? 1.1 : 1
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1
      )
      // Rotação suave quando hover
      if (hovered) {
        meshRef.current.rotation.y += 0.01
      }
    }
  })

  return (
    <group position={position}>
      {/* Objeto 3D baseado no tipo */}
      <group
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation()
          onClick(file)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={(e) => {
          setHovered(false)
          document.body.style.cursor = 'auto'
        }}
      >
        {file.type === 'pdf' ? (
          // Livro para PDF
          <RoundedBox args={[0.8, 1.1, 0.15]} radius={0.02}>
            <meshStandardMaterial
              color={hovered ? '#ff8888' : color}
              metalness={0.1}
              roughness={0.8}
            />
          </RoundedBox>
        ) : file.type === 'audio' ? (
          // Disco para áudio
          <group>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.5, 0.5, 0.05, 32]} />
              <meshStandardMaterial
                color={hovered ? '#6fefe6' : color}
                metalness={0.3}
                roughness={0.4}
              />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.15, 0.15, 0.06, 32]} />
              <meshStandardMaterial color="#1a1a2e" />
            </mesh>
          </group>
        ) : file.type === 'image' ? (
          // Quadro/moldura para imagem
          <group>
            {/* Moldura */}
            <RoundedBox args={[1.0, 1.0, 0.08]} radius={0.02}>
              <meshStandardMaterial
                color={hovered ? '#c084fc' : '#1a1a2e'}
                metalness={0.3}
                roughness={0.5}
              />
            </RoundedBox>
            {/* Interior do quadro */}
            <mesh position={[0, 0, 0.045]}>
              <planeGeometry args={[0.85, 0.85]} />
              <meshStandardMaterial
                color={hovered ? '#d8b4fe' : color}
                emissive={hovered ? color : '#000'}
                emissiveIntensity={hovered ? 0.4 : 0.1}
              />
            </mesh>
          </group>
        ) : (
          // Ecrã para vídeo
          <group>
            <RoundedBox args={[1.2, 0.8, 0.08]} radius={0.02}>
              <meshStandardMaterial
                color="#2a2a4e"
                metalness={0.5}
                roughness={0.3}
              />
            </RoundedBox>
            <mesh position={[0, 0, 0.045]}>
              <planeGeometry args={[1.1, 0.7]} />
              <meshStandardMaterial
                color={hovered ? '#ffe066' : color}
                emissive={hovered ? color : '#000'}
                emissiveIntensity={hovered ? 0.3 : 0}
              />
            </mesh>
          </group>
        )}

        {/* Label do tipo */}
        <Text
          position={[0, -0.8, 0]}
          fontSize={0.15}
          color="#888"
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

      {/* Indicador de hover */}
      {hovered && (
        <pointLight position={[0, 0, 1]} intensity={0.5} color={color} distance={3} />
      )}
    </group>
  )
}

// Sala/Galeria
function GalleryRoom() {
  return (
    <group>
      {/* Chão */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.1} roughness={0.9} />
      </mesh>

      {/* Paredes traseiras (decorativas) */}
      <mesh position={[0, 5, -15]}>
        <planeGeometry args={[50, 15]} />
        <meshStandardMaterial color="#16213e" metalness={0} roughness={1} />
      </mesh>

      {/* Luzes ambiente */}
      <pointLight position={[0, 8, 0]} intensity={0.5} color="#fff" />
      <pointLight position={[-10, 5, 5]} intensity={0.3} color="#6c63ff" />
      <pointLight position={[10, 5, 5]} intensity={0.3} color="#4ecdc4" />
    </group>
  )
}

// Componente principal da cena
function Scene() {
  const { getCurrentPageFiles, selectFile } = useStore()
  const files = getCurrentPageFiles()

  // Calcular posições em grid
  const itemPositions = useMemo(() => {
    const cols = 8
    const spacingX = 2
    const spacingZ = 2.5
    const startX = -((cols - 1) * spacingX) / 2

    return files.map((file, index) => {
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
  }, [files])

  return (
    <>
      {/* Câmera e controlos */}
      <PerspectiveCamera makeDefault position={[0, 3, 12]} fov={60} />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 0, -3]}
      />

      {/* Iluminação */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={0.5} castShadow />

      {/* Ambiente */}
      <fog attach="fog" args={['#1a1a2e', 15, 40]} />

      {/* Sala */}
      <GalleryRoom />

      {/* Items da biblioteca */}
      {itemPositions.map(({ file, position }) => (
        <LibraryItem
          key={file.id}
          file={file}
          position={position}
          onClick={selectFile}
        />
      ))}

      {/* Mensagem se não houver ficheiros */}
      {files.length === 0 && (
        <Text
          position={[0, 1, 0]}
          fontSize={0.5}
          color="#666"
          anchorX="center"
          anchorY="middle"
        >
          Nenhum ficheiro encontrado
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
