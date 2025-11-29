"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { ArrowLeft, Loader2, Printer as PrinterIcon, Settings, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"
import { PrinterService, MATERIALS, COLORS, PrinterType } from "@/lib/firebase/printers"

const printerSchema = z.object({
  brand: z.string().min(2, "Marka giriniz"),
  model: z.string().min(2, "Model giriniz"),
  type: z.string().min(1, "Tip seçiniz"),
  buildVolumeX: z.number().min(1, "Genişlik giriniz"),
  buildVolumeY: z.number().min(1, "Derinlik giriniz"),
  buildVolumeZ: z.number().min(1, "Yükseklik giriniz"),
  materials: z.array(z.string()).min(1, "En az bir malzeme seçiniz"),
  colors: z.array(z.string()).min(1, "En az bir renk seçiniz"),
  perGram: z.number().min(0.1, "Gram başı fiyat giriniz"),
  perHour: z.number().min(0.1, "Saat başı fiyat giriniz"),
  minOrder: z.number().min(1, "Minimum sipariş tutarı giriniz"),
  description: z.string().optional(),
})

type PrinterFormValues = z.infer<typeof printerSchema>

const printerTypes: PrinterType[] = ["FDM", "SLA", "SLS", "DLP", "Resin"]

export default function NewPrinterPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([])
  const [selectedColors, setSelectedColors] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PrinterFormValues>({
    resolver: zodResolver(printerSchema),
    defaultValues: {
      materials: [],
      colors: [],
      buildVolumeX: 220,
      buildVolumeY: 220,
      buildVolumeZ: 250,
      perGram: 1,
      perHour: 10,
      minOrder: 50,
    },
  })

  const toggleMaterial = (material: string) => {
    const updated = selectedMaterials.includes(material)
      ? selectedMaterials.filter((m) => m !== material)
      : [...selectedMaterials, material]
    setSelectedMaterials(updated)
    setValue("materials", updated)
  }

  const toggleColor = (color: string) => {
    const updated = selectedColors.includes(color)
      ? selectedColors.filter((c) => c !== color)
      : [...selectedColors, color]
    setSelectedColors(updated)
    setValue("colors", updated)
  }

  const onSubmit = async (data: PrinterFormValues) => {
    if (!user) return
    setIsLoading(true)
    setError(null)
    try {
      await PrinterService.create({
        providerId: user.uid,
        brand: data.brand,
        model: data.model,
        type: data.type as PrinterType,
        buildVolume: {
          x: data.buildVolumeX,
          y: data.buildVolumeY,
          z: data.buildVolumeZ,
        },
        materials: data.materials,
        colors: data.colors,
        status: "active",
        pricing: {
          perGram: data.perGram,
          perHour: data.perHour,
          minOrder: data.minOrder,
        },
        description: data.description,
      })
      router.push("/provider/printers")
    } catch (err) {
      console.error(err)
      setError("Yazıcı eklenirken bir hata oluştu.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 max-w-2xl">
      <Link 
        href="/provider/printers" 
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Yazıcılarıma Dön
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Yeni Yazıcı Ekle</h1>
        <p className="text-muted-foreground mt-1">3D yazıcınızın bilgilerini girin.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PrinterIcon className="h-5 w-5 text-muted-foreground" />
              Yazıcı Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Marka</Label>
                <Input 
                  id="brand" 
                  placeholder="Örn: Creality, Prusa" 
                  disabled={isLoading}
                  {...register("brand")}
                />
                {errors.brand && <p className="text-xs text-destructive">{errors.brand.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input 
                  id="model" 
                  placeholder="Örn: Ender 3 V2" 
                  disabled={isLoading}
                  {...register("model")}
                />
                {errors.model && <p className="text-xs text-destructive">{errors.model.message}</p>}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Yazıcı Tipi</Label>
              <select
                id="type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading}
                {...register("type")}
              >
                <option value="">Tip Seçiniz</option>
                {printerTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Baskı Hacmi (mm)</Label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Input 
                    type="number" 
                    placeholder="Genişlik (X)" 
                    disabled={isLoading}
                    {...register("buildVolumeX", { valueAsNumber: true })}
                  />
                  <span className="text-xs text-muted-foreground">X (Genişlik)</span>
                </div>
                <div>
                  <Input 
                    type="number" 
                    placeholder="Derinlik (Y)" 
                    disabled={isLoading}
                    {...register("buildVolumeY", { valueAsNumber: true })}
                  />
                  <span className="text-xs text-muted-foreground">Y (Derinlik)</span>
                </div>
                <div>
                  <Input 
                    type="number" 
                    placeholder="Yükseklik (Z)" 
                    disabled={isLoading}
                    {...register("buildVolumeZ", { valueAsNumber: true })}
                  />
                  <span className="text-xs text-muted-foreground">Z (Yükseklik)</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Açıklama (Opsiyonel)</Label>
              <textarea
                id="description"
                placeholder="Yazıcınız hakkında ek bilgiler..."
                rows={3}
                disabled={isLoading}
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                {...register("description")}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5 text-muted-foreground" />
              Malzeme ve Renkler
            </CardTitle>
            <CardDescription>Desteklediğiniz malzeme ve renkleri seçin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Desteklenen Malzemeler</Label>
              <div className="flex flex-wrap gap-2">
                {MATERIALS.map((material) => (
                  <button
                    key={material}
                    type="button"
                    onClick={() => toggleMaterial(material)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedMaterials.includes(material)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {material}
                  </button>
                ))}
              </div>
              {errors.materials && <p className="text-xs text-destructive">{errors.materials.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Mevcut Renkler</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => toggleColor(color)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedColors.includes(color)
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
              {errors.colors && <p className="text-xs text-destructive">{errors.colors.message}</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              Fiyatlandırma
            </CardTitle>
            <CardDescription>Baskı hizmetiniz için fiyatlandırma ayarlayın</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="perGram">Gram Başı (₺)</Label>
                <Input 
                  id="perGram" 
                  type="number" 
                  step="0.1"
                  placeholder="1.00" 
                  disabled={isLoading}
                  {...register("perGram", { valueAsNumber: true })}
                />
                {errors.perGram && <p className="text-xs text-destructive">{errors.perGram.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="perHour">Saat Başı (₺)</Label>
                <Input 
                  id="perHour" 
                  type="number" 
                  step="0.1"
                  placeholder="10.00" 
                  disabled={isLoading}
                  {...register("perHour", { valueAsNumber: true })}
                />
                {errors.perHour && <p className="text-xs text-destructive">{errors.perHour.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="minOrder">Min. Sipariş (₺)</Label>
                <Input 
                  id="minOrder" 
                  type="number" 
                  placeholder="50" 
                  disabled={isLoading}
                  {...register("minOrder", { valueAsNumber: true })}
                />
                {errors.minOrder && <p className="text-xs text-destructive">{errors.minOrder.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
            İptal
          </Button>
          <Button type="submit" className="flex-1" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Yazıcı Ekle
          </Button>
        </div>
      </form>
    </div>
  )
}

