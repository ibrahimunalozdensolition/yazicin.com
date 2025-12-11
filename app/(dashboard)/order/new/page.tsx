"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import { ArrowLeft, Loader2, Upload, Box, Settings, CheckCircle, MapPin, Star, Printer, CreditCard, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/AuthContext"
import FileUploader from "@/components/3d/FileUploader"
import { StorageService, UploadProgress } from "@/lib/firebase/storage"
import { MATERIALS, COLORS, PrinterService, Printer as PrinterType } from "@/lib/firebase/printers"
import { OrderService } from "@/lib/firebase/orders"
import { UserService } from "@/lib/firebase/users"
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { GoogleMap, useLoadScript, Marker, OverlayView } from "@react-google-maps/api"

const STLViewer = dynamic(() => import("@/components/3d/STLViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full max-w-[400px] h-[300px] rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  ),
})

interface ModelInfo {
  volume: number
  weight: number
  boundingBox: { x: number; y: number; z: number }
  triangleCount: number
}

interface ProviderWithPrinter {
  providerId: string
  providerName: string
  printer: PrinterType
  city: string
  district: string
  rating: number
  completedOrders: number
  estimatedPrice: number
  location?: { latitude: number; longitude: number }
  distance?: number
}

interface Address {
  id: string
  title: string
  city: string
  district: string
  fullAddress: string
  isDefault: boolean
  location?: { latitude: number; longitude: number }
}

