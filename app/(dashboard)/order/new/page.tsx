"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import { ArrowLeft, Loader2, Upload, Box, Palette, Settings, CheckCircle, Layers, Triangle, Ruler } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/AuthContext"
import FileUploader from "@/components/3d/FileUploader"
import { StorageService, formatFileSize, UploadProgress } from "@/lib/firebase/storage"
import { MATERIALS, COLORS } from "@/lib/firebase/printers"

const STLViewer = dynamic(() => import("@/components/3d/STLViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-muted/30 rounded-lg flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ),
})

interface ModelInfo {
  volume: number
  boundingBox: { x: number; y: number; z: number }
  triangleCount: number
}

export default function NewOrderPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [step, setStep] = useState(1)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [isUploading, setIsUploading] = useState(false)
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null)
  const [printSettings, setPrintSettings] = useState({
    material: "",
    color: "",
    infill: 20,
    quality: "standard",
    quantity: 1,
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/order/new")
    }
  }, [user, authLoading, router])

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setFileUrl(url)
  }

  const handleFileRemove = () => {
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl)
    }
    setSelectedFile(null)
    setFileUrl(null)
    setModelInfo(null)
  }

  const handleUpload = async () => {
    if (!selectedFile || !user) return
    setIsUploading(true)
    try {
      const result = await StorageService.uploadSTL(
        selectedFile,
        user.uid,
        (progress: UploadProgress) => {
          setUploadProgress(progress.progress)
        }
      )
      setFileUrl(result.url)
      setStep(2)
    } catch (error) {
      console.error(error)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleModelLoad = (info: ModelInfo) => {
    setModelInfo(info)
  }

  const qualityOptions = [
    { value: "draft", label: "Taslak", description: "0.3mm - Hızlı baskı" },
    { value: "standard", label: "Standart", description: "0.2mm - Dengeli" },
    { value: "high", label: "Yüksek", description: "0.1mm - Detaylı" },
  ]

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      <Link 
        href="/customer" 
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Panele Dön
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Yeni Sipariş Oluştur</h1>
        <p className="text-muted-foreground mt-1">3D modelinizi yükleyin ve baskı ayarlarınızı seçin.</p>
      </div>

      <div className="flex gap-2 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`flex-1 h-2 rounded-full transition-colors ${
              s <= step ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {step === 1 && (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  Adım 1: Dosya Yükleme
                </CardTitle>
                <CardDescription>
                  3D modelinizi (STL veya OBJ formatında) yükleyin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FileUploader
                  onFileSelect={handleFileSelect}
                  onFileRemove={handleFileRemove}
                  selectedFile={selectedFile}
                  disabled={isUploading}
                />

                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Yükleniyor...</span>
                      <span className="font-medium">{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleUpload} 
                  disabled={!selectedFile || isUploading}
                  className="w-full"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Yükleniyor...
                    </>
                  ) : (
                    "Devam Et"
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  Adım 2: Baskı Ayarları
                </CardTitle>
                <CardDescription>
                  Malzeme, renk ve kalite tercihlerinizi seçin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Malzeme</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {MATERIALS.slice(0, 6).map((material) => (
                      <button
                        key={material}
                        type="button"
                        onClick={() => setPrintSettings({ ...printSettings, material })}
                        className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                          printSettings.material === material
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {material}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Renk</Label>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.slice(0, 8).map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setPrintSettings({ ...printSettings, color })}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          printSettings.color === color
                            ? "bg-secondary text-secondary-foreground"
                            : "bg-muted hover:bg-muted/80"
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Doluluk Oranı: {printSettings.infill}%</Label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="10"
                    value={printSettings.infill}
                    onChange={(e) => setPrintSettings({ ...printSettings, infill: parseInt(e.target.value) })}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>10% (Hafif)</span>
                    <span>100% (Dolu)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Baskı Kalitesi</Label>
                  <div className="space-y-2">
                    {qualityOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setPrintSettings({ ...printSettings, quality: option.value })}
                        className={`w-full p-3 rounded-lg border text-left transition-colors ${
                          printSettings.quality === option.value
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <p className="font-medium text-foreground">{option.label}</p>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Adet</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max="100"
                    value={printSettings.quantity}
                    onChange={(e) => setPrintSettings({ ...printSettings, quantity: parseInt(e.target.value) || 1 })}
                  />
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    Geri
                  </Button>
                  <Button 
                    onClick={() => setStep(3)} 
                    disabled={!printSettings.material || !printSettings.color}
                    className="flex-1"
                  >
                    Devam Et
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-muted-foreground" />
                  Adım 3: Yazıcı Seçimi
                </CardTitle>
                <CardDescription>
                  Size en uygun yazıcıyı seçin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Yazıcı listesi yakında eklenecek...
                  </p>
                </div>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                    Geri
                  </Button>
                  <Button onClick={() => setStep(4)} className="flex-1">
                    Devam Et
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 4 && (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-muted-foreground" />
                  Adım 4: Özet ve Onay
                </CardTitle>
                <CardDescription>
                  Sipariş detaylarınızı kontrol edin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 p-4 rounded-lg bg-muted/50">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dosya</span>
                    <span className="font-medium">{selectedFile?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Malzeme</span>
                    <span className="font-medium">{printSettings.material}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Renk</span>
                    <span className="font-medium">{printSettings.color}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Doluluk</span>
                    <span className="font-medium">{printSettings.infill}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kalite</span>
                    <span className="font-medium">
                      {qualityOptions.find(o => o.value === printSettings.quality)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Adet</span>
                    <span className="font-medium">{printSettings.quantity}</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                    Geri
                  </Button>
                  <Button className="flex-1">
                    Siparişi Oluştur
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <div className="sticky top-24">
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl shadow-primary/10">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-60" />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
              
              <div className="relative p-4 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/30">
                        <Box className="h-5 w-5 text-white" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-slate-900 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">3D Önizleme</h3>
                      <p className="text-xs text-white/50">Gerçek zamanlı görüntüleme</p>
                    </div>
                  </div>
                  {selectedFile && (
                    <div className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
                      <span className="text-xs font-medium text-white/70">{selectedFile.name}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="relative">
                {fileUrl ? (
                  <STLViewer 
                    url={fileUrl} 
                    className="h-[420px]" 
                    color={printSettings.color === "Kırmızı" ? "#ef4444" : 
                           printSettings.color === "Mavi" ? "#3b82f6" : 
                           printSettings.color === "Yeşil" ? "#22c55e" : 
                           printSettings.color === "Sarı" ? "#eab308" :
                           printSettings.color === "Turuncu" ? "#f97316" :
                           printSettings.color === "Mor" ? "#a855f7" :
                           printSettings.color === "Beyaz" ? "#f5f5f5" :
                           printSettings.color === "Siyah" ? "#1a1a1a" :
                           "#3b82f6"}
                    onModelLoad={handleModelLoad}
                  />
                ) : (
                  <div className="h-[420px] flex items-center justify-center">
                    <div className="text-center px-8">
                      <div className="relative mb-6">
                        <div className="w-24 h-24 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-sm">
                          <Box className="h-10 w-10 text-white/30" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center animate-bounce">
                          <Upload className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                      <p className="text-white/60 font-medium mb-2">Model Bekleniyor</p>
                      <p className="text-sm text-white/40 max-w-[200px] mx-auto">
                        STL dosyanızı yükleyin, 3D önizleme burada görünecek
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {modelInfo && (
                <div className="relative p-4 border-t border-white/10">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="group relative p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all duration-300">
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
                            <Layers className="h-3 w-3 text-primary" />
                          </div>
                          <span className="text-[10px] uppercase tracking-wider text-white/40 font-medium">Hacim</span>
                        </div>
                        <p className="text-xl font-bold text-white">
                          {modelInfo.volume.toFixed(1)}
                          <span className="text-sm font-normal text-white/50 ml-1">cm³</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="group relative p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-secondary/30 transition-all duration-300">
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-lg bg-secondary/20 flex items-center justify-center">
                            <Ruler className="h-3 w-3 text-secondary" />
                          </div>
                          <span className="text-[10px] uppercase tracking-wider text-white/40 font-medium">Boyut</span>
                        </div>
                        <p className="text-lg font-bold text-white leading-tight">
                          {modelInfo.boundingBox.x}×{modelInfo.boundingBox.y}
                          <br />
                          <span className="text-white/70">×{modelInfo.boundingBox.z}</span>
                          <span className="text-xs font-normal text-white/50 ml-1">mm</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="group relative p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-accent/30 transition-all duration-300">
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-lg bg-accent/20 flex items-center justify-center">
                            <Triangle className="h-3 w-3 text-accent" />
                          </div>
                          <span className="text-[10px] uppercase tracking-wider text-white/40 font-medium">Üçgen</span>
                        </div>
                        <p className="text-xl font-bold text-white">
                          {(modelInfo.triangleCount / 1000).toFixed(1)}
                          <span className="text-sm font-normal text-white/50 ml-1">K</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

