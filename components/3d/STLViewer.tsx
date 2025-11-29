"use client"

import { Suspense, useRef, useState, useEffect } from "react"
import { Canvas, useFrame, useLoader } from "@react-three/fiber"
import { OrbitControls, Center, Grid, Environment } from "@react-three/drei"
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js"
import * as THREE from "three"
import { Loader2 } from "lucide-react"

interface STLModelProps {
  url: string
  color?: string
  onLoad?: (geometry: THREE.BufferGeometry) => void
}

function STLModel({ url, color = "#3b82f6", onLoad }: STLModelProps) {
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

  return (
    <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial 
        color={color} 
        metalness={0.2} 
        roughness={0.6}
        flatShading={false}
      />
    </mesh>
  )
}

function LoadingSpinner() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Model yükleniyor...</p>
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

export default function STLViewer({ 
  url, 
  color = "#3b82f6", 
  className = "",
  showGrid = true,
  onModelLoad
}: STLViewerProps) {
  const [isLoading, setIsLoading] = useState(true)

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

  return (
    <div className={`relative w-full h-full min-h-[300px] bg-muted/30 rounded-lg overflow-hidden ${className}`}>
      {isLoading && <LoadingSpinner />}
      <Canvas
        camera={{ position: [150, 150, 150], fov: 50 }}
        shadows
        gl={{ antialias: true, preserveDrawingBuffer: true }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[100, 100, 100]}
          intensity={1}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <directionalLight position={[-100, -100, -100]} intensity={0.3} />
        
        <Suspense fallback={null}>
          <Center>
            <STLModel url={url} color={color} onLoad={handleModelLoad} />
          </Center>
        </Suspense>

        {showGrid && (
          <Grid
            infiniteGrid
            cellSize={10}
            cellThickness={0.5}
            cellColor="#666"
            sectionSize={50}
            sectionThickness={1}
            sectionColor="#888"
            fadeDistance={500}
            fadeStrength={1}
          />
        )}

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={50}
          maxDistance={500}
        />
      </Canvas>
    </div>
  )
}