export default function NewOrderPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { isLoaded: mapsLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  })
  const [step, setStep] = useState(1)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null)
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
  const [providers, setProviders] = useState<ProviderWithPrinter[]>([])
  const [selectedProvider, setSelectedProvider] = useState<ProviderWithPrinter | null>(null)
  const [loadingProviders, setLoadingProviders] = useState(false)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [sortBy, setSortBy] = useState<"distance" | "price" | "rating">("distance")

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/order/new")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  useEffect(() => {
    if (step === 3 && printSettings.material && modelInfo) {
      fetchProviders()
    }
  }, [step, printSettings.material, printSettings.infill, printSettings.quality, printSettings.quantity, modelInfo, userLocation])

  useEffect(() => {
    if (step === 3 && selectedProvider && modelInfo) {
      const updatedPrice = calculatePrice(
        selectedProvider.printer,
        modelInfo.weight,
        printSettings.infill,
        printSettings.quality,
        printSettings.quantity
      )
      setSelectedProvider({
        ...selectedProvider,
        estimatedPrice: updatedPrice
      })
    }
  }, [printSettings.infill, printSettings.quality, printSettings.quantity, modelInfo, step])

  useEffect(() => {
    if ((step === 3 || step === 4) && user) {
      fetchAddresses()
    }
  }, [step, user])

  useEffect(() => {
    if (providers.length === 0) return
    
    const sorted = [...providers].sort((a, b) => {
      if (sortBy === "price") {
        return a.estimatedPrice - b.estimatedPrice
      } else if (sortBy === "rating") {
        return b.rating - a.rating
      } else {
        if (a.distance === undefined) return 1
        if (b.distance === undefined) return -1
        return a.distance - b.distance
      }
    })
    
    setProviders(sorted)
  }, [sortBy])

  const calculatePrice = (printer: PrinterType, modelWeight: number, infill: number, quality: string, quantity: number) => {
    if (!modelWeight || modelWeight === 0) return 0
    
    const baseWeight = modelWeight * (infill / 100)
    const basePrice = baseWeight * printer.pricing.perGram
    
    const qualityMultiplier = quality === "high" ? 1.4 : quality === "draft" ? 0.85 : 1.0
    const infillMultiplier = infill > 50 ? 1 + ((infill - 50) / 100) : 1
    
    const finalPrice = basePrice * qualityMultiplier * infillMultiplier * quantity
    
    return Math.max(Math.round(finalPrice), printer.pricing.minOrder)
  }

  const calculateDeliveryTime = (modelWeight: number, infill: number, quality: string, quantity: number) => {
    if (!modelWeight || modelWeight === 0) return 3
    
    const baseHours = modelWeight * 0.5
    const qualityMultiplier = quality === "high" ? 1.5 : quality === "draft" ? 0.7 : 1.0
    const infillMultiplier = infill > 50 ? 1 + ((infill - 50) / 200) : 1
    
    const totalHours = baseHours * qualityMultiplier * infillMultiplier * quantity
    const days = Math.ceil(totalHours / 8)
    
    return Math.max(days, 1)
  }

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const fetchProviders = async () => {
    console.log("🔍 fetchProviders çağrıldı, malzeme:", printSettings.material)
    setLoadingProviders(true)
    try {
      const activePrinters = await PrinterService.getActive()
      console.log("📦 Aktif yazıcı sayısı:", activePrinters.length)
      
      const filteredPrinters = printSettings.material 
        ? activePrinters.filter(printer => 
            printer.materials.includes(printSettings.material)
          )
        : activePrinters
      
      console.log("✅ Filtrelenen yazıcı sayısı:", filteredPrinters.length)
      
      const providersMap = new Map<string, ProviderWithPrinter>()
      
      for (const printer of filteredPrinters) {
        if (!providersMap.has(printer.providerId)) {
          const providerDocRef = doc(db, "providers", printer.providerId)
          const providerDoc = await getDoc(providerDocRef)
          
          if (providerDoc.exists()) {
            const providerData = providerDoc.data()
            const modelWeight = modelInfo?.weight || 0
            const estimatedPrice = calculatePrice(
              printer,
              modelWeight,
              printSettings.infill,
              printSettings.quality,
              printSettings.quantity
            )
            
            const providerLocation = providerData.location
            let distance = undefined
            if (userLocation && providerLocation) {
              distance = calculateDistance(
                userLocation.lat,
                userLocation.lng,
                providerLocation.latitude,
                providerLocation.longitude
              )
            }

            providersMap.set(printer.providerId, {
              providerId: printer.providerId,
              providerName: providerData.businessName || "Provider",
              printer: printer,
              city: providerData.address?.city || "",
              district: providerData.address?.district || "",
              rating: providerData.rating || 0,
              completedOrders: providerData.completedOrders || 0,
              estimatedPrice,
              location: providerLocation,
              distance,
            })
          } else {
            console.warn("⚠️ Provider bulunamadı:", printer.providerId)
          }
        }
      }
      
      let finalProviders = Array.from(providersMap.values())
      
      if (userLocation) {
        finalProviders.sort((a, b) => {
          if (a.distance === undefined) return 1
          if (b.distance === undefined) return -1
          return a.distance - b.distance
        })
      }
      
      console.log("🎯 Final provider sayısı:", finalProviders.length)
      setProviders(finalProviders)
    } catch (error) {
      console.error("❌ Error fetching providers:", error)
    } finally {
      setLoadingProviders(false)
    }
  }

  const fetchAddresses = async () => {
    if (!user) return
    setLoadingAddresses(true)
    try {
      const q = query(collection(db, "addresses"), where("userId", "==", user.uid))
      const snapshot = await getDocs(q)
      const addressList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Address[]
      setAddresses(addressList)
      const defaultAddr = addressList.find(a => a.isDefault)
      if (defaultAddr) {
        setSelectedAddress(defaultAddr)
        if (defaultAddr.location) {
          setUserLocation({ 
            lat: defaultAddr.location.latitude, 
            lng: defaultAddr.location.longitude 
          })
        }
      }
    } catch (error) {
      console.error("Error fetching addresses:", error)
    } finally {
      setLoadingAddresses(false)
    }
  }

  const handleFileSelect = (file: File) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const handleFileRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedFile(null)
    setPreviewUrl(null)
    setUploadedFileUrl(null)
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
      setUploadedFileUrl(result.url)
      setStep(2)
    } catch (error) {
      console.error(error)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleModelLoad = useCallback((info: ModelInfo) => {
    setModelInfo(info)
  }, [])

  const handleCreateOrder = async () => {
    if (!user || !selectedFile || !selectedProvider || !selectedAddress || !uploadedFileUrl) return
    
    setIsSubmitting(true)
    try {
      const userProfile = await UserService.getUserProfile(user.uid)
      
      const orderId = await OrderService.create({
        customerId: user.uid,
        customerName: userProfile?.displayName || user.displayName || "",
        customerEmail: user.email || "",
        providerId: selectedProvider.providerId,
        providerName: selectedProvider.providerName,
        printerId: selectedProvider.printer.id || "",
        printerName: `${selectedProvider.printer.brand} ${selectedProvider.printer.model}`,
        fileName: selectedFile.name,
        fileUrl: uploadedFileUrl,
        fileSize: selectedFile.size,
        printSettings: {
          material: printSettings.material,
          color: printSettings.color,
          infill: printSettings.infill,
          quality: printSettings.quality as "draft" | "normal" | "fine",
          quantity: printSettings.quantity,
        },
        price: selectedProvider.estimatedPrice,
        shippingAddress: {
          city: selectedAddress.city,
          district: selectedAddress.district,
          fullAddress: selectedAddress.fullAddress,
        },
      })
      
      setCreatedOrderId(orderId)
      setOrderSuccess(true)
    } catch (error) {
      console.error("Error creating order:", error)
    } finally {
      setIsSubmitting(false)
    }
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

  if (orderSuccess) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="max-w-lg mx-auto">
          <Card className="border-green-500/50 bg-green-500/5">
            <CardContent className="py-12">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 mb-6">
                  <CheckCircle className="h-10 w-10 text-green-500" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-3">Siparişiniz Oluşturuldu!</h1>
                <p className="text-muted-foreground mb-6">
                  Siparişiniz provider'a iletildi. Onay aldıktan sonra üretim sürecine başlanacak.
                </p>
                <div className="w-full space-y-3 mb-6">
                  <div className="p-4 rounded-lg bg-muted/50 text-left">
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">Sipariş No</span>
                      <span className="font-mono font-medium">#{createdOrderId?.slice(0, 8)}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">Provider</span>
                      <span className="font-medium">{selectedProvider?.providerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tutar</span>
                      <span className="font-bold text-primary">₺{selectedProvider?.estimatedPrice}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 w-full">
                  <Link href="/customer" className="flex-1">
                    <Button variant="outline" className="w-full">Panele Dön</Button>
                  </Link>
                  <Link href={`/customer/orders/${createdOrderId}`} className="flex-1">
                    <Button className="w-full">Siparişi Takip Et</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
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

      <div className={step === 3 ? "space-y-6" : "grid lg:grid-cols-2 gap-8"}>
        <div className={step === 3 ? "grid lg:grid-cols-2 gap-6" : "space-y-6"}>
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
                    min="5"
                    max="100"
                    step="5"
                    value={printSettings.infill}
                    onChange={(e) => setPrintSettings({ ...printSettings, infill: parseInt(e.target.value) })}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>5% (Hafif)</span>
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
            <>
              <Card className="border-border/50">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Printer className="h-5 w-5 text-muted-foreground" />
                        Adım 3: Yazıcı Seçimi
                      </CardTitle>
                      <CardDescription>
                        Size en uygun yazıcıyı seçin
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSortBy("distance")}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          sortBy === "distance"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80 text-muted-foreground"
                        }`}
                      >
                        <MapPin className="h-4 w-4 inline mr-1" />
                        Konum
                      </button>
                      <button
                        type="button"
                        onClick={() => setSortBy("price")}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          sortBy === "price"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80 text-muted-foreground"
                        }`}
                      >
                        <CreditCard className="h-4 w-4 inline mr-1" />
                        Fiyat
                      </button>
                      <button
                        type="button"
                        onClick={() => setSortBy("rating")}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          sortBy === "rating"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80 text-muted-foreground"
                        }`}
                      >
                        <Star className="h-4 w-4 inline mr-1" />
                        Yıldız
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loadingProviders ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : providers.length === 0 ? (
                    <div className="text-center py-8">
                      <Printer className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-2">Uygun yazıcı bulunamadı</p>
                      <p className="text-sm text-muted-foreground">Farklı baskı ayarları deneyin</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                      {providers.map((provider) => (
                        <button
                          key={provider.providerId}
                          type="button"
                          onClick={() => setSelectedProvider(provider)}
                          className={`w-full p-4 rounded-xl border text-left transition-all ${
                            selectedProvider?.providerId === provider.providerId
                              ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                              : "border-border hover:border-primary/50 hover:bg-muted/50"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold text-foreground">{provider.providerName}</h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {provider.city}, {provider.district}
                                {provider.distance && (
                                  <span className="text-xs">• {provider.distance.toFixed(1)} km</span>
                                )}
                              </div>
                              {modelInfo && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                  <Clock className="h-3 w-3" />
                                  {calculateDeliveryTime(
                                    modelInfo.weight,
                                    printSettings.infill,
                                    printSettings.quality,
                                    printSettings.quantity
                                  )} gün teslimat
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-primary">₺{provider.estimatedPrice}</p>
                              <p className="text-xs text-muted-foreground">Tahmini</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm flex-wrap">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                              <span className="font-medium">{Number(provider.rating).toFixed(1)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <CheckCircle className="h-4 w-4" />
                              <span>{provider.completedOrders} sipariş</span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Printer className="h-4 w-4" />
                              <span>{provider.printer.brand} {provider.printer.model}</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                      Geri
                    </Button>
                    <Button 
                      onClick={() => setStep(4)} 
                      disabled={!selectedProvider}
                      className="flex-1"
                    >
                      Devam Et
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {!loadingProviders && providers.length > 0 && (
                <div className="h-[600px] rounded-xl overflow-hidden border border-border">
                  {mapsLoaded && userLocation ? (
                    <GoogleMap
                      mapContainerStyle={{ width: "100%", height: "100%" }}
                      center={userLocation}
                      zoom={10}
                      options={{
                        zoomControl: true,
                        streetViewControl: false,
                        mapTypeControl: false,
                        fullscreenControl: false,
                      }}
                    >
                      <Marker
                        position={userLocation}
                        icon={{
                          url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='%234F46E5'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/%3E%3C/svg%3E",
                          scaledSize: new google.maps.Size(32, 32),
                        }}
                      />
                      {providers.map((provider) => 
                        provider.location && (
                          <Marker
                            key={provider.providerId}
                            position={{
                              lat: provider.location.latitude,
                              lng: provider.location.longitude,
                            }}
                            onClick={() => setSelectedProvider(provider)}
                            icon={{
                              url: selectedProvider?.providerId === provider.providerId
                                ? "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='%2310B981'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/%3E%3C/svg%3E"
                                : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='%23EF4444'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/%3E%3C/svg%3E",
                              scaledSize: new google.maps.Size(
                                selectedProvider?.providerId === provider.providerId ? 40 : 32,
                                selectedProvider?.providerId === provider.providerId ? 40 : 32
                              ),
                            }}
                            title={`${provider.providerName} - ₺${provider.estimatedPrice}`}
                          />
                        )
                      )}
                    </GoogleMap>
                  ) : (
                    <div className="flex items-center justify-center h-full bg-muted">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {step === 4 && (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-muted-foreground" />
                  Adım 4: Özet ve Onay
                </CardTitle>
                <CardDescription>
                  Sipariş detaylarınızı kontrol edin ve teslimat adresini seçin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3 p-4 rounded-lg bg-muted/50">
                  <h4 className="font-medium text-foreground mb-3">Sipariş Özeti</h4>
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
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Provider</span>
                    <span className="font-medium">{selectedProvider?.providerName}</span>
                  </div>
                  <div className="border-t border-border pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="font-medium text-foreground">Toplam</span>
                    <span className="text-xl font-bold text-primary">₺{selectedProvider?.estimatedPrice}</span>
                  </div>
                </div>
                </div>

                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Teslimat Adresi
                  </Label>
                  {loadingAddresses ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : addresses.length === 0 ? (
                    <div className="p-4 rounded-lg border border-dashed border-border text-center">
                      <p className="text-muted-foreground mb-2">Kayıtlı adres bulunamadı</p>
                      <Link href="/customer/addresses">
                        <Button variant="outline" size="sm">Adres Ekle</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {addresses.map((address) => (
                        <button
                          key={address.id}
                          type="button"
                          onClick={() => setSelectedAddress(address)}
                          className={`w-full p-3 rounded-lg border text-left transition-colors ${
                            selectedAddress?.id === address.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{address.title}</span>
                            {address.isDefault && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Varsayılan</span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {address.fullAddress}, {address.district}/{address.city}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-start gap-3">
                    <CreditCard className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-600">Ödeme Bilgisi</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Ödeme sistemi yakında aktif olacak. Şu an siparişler onay sonrası işleme alınacaktır.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                    Geri
                  </Button>
                  <Button 
                    onClick={handleCreateOrder}
                    disabled={!selectedAddress || isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Oluşturuluyor...
                      </>
                    ) : (
                      "Siparişi Oluştur"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          {step !== 3 && (
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

                <div className="relative p-4">
                  <div className="flex justify-center">
                    {previewUrl ? (
                      <STLViewer 
                        url={previewUrl} 
                        material={printSettings.material || "PLA"}
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
                      <div className="w-full max-w-[400px] h-[300px] rounded-2xl bg-slate-800/50 border border-white/5 flex items-center justify-center">
                        <div className="text-center px-6">
                          <div className="relative mb-4">
                            <div className="w-16 h-16 mx-auto rounded-xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-sm">
                              <Box className="h-7 w-7 text-white/30" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-md bg-primary/20 border border-primary/30 flex items-center justify-center animate-bounce">
                              <Upload className="h-3 w-3 text-primary" />
                            </div>
                          </div>
                          <p className="text-white/60 font-medium mb-1 text-sm">Model Bekleniyor</p>
                          <p className="text-xs text-white/40 max-w-[180px] mx-auto">
                            STL dosyanızı yükleyin
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {modelInfo && (
                  <div className="relative p-4 border-t border-white/10">
                    <div className="flex justify-center">
                      <div className="group relative p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all duration-300 w-full max-w-md">
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                              <Box className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <span className="text-xs uppercase tracking-wider text-white/40 font-medium block mb-1">Ortalama Gramaj</span>
                              <p className="text-sm text-white/50">{printSettings.infill}% doluluk</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-white">
                              {(modelInfo.weight * (printSettings.infill / 100)).toFixed(1)}
                              <span className="text-base font-normal text-white/50 ml-1">g</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
