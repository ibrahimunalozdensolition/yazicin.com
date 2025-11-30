"use client"

import { Suspense, useRef, useState, useEffect } from "react"
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber"
import { OrbitControls, Center, Environment, ContactShadows, Float, Sparkles } from "@react-three/drei"
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js"
import * as THREE from "three"
import { Loader2, RotateCw, ZoomIn, ZoomOut, Maximize2, Move } from "lucide-react"

interface STLModelProps {
  url: string
  color?: string
  onLoad?: (geometry: THREE.BufferGeometry) => void
  autoRotate?: boolean
}

function STLModel({ url, color = "#3b82f6", onLoad, autoRotate = false }: STLModelProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const geometry = useLoader(STLLoader, url)

  useEffect(() => {
    if (geometry && onLoad) {
      geometry.computeBoundingBox()
      onLoad(geometry)
    }
  }, [geometry, onLoad])

  useEffect(() => {
    if (geometry) {
      geometry.center()
      geometry.computeVertexNormals()
    }
  }, [geometry])

  useFrame((state) => {
    if (meshRef.current && autoRotate) {
      meshRef.current.rotation.y += 0.005
    }
  })

  return (
    <Float speed={1.5} rotationIntensity={0} floatIntensity={0.5} floatingRange={[-2, 2]}>
      <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial 
          color={color} 
          metalness={0.1} 
          roughness={0.4}
          clearcoat={0.3}
          clearcoatRoughness={0.2}
          envMapIntensity={0.8}
        />
      </mesh>
    </Float>
  )
}

function SceneSetup() {
  const { gl } = useThree()
  
  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping
    gl.toneMappingExposure = 1.2
  }, [gl])
  
  return null
}

function LoadingSpinner() {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-10 backdrop-blur-sm">
      <div className="text-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin absolute inset-0" />
        </div>
        <p className="text-sm text-muted-foreground mt-4 font-medium">Model yükleniyor...</p>
      </div>
    </div>
  )
}

interface STLViewerProps {
  url: string
  color?: string
  className?: string
  showGrid?: boolean
  onModelLoad?: (info: ModelInfo) => void
}

export interface ModelInfo {
  volume: number
  boundingBox: {
    x: number
    y: number
    z: number
  }
  triangleCount: number
}

function calculateVolume(geometry: THREE.BufferGeometry): number {
  const position = geometry.getAttribute("position")
  let volume = 0

  for (let i = 0; i < position.count; i += 3) {
    const p1 = new THREE.Vector3(
      position.getX(i),
      position.getY(i),
      position.getZ(i)
    )
    const p2 = new THREE.Vector3(
      position.getX(i + 1),
      position.getY(i + 1),
      position.getZ(i + 1)
    )
    const p3 = new THREE.Vector3(
      position.getX(i + 2),
      position.getY(i + 2),
      position.getZ(i + 2)
    )

    volume += p1.dot(p2.cross(p3)) / 6
  }

  return Math.abs(volume)
}

function GradientBackground() {
  return (
    <mesh position={[0, 0, -200]} scale={[1000, 1000, 1]}>
      <planeGeometry />
      <meshBasicMaterial>
        <color attach="color" args={["#0f172a"]} />
      </meshBasicMaterial>
    </mesh>
  )
}

export default function STLViewer({ 
  url, 
  color = "#3b82f6", 
  className = "",
  showGrid = true,
  onModelLoad
}: STLViewerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [autoRotate, setAutoRotate] = useState(false)
  const controlsRef = useRef<any>(null)

  const handleModelLoad = (geometry: THREE.BufferGeometry) => {
    setIsLoading(false)
    
    if (onModelLoad) {
      geometry.computeBoundingBox()
      const box = geometry.boundingBox!
      const size = new THREE.Vector3()
      box.getSize(size)

      const volume = calculateVolume(geometry)
      const triangleCount = geometry.getAttribute("position").count / 3

      onModelLoad({
        volume: volume / 1000,
        boundingBox: {
          x: Math.round(size.x * 100) / 100,
          y: Math.round(size.y * 100) / 100,
          z: Math.round(size.z * 100) / 100,
        },
        triangleCount,
      })
    }
  }

  const handleResetView = () => {
    if (controlsRef.current) {
      controlsRef.current.reset()
    }
  }

  return (
    <div className={`relative w-full h-full min-h-[300px] rounded-2xl overflow-hidden group ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }} />
      </div>
      
      {isLoading && <LoadingSpinner />}
      
      <div className="absolute top-3 right-3 z-20 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`p-2 rounded-lg backdrop-blur-md transition-all duration-200 ${
            autoRotate 
              ? 'bg-primary/30 text-primary border border-primary/50' 
              : 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/10'
          }`}
          title="Otomatik Döndür"
        >
          <RotateCw className={`h-4 w-4 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
        </button>
        <button
          onClick={handleResetView}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white backdrop-blur-md border border-white/10 transition-all duration-200"
          title="Görünümü Sıfırla"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white/60 text-xs">
          <Move className="h-3 w-3" />
          <span>Sürükle: Döndür</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white/60 text-xs">
          <ZoomIn className="h-3 w-3" />
          <span>Scroll: Yakınlaştır</span>
        </div>
      </div>

      <Canvas
        camera={{ position: [150, 150, 150], fov: 45 }}
        shadows
        gl={{ 
          antialias: true, 
          preserveDrawingBuffer: true,
          alpha: true,
          powerPreference: "high-performance"
        }}
        style={{ background: 'transparent' }}
      >
        <SceneSetup />
        
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[100, 100, 100]}
          intensity={1.5}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <directionalLight position={[-50, 50, -50]} intensity={0.5} color="#60a5fa" />
        <directionalLight position={[50, -50, 50]} intensity={0.3} color="#f472b6" />
        <spotLight
          position={[0, 200, 0]}
          intensity={0.5}
          angle={0.5}
          penumbra={1}
          castShadow
        />
        
        <Environment preset="city" />
        
        <Suspense fallback={null}>
          <Center>
            <STLModel url={url} color={color} onLoad={handleModelLoad} autoRotate={autoRotate} />
          </Center>
        </Suspense>

        <ContactShadows
          position={[0, -50, 0]}
          opacity={0.4}
          scale={200}
          blur={2}
          far={100}
          color="#000000"
        />

        <Sparkles
          count={50}
          scale={200}
          size={2}
          speed={0.3}
          opacity={0.3}
          color="#60a5fa"
        />

        <OrbitControls
          ref={controlsRef}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={50}
          maxDistance={500}
          autoRotate={false}
          makeDefault
        />
      </Canvas>
    </div>
  )
}

