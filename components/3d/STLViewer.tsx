"use client"

import { Suspense, useRef, useState, useEffect, useCallback } from "react"
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber"
import { OrbitControls, Center, Environment, ContactShadows, Float, Sparkles, Grid, Html } from "@react-three/drei"
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js"
import * as THREE from "three"
import { RotateCw, Maximize2, Move, ZoomIn, Grid3X3, Eye, Sun, Moon, Camera, Box } from "lucide-react"

interface STLModelProps {
  url: string
  color?: string
  onLoad?: (geometry: THREE.BufferGeometry) => void
  autoRotate?: boolean
  wireframe?: boolean
  materialType?: 'standard' | 'wireframe' | 'xray'
}

function STLModel({ url, color = "#3b82f6", onLoad, autoRotate = false, wireframe = false, materialType = 'standard' }: STLModelProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const wireframeRef = useRef<THREE.LineSegments>(null)
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

  useFrame(() => {
    if (meshRef.current && autoRotate) {
      meshRef.current.rotation.y += 0.003
    }
    if (wireframeRef.current && autoRotate) {
      wireframeRef.current.rotation.y += 0.003
    }
  })

  const edgesGeometry = new THREE.EdgesGeometry(geometry, 30)

  if (materialType === 'wireframe') {
    return (
      <Float speed={1.2} rotationIntensity={0} floatIntensity={0.3} floatingRange={[-1, 1]}>
        <lineSegments ref={wireframeRef} geometry={edgesGeometry}>
          <lineBasicMaterial color={color} linewidth={1} />
        </lineSegments>
      </Float>
    )
  }

  if (materialType === 'xray') {
    return (
      <Float speed={1.2} rotationIntensity={0} floatIntensity={0.3} floatingRange={[-1, 1]}>
        <mesh ref={meshRef} geometry={geometry}>
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.15}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
        <lineSegments geometry={edgesGeometry}>
          <lineBasicMaterial color={color} transparent opacity={0.6} />
        </lineSegments>
      </Float>
    )
  }

  return (
    <Float speed={1.2} rotationIntensity={0} floatIntensity={0.3} floatingRange={[-1, 1]}>
      <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial 
          color={color} 
          metalness={0.15} 
          roughness={0.35}
          clearcoat={0.4}
          clearcoatRoughness={0.15}
          envMapIntensity={1}
          reflectivity={0.5}
        />
      </mesh>
      {wireframe && (
        <lineSegments geometry={edgesGeometry}>
          <lineBasicMaterial color="#ffffff" transparent opacity={0.3} />
        </lineSegments>
      )}
    </Float>
  )
}

function SceneSetup() {
  const { gl } = useThree()
  
  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping
    gl.toneMappingExposure = 1.3
  }, [gl])
  
  return null
}

function CameraController({ controlsRef, viewAngle }: { controlsRef: any, viewAngle: string }) {
  const { camera } = useThree()
  
  useEffect(() => {
    if (!controlsRef.current) return
    
    const distance = 180
    let newPosition: THREE.Vector3
    
    switch (viewAngle) {
      case 'front':
        newPosition = new THREE.Vector3(0, 0, distance)
        break
      case 'back':
        newPosition = new THREE.Vector3(0, 0, -distance)
        break
      case 'left':
        newPosition = new THREE.Vector3(-distance, 0, 0)
        break
      case 'right':
        newPosition = new THREE.Vector3(distance, 0, 0)
        break
      case 'top':
        newPosition = new THREE.Vector3(0, distance, 0)
        break
      case 'bottom':
        newPosition = new THREE.Vector3(0, -distance, 0)
        break
      case 'iso':
      default:
        newPosition = new THREE.Vector3(distance * 0.7, distance * 0.7, distance * 0.7)
    }
    
    camera.position.copy(newPosition)
    camera.lookAt(0, 0, 0)
    controlsRef.current.target.set(0, 0, 0)
    controlsRef.current.update()
  }, [viewAngle, camera, controlsRef])
  
  return null
}

