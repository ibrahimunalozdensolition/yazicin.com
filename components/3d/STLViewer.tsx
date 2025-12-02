"use client"

import { useState, useEffect, useLayoutEffect, Suspense } from "react"
import * as THREE from "three"
import { Canvas, useLoader, useThree } from "@react-three/fiber"
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js"
import { OrbitControls, Stage, Center, Html, useProgress } from "@react-three/drei"
import { RotateCw, Maximize2, AlertTriangle, RefreshCw } from "lucide-react"

interface STLViewerProps {
  url: string
  color?: string
  className?: string
  material?: string
  onModelLoad?: (info: ModelInfo) => void
  onError?: (error: Error) => void
}

export interface ModelInfo {
  volume: number
  weight: number
  boundingBox: { x: number; y: number; z: number }
  triangleCount: number
}

const MATERIAL_DENSITY: Record<string, number> = {
  "PLA": 1.24,
  "ABS": 1.04,
  "PETG": 1.27,
  "TPU": 1.20,
  "Nylon": 1.14,
  "PC": 1.20,
  "ASA": 1.05,
  "HIPS": 1.04,
  "PVA": 1.23,
  "Wood Fill": 1.20,
  "Carbon Fiber": 1.30,
  "Metal Fill": 1.50,
  "Resin - Standard": 1.12,
  "Resin - Tough": 1.15,
  "Resin - Flexible": 1.10,
  "Resin - Dental": 1.18,
}

function calculateVolume(geometry: THREE.BufferGeometry): number {
  const position = geometry.getAttribute("position")
  let volume = 0

  for (let i = 0; i < position.count; i += 3) {
    const p1 = new THREE.Vector3(position.getX(i), position.getY(i), position.getZ(i))
    const p2 = new THREE.Vector3(position.getX(i + 1), position.getY(i + 1), position.getZ(i + 1))
    const p3 = new THREE.Vector3(position.getX(i + 2), position.getY(i + 2), position.getZ(i + 2))

    volume += p1.dot(p2.cross(p3)) / 6
  }

  return Math.abs(volume)
}

function Model({ url, color, material, onModelLoad }: { 
  url: string, 
  color: string, 
  material: string, 
  onModelLoad?: (info: ModelInfo) => void 
}) {
  const geometry = useLoader(STLLoader, url)
  const { camera } = useThree()

  useLayoutEffect(() => {
    if (!geometry) return

    geometry.computeBoundingBox()
    geometry.computeVertexNormals()
    geometry.center()

    if (onModelLoad) {
      const box = geometry.boundingBox!
      const size = new THREE.Vector3()
      box.getSize(size)

      const volume = calculateVolume(geometry)
      const volumeMm3 = Math.abs(volume)
      const volumeCm3 = (volumeMm3 / 1000) * 5.47
      const density = MATERIAL_DENSITY[material] || MATERIAL_DENSITY["PLA"]
      const weight = volumeCm3 * density
      const triangleCount = geometry.getAttribute("position").count / 3

      onModelLoad({
        volume: volumeCm3,
        weight: Math.round(weight * 10) / 10,
        boundingBox: {
          x: Math.round(size.x * 100) / 100,
          y: Math.round(size.y * 100) / 100,
          z: Math.round(size.z * 100) / 100,
        },
        triangleCount,
      })
    }

  }, [geometry, material, onModelLoad])

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial 
        color={color} 
        metalness={0.2}
        roughness={0.5} 
      />
    </mesh>
  )
}

function Loader() {
  const { progress } = useProgress()
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-black/50 backdrop-blur-sm">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
        <span className="text-white text-sm font-medium">{progress.toFixed(0)}%</span>
      </div>
    </Html>
  )
}

export default function STLViewer({ 
  url, 
  color = "#3b82f6", 
  className = "",
  material = "PLA",
  onModelLoad,
  onError
}: STLViewerProps) {
  const [autoRotate, setAutoRotate] = useState(false)
  const [key, setKey] = useState(0)

  const handleResetView = () => {
    setKey(prev => prev + 1)
    setAutoRotate(false)
  }

  return (
    <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 group ${className}`} style={{ width: '100%', maxWidth: '400px', height: '300px' }}>
      <ErrorBoundary onError={onError}>
        <Canvas shadows dpr={[1, 2]} camera={{ fov: 50 }}>
          <Suspense fallback={<Loader />}>
            <Stage environment="city" intensity={0.6}>
              <Model 
                url={url} 
                color={color} 
                material={material} 
                onModelLoad={onModelLoad} 
              />
            </Stage>
          </Suspense>
          <OrbitControls 
            autoRotate={autoRotate} 
            makeDefault 
            key={key}
          />
        </Canvas>
      </ErrorBoundary>

      <div className="absolute top-2 right-2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`p-1.5 rounded-md backdrop-blur-md transition-all duration-200 ${
            autoRotate 
              ? "bg-blue-500/30 text-blue-400 border border-blue-500/50" 
              : "bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/10"
          }`}
          title="Otomatik Döndür"
        >
          <RotateCw className={`h-3.5 w-3.5 ${autoRotate ? "animate-spin" : ""}`} style={{ animationDuration: "3s" }} />
        </button>
        <button
          onClick={handleResetView}
          className="p-1.5 rounded-md backdrop-blur-md transition-all duration-200 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/10"
          title="Görünümü Sıfırla"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300">
        <div className="flex items-center gap-1 px-2 py-1 rounded-full backdrop-blur-md border text-[10px] bg-white/10 border-white/10 text-white/60">
          <span>Sol Tık: Döndür</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-full backdrop-blur-md border text-[10px] bg-white/10 border-white/10 text-white/60">
          <span>Sağ Tık: Taşı</span>
        </div>
      </div>
    </div>
  )
}

class ErrorBoundary extends  React.Component<{ children: React.ReactNode, onError?: (error: Error) => void }, { hasError: boolean, error: Error | null }> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    if (this.props.onError) {
      this.props.onError(error)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center px-6">
            <div className="w-12 h-12 mx-auto rounded-xl bg-red-500/20 flex items-center justify-center mb-3">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <p className="font-medium mb-1 text-white/80 text-sm">Model Görüntülenemedi</p>
            <p className="text-xs mb-3 max-w-[200px] mx-auto text-white/50">
              {this.state.error?.message || "Bir hata oluştu"}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.reload()
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors bg-white/10 hover:bg-white/20 text-white border border-white/20"
            >
              <RefreshCw className="h-3 w-3" />
              Tekrar Dene
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
import React from "react"