function LoadingSpinner() {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-10 backdrop-blur-sm">
      <div className="text-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-primary/20 rounded-full" />
          <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin absolute inset-0" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Box className="h-6 w-6 text-primary/60 animate-pulse" />
          </div>
        </div>
        <p className="text-sm text-white/60 mt-4 font-medium">Model yükleniyor...</p>
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

type ViewAngle = 'iso' | 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom'
type MaterialType = 'standard' | 'wireframe' | 'xray'

export default function STLViewer({ 
  url, 
  color = "#3b82f6", 
  className = "",
  showGrid = true,
  onModelLoad
}: STLViewerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [autoRotate, setAutoRotate] = useState(false)
  const [showGridLines, setShowGridLines] = useState(true)
  const [showWireframe, setShowWireframe] = useState(false)
  const [materialType, setMaterialType] = useState<MaterialType>('standard')
  const [viewAngle, setViewAngle] = useState<ViewAngle>('iso')
  const [darkMode, setDarkMode] = useState(true)
  const controlsRef = useRef<any>(null)

  const handleModelLoad = useCallback((geometry: THREE.BufferGeometry) => {
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
  }, [onModelLoad])

  const handleResetView = () => {
    setViewAngle('iso')
    if (controlsRef.current) {
      controlsRef.current.reset()
    }
  }

  const cycleMaterialType = () => {
    const types: MaterialType[] = ['standard', 'wireframe', 'xray']
    const currentIndex = types.indexOf(materialType)
    setMaterialType(types[(currentIndex + 1) % types.length])
  }

  const viewAngles: { key: ViewAngle; label: string }[] = [
    { key: 'iso', label: '3D' },
    { key: 'front', label: 'Ön' },
    { key: 'top', label: 'Üst' },
    { key: 'right', label: 'Sağ' },
  ]

  return (
    <div className={`relative w-full h-full min-h-[300px] rounded-2xl overflow-hidden group ${className}`}>
      <div className={`absolute inset-0 transition-colors duration-500 ${
        darkMode 
          ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
          : 'bg-gradient-to-br from-slate-100 via-white to-slate-200'
      }`} />
      <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] ${
        darkMode ? 'from-primary/10 via-transparent to-transparent' : 'from-primary/5 via-transparent to-transparent'
      }`} />
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'} 1px, transparent 0)`,
          backgroundSize: '20px 20px'
        }} />
      </div>
      
      {isLoading && <LoadingSpinner />}
      
      <div className="absolute top-3 left-3 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
        {viewAngles.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setViewAngle(key)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium backdrop-blur-md transition-all duration-200 ${
              viewAngle === key
                ? 'bg-primary/30 text-primary border border-primary/50'
                : darkMode 
                  ? 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/10'
                  : 'bg-black/10 hover:bg-black/20 text-black/70 hover:text-black border border-black/10'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="absolute top-3 right-3 z-20 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300">
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`p-2 rounded-lg backdrop-blur-md transition-all duration-200 ${
            autoRotate 
              ? 'bg-primary/30 text-primary border border-primary/50' 
              : darkMode
                ? 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/10'
                : 'bg-black/10 hover:bg-black/20 text-black/70 hover:text-black border border-black/10'
          }`}
          title="Otomatik Döndür"
        >
          <RotateCw className={`h-4 w-4 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
        </button>
        <button
          onClick={cycleMaterialType}
          className={`p-2 rounded-lg backdrop-blur-md transition-all duration-200 ${
            materialType !== 'standard'
              ? 'bg-secondary/30 text-secondary border border-secondary/50'
              : darkMode
                ? 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/10'
                : 'bg-black/10 hover:bg-black/20 text-black/70 hover:text-black border border-black/10'
          }`}
          title={`Görünüm: ${materialType === 'standard' ? 'Normal' : materialType === 'wireframe' ? 'Tel Kafes' : 'X-Ray'}`}
        >
          <Eye className="h-4 w-4" />
        </button>
        <button
          onClick={() => setShowGridLines(!showGridLines)}
          className={`p-2 rounded-lg backdrop-blur-md transition-all duration-200 ${
            showGridLines 
              ? 'bg-accent/30 text-accent border border-accent/50' 
              : darkMode
                ? 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/10'
                : 'bg-black/10 hover:bg-black/20 text-black/70 hover:text-black border border-black/10'
          }`}
          title="Izgara"
        >
          <Grid3X3 className="h-4 w-4" />
        </button>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`p-2 rounded-lg backdrop-blur-md transition-all duration-200 ${
            darkMode
              ? 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/10'
              : 'bg-black/10 hover:bg-black/20 text-black/70 hover:text-black border border-black/10'
          }`}
          title="Tema Değiştir"
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button
          onClick={handleResetView}
          className={`p-2 rounded-lg backdrop-blur-md transition-all duration-200 ${
            darkMode
              ? 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/10'
              : 'bg-black/10 hover:bg-black/20 text-black/70 hover:text-black border border-black/10'
          }`}
          title="Görünümü Sıfırla"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md border text-xs ${
          darkMode 
            ? 'bg-white/10 border-white/10 text-white/60' 
            : 'bg-black/10 border-black/10 text-black/60'
        }`}>
          <Move className="h-3 w-3" />
          <span>Sürükle</span>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md border text-xs ${
          darkMode 
            ? 'bg-white/10 border-white/10 text-white/60' 
            : 'bg-black/10 border-black/10 text-black/60'
        }`}>
          <ZoomIn className="h-3 w-3" />
          <span>Scroll</span>
        </div>
      </div>

      <div className={`absolute bottom-3 right-3 z-20 px-3 py-1.5 rounded-full backdrop-blur-md border text-xs font-medium transition-all duration-300 ${
        darkMode 
          ? 'bg-white/10 border-white/10 text-white/40' 
          : 'bg-black/10 border-black/10 text-black/40'
      }`}>
        {materialType === 'standard' ? 'Normal' : materialType === 'wireframe' ? 'Tel Kafes' : 'X-Ray'}
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
        <CameraController controlsRef={controlsRef} viewAngle={viewAngle} />
        
        <ambientLight intensity={darkMode ? 0.4 : 0.6} />
        <directionalLight
          position={[100, 100, 100]}
          intensity={darkMode ? 1.5 : 1.2}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <directionalLight position={[-50, 50, -50]} intensity={0.5} color="#60a5fa" />
        <directionalLight position={[50, -50, 50]} intensity={0.3} color="#f472b6" />
        <spotLight
          position={[0, 200, 0]}
          intensity={0.6}
          angle={0.5}
          penumbra={1}
          castShadow
        />
        
        <Environment preset={darkMode ? "night" : "apartment"} />
        
        <Suspense fallback={null}>
          <Center>
            <STLModel 
              url={url} 
              color={color} 
              onLoad={handleModelLoad} 
              autoRotate={autoRotate}
              wireframe={showWireframe}
              materialType={materialType}
            />
          </Center>
        </Suspense>

        {showGridLines && (
          <Grid
            position={[0, -50, 0]}
            args={[300, 300]}
            cellSize={10}
            cellThickness={0.5}
            cellColor={darkMode ? "#334155" : "#cbd5e1"}
            sectionSize={50}
            sectionThickness={1}
            sectionColor={darkMode ? "#475569" : "#94a3b8"}
            fadeDistance={400}
            fadeStrength={1}
            followCamera={false}
          />
        )}

        <ContactShadows
          position={[0, -50, 0]}
          opacity={darkMode ? 0.5 : 0.3}
          scale={200}
          blur={2.5}
          far={100}
          color="#000000"
        />

        {darkMode && (
          <Sparkles
            count={40}
            scale={200}
            size={1.5}
            speed={0.2}
            opacity={0.2}
            color="#60a5fa"
          />
        )}

        <OrbitControls
          ref={controlsRef}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={50}
          maxDistance={500}
          autoRotate={false}
          enableDamping
          dampingFactor={0.05}
          makeDefault
        />
      </Canvas>
    </div>
  )
}

