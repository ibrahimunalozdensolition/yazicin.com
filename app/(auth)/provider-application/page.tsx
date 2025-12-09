"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, ArrowLeft, CheckCircle, Printer, Building, MapPin, User, Sparkles, Clock, BadgeCheck, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Combobox } from "@/components/ui/combobox"
import { useAuth } from "@/contexts/AuthContext"
import { ProviderApplicationService } from "@/lib/firebase/providerApplications"
import { ilceler } from "@/lib/data/turkiye-ilce"
import { printerBrands, getSortedBrands, getModelsByBrand } from "@/lib/data/printer-brands"
import LocationPicker from "@/components/maps/LocationPicker"

const printerSchema = z.object({
  brand: z.string().min(1, "Yazıcı markası seçiniz"),
  model: z.string().min(1, "Yazıcı modeli seçiniz"),
})

const applicationSchema = z.object({
  phoneNumber: z.string().min(10, "Geçerli bir telefon numarası giriniz"),
  businessName: z.string().min(2, "İşletme adı en az 2 karakter olmalıdır"),
  businessType: z.enum(["individual", "company"]),
  city: z.string().min(1, "İl seçiniz"),
  district: z.string().min(1, "İlçe seçiniz"),
  address: z.string().min(10, "Adres en az 10 karakter olmalıdır"),
  experience: z.string().min(10, "Deneyiminizi en az 10 karakter ile açıklayınız"),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }).refine((data) => data.lat !== 0 && data.lng !== 0, {
    message: "Harita üzerinden konum seçiniz",
  }),
})

type PrinterInfo = z.infer<typeof printerSchema>
type ApplicationFormValues = z.infer<typeof applicationSchema>

const cities = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya", "Ardahan", "Artvin",
  "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur",
  "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan",
  "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Iğdır", "Isparta", "İstanbul",
  "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kırıkkale", "Kırklareli", "Kırşehir",
  "Kilis", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş",
  "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas",
  "Şanlıurfa", "Şırnak", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak"
]

export default function ProviderApplicationPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [existingApplication, setExistingApplication] = useState<any>(null)
  const [checkingApplication, setCheckingApplication] = useState(true)
  const [printers, setPrinters] = useState<Array<{ quantity: number; brand: string; model: string; availableModels: string[] }>>([
    { quantity: 1, brand: "", model: "", availableModels: [] }
  ])
  const [selectedCity, setSelectedCity] = useState<string>("")
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([])
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null)

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length === 0) return ""
    if (numbers.length <= 1) return numbers
    if (numbers.length <= 4) return `${numbers[0]} (${numbers.slice(1)}`
    if (numbers.length <= 7) return `${numbers[0]} (${numbers.slice(1, 4)}) ${numbers.slice(4)}`
    if (numbers.length <= 9) return `${numbers[0]} (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)} ${numbers.slice(7)}`
    return `${numbers[0]} (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)} ${numbers.slice(7, 9)} ${numbers.slice(9, 11)}`
  }

  const {
    register,
    handleSubmit,
    setValue,
    control,
    watch,
    formState: { errors },
  } = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      businessType: "individual",
    },
  })

  const selectedDistrict = watch("district")

  const handlePrinterQuantityChange = (index: number, quantity: number) => {
    const newPrinters = [...printers]
    newPrinters[index].quantity = quantity
    setPrinters(newPrinters)
  }

  const handlePrinterBrandChange = (index: number, brand: string) => {
    const newPrinters = [...printers]
    newPrinters[index] = {
      quantity: newPrinters[index].quantity,
      brand,
      model: "",
      availableModels: getModelsByBrand(brand)
    }
    setPrinters(newPrinters)
  }

  const handlePrinterModelChange = (index: number, model: string) => {
    const newPrinters = [...printers]
    newPrinters[index].model = model
    setPrinters(newPrinters)
  }

  const addPrinter = () => {
    setPrinters([...printers, { quantity: 1, brand: "", model: "", availableModels: [] }])
  }

  const removePrinter = (index: number) => {
    if (printers.length > 1) {
      const newPrinters = printers.filter((_, i) => i !== index)
      setPrinters(newPrinters)
    }
  }

  const handleCityChange = (city: string) => {
    setSelectedCity(city)
    setValue("city", city)
    setValue("district", "")
    setAvailableDistricts(ilceler[city] || [])
  }

  useEffect(() => {
    const checkExisting = async () => {
      if (user) {
        const existing = await ProviderApplicationService.getByUserId(user.uid)
        setExistingApplication(existing)
      }
      setCheckingApplication(false)
    }
    if (!authLoading) {
      checkExisting()
    }
  }, [user, authLoading])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/provider-application")
    }
  }, [user, authLoading, router])

  const onSubmit = async (data: ApplicationFormValues) => {
    if (!user) return

    const validPrinters = printers.filter(p => p.brand && p.model)
    if (validPrinters.length === 0) {
      setError("En az bir yazıcı eklemelisiniz.")
      return
    }
    
    setIsLoading(true)
    setError(null)
    try {
      await ProviderApplicationService.submit({
        ...data,
        printerBrand: validPrinters[0].brand,
        printerModel: validPrinters[0].model,
        printers: validPrinters.map(p => ({ quantity: p.quantity, brand: p.brand, model: p.model })),
        userId: user.uid,
        email: user.email || "",
        displayName: user.displayName || "",
      })
      setIsSuccess(true)
    } catch (err) {
      console.error(err)
      setError("Başvuru gönderilemedi. Lütfen tekrar deneyin.")
    } finally {
      setIsLoading(false)
    }
  }

  const normalizeCityName = (cityName: string): string | null => {
    const cityMap: Record<string, string> = {
      "Istanbul": "İstanbul",
      "Izmir": "İzmir",
      "Isparta": "Isparta",
      "Igdir": "Iğdır",
    }
    
    const normalized = cityMap[cityName] || cityName
    
    if (cities.includes(normalized)) {
      return normalized
    }
    
    const found = cities.find(c => 
      c.toLowerCase().replace(/[ıi]/g, "i") === normalized.toLowerCase().replace(/[ıi]/g, "i")
    )
    
    return found || null
  }

  const findMatchingDistrict = (districtName: string, availableDistricts: string[]): string | null => {
    if (!districtName || availableDistricts.length === 0) return null

    const normalizedInput = districtName
      .replace(/ Merkez$/, "")
      .replace(/ merkez$/, "")
      .toLowerCase()
      .replace(/[ıi]/g, "i")
      .trim()

    const exactMatch = availableDistricts.find(d => 
      d.toLowerCase().replace(/[ıi]/g, "i") === normalizedInput
    )
    if (exactMatch) return exactMatch

    const includesMatch = availableDistricts.find(d => 
      d.toLowerCase().replace(/[ıi]/g, "i").includes(normalizedInput) ||
      normalizedInput.includes(d.toLowerCase().replace(/[ıi]/g, "i"))
    )
    if (includesMatch) return includesMatch

    const startsWithMatch = availableDistricts.find(d => 
      d.toLowerCase().replace(/[ıi]/g, "i").startsWith(normalizedInput) ||
      normalizedInput.startsWith(d.toLowerCase().replace(/[ıi]/g, "i"))
    )
    if (startsWithMatch) return startsWithMatch

    return null
  }

  const handleLocationSelect = (location: { lat: number; lng: number }, addressInfo?: { city: string; district: string }) => {
    setSelectedLocation(location)
    setValue("location", location)
    
    if (addressInfo) {
      const turkishCityName = normalizeCityName(addressInfo.city)
      if (turkishCityName) {
        setSelectedCity(turkishCityName)
        setValue("city", turkishCityName)
        const districts = ilceler[turkishCityName] || []
        setAvailableDistricts(districts)
        
        if (addressInfo.district && districts.length > 0) {
          const matchedDistrict = findMatchingDistrict(addressInfo.district, districts)
          if (matchedDistrict) {
            setValue("district", matchedDistrict)
          }
        }
      }
    }
  }

  if (authLoading || checkingApplication) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
            <Loader2 className="h-10 w-10 animate-spin text-primary relative" />
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (existingApplication) {
    const statusConfig = {
      pending: { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20", icon: Clock },
      approved: { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20", icon: BadgeCheck },
      rejected: { bg: "bg-red-500/10", text: "text-red-500", border: "border-red-500/20", icon: CheckCircle },
    }
    const statusLabels = {
      pending: "İnceleniyor",
      approved: "Onaylandı",
      rejected: "Reddedildi",
    }
    const config = statusConfig[existingApplication.status as keyof typeof statusConfig]
    const StatusIcon = config.icon

    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
      <div className="container mx-auto flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 py-16">
          <Card className="w-full max-w-md border-border/50 shadow-xl backdrop-blur-sm bg-card/80">
            <CardContent className="pt-10 pb-10">
              <div className="text-center space-y-6">
                <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-2xl ${config.bg} ${config.border} border-2`}>
                  <StatusIcon className={`h-10 w-10 ${config.text}`} />
              </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">Başvurunuz Mevcut</h2>
                  <p className="text-muted-foreground">
                  Daha önce provider başvurusu yapmışsınız.
                </p>
              </div>
                <div className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold ${config.bg} ${config.text} ${config.border} border`}>
                  <StatusIcon className="h-4 w-4" />
                  {statusLabels[existingApplication.status as keyof typeof statusLabels]}
              </div>
              {existingApplication.status === "approved" && (
                  <Link href="/provider" className="block">
                    <Button className="w-full h-12 text-base font-medium gap-2 mt-4 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25">
                      <Sparkles className="h-4 w-4" />
                      Provider Paneline Git
                    </Button>
                </Link>
              )}
              {existingApplication.status === "rejected" && existingApplication.adminNote && (
                  <div className="text-left mt-6 p-5 rounded-xl bg-red-500/5 border border-red-500/20">
                    <p className="text-sm font-semibold text-foreground mb-2">Red Sebebi:</p>
                    <p className="text-sm text-muted-foreground">{existingApplication.adminNote}</p>
                </div>
              )}
                <Link href="/" className="block pt-2">
                  <Button variant="ghost" className="w-full gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Ana Sayfaya Dön
                  </Button>
                </Link>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-500/5 via-background to-background">
      <div className="container mx-auto flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 py-16">
          <Card className="w-full max-w-lg border-emerald-500/20 shadow-xl backdrop-blur-sm bg-card/80">
            <CardContent className="pt-10 pb-10">
              <div className="text-center space-y-6">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/20">
                  <CheckCircle className="h-10 w-10 text-emerald-500" />
              </div>
                <div className="space-y-3">
                  <h2 className="text-2xl font-bold text-foreground">Başvurunuz Alındı!</h2>
                  <p className="text-muted-foreground">
                    Provider başvurunuz başarıyla gönderildi.
                  </p>
                </div>
                <div className="text-left space-y-3 p-4 rounded-xl bg-muted/30 border border-border/50">
                  <p className="text-sm text-foreground">
                    <strong>Sonraki Adımlar:</strong>
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 mt-1">•</span>
                      Süpervizörlerimiz başvurunuzu değerlendirecek
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 mt-1">•</span>
                      Başvurunuz onaylandığında e-posta ile bilgilendirileceksiniz
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 mt-1">•</span>
                      Onay aldıktan sonra Provider panelinize erişim sağlayabileceksiniz
                    </li>
                  </ul>
              </div>
                <div className="flex items-center justify-center gap-2 text-sm text-emerald-600 bg-emerald-500/10 rounded-full px-4 py-2">
                  <Clock className="h-4 w-4" />
                  Ortalama değerlendirme süresi: 24 saat
                </div>
                <Link href="/" className="block pt-2">
                  <Button className="w-full h-12 text-base font-medium gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/25">
                    <ArrowLeft className="h-4 w-4" />
                    Ana Sayfaya Dön
                  </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl relative">
      <Link 
        href="/" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-all duration-200 mb-8 group"
      >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Ana Sayfaya Dön
      </Link>

        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl" />
              <div className="relative bg-card border border-border/50 rounded-2xl p-3 shadow-lg">
          <Image src="/logo.png" alt="Yazıcın.com" width={48} height={48} className="h-12 w-12" />
              </div>
            </div>
        </Link>
          <h1 className="text-3xl font-bold text-foreground mb-3">Provider Başvurusu</h1>
          <p className="text-muted-foreground text-lg">
          3D yazıcınızla gelir elde etmeye başlayın
        </p>
          <div className="flex items-center justify-center gap-6 mt-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              Ücretsiz
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              5 dakika
            </div>
            <div className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-primary" />
              Güvenli
            </div>
          </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card className="border-border/50 shadow-lg backdrop-blur-sm bg-card/80 overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className="h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
              Kişisel Bilgiler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                  <Label className="text-sm font-medium">Ad Soyad</Label>
                  <Input value={user?.displayName || ""} disabled className="h-11 bg-muted/30 border-border/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">E-posta</Label>
                  <Input value={user?.email || ""} disabled className="h-11 bg-muted/30 border-border/50" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-sm font-medium">Telefon Numarası</Label>
                <Controller
                  name="phoneNumber"
                  control={control}
                  render={({ field }) => (
              <Input 
                id="phoneNumber" 
                      placeholder="0 (5XX) XXX XX XX" 
                disabled={isLoading}
                  className="h-11 border-border/50 focus:border-primary/50 transition-colors"
                      value={formatPhoneNumber(field.value || "")}
                      onChange={(e) => {
                        const formatted = formatPhoneNumber(e.target.value)
                        field.onChange(formatted)
                      }}
                    />
                  )}
              />
              {errors.phoneNumber && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
                    {errors.phoneNumber.message}
                  </p>
              )}
            </div>
          </CardContent>
        </Card>

          <Card className="border-border/50 shadow-lg backdrop-blur-sm bg-card/80 overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className="h-1 bg-gradient-to-r from-secondary/50 via-secondary to-secondary/50" />
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10">
                  <Building className="h-5 w-5 text-secondary" />
                </div>
              İşletme Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="businessName" className="text-sm font-medium">İşletme / Atölye Adı</Label>
              <Input 
                id="businessName" 
                placeholder="Örn: Ahmet'in 3D Atölyesi" 
                disabled={isLoading}
                  className="h-11 border-border/50 focus:border-secondary/50 transition-colors"
                {...register("businessName")}
              />
              {errors.businessName && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
                    {errors.businessName.message}
                  </p>
              )}
            </div>
            <div className="space-y-2">
                <Label className="text-sm font-medium">İşletme Türü</Label>
              <div className="grid grid-cols-2 gap-4">
                  <label className="relative flex items-center gap-3 p-4 rounded-xl border-2 border-border/50 cursor-pointer hover:border-secondary/50 hover:bg-secondary/5 transition-all duration-200 has-[:checked]:border-secondary has-[:checked]:bg-secondary/10">
                    <input type="radio" value="individual" {...register("businessType")} className="sr-only" />
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10">
                      <User className="h-4 w-4 text-secondary" />
                    </div>
                    <span className="text-sm font-medium">Bireysel</span>
                </label>
                  <label className="relative flex items-center gap-3 p-4 rounded-xl border-2 border-border/50 cursor-pointer hover:border-secondary/50 hover:bg-secondary/5 transition-all duration-200 has-[:checked]:border-secondary has-[:checked]:bg-secondary/10">
                    <input type="radio" value="company" {...register("businessType")} className="sr-only" />
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10">
                      <Building className="h-4 w-4 text-secondary" />
                    </div>
                    <span className="text-sm font-medium">Şirket</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

          <Card className="border-border/50 shadow-lg backdrop-blur-sm bg-card/80 overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className="h-1 bg-gradient-to-r from-accent/50 via-accent to-accent/50" />
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                  <MapPin className="h-5 w-5 text-accent" />
                </div>
              Konum Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                  <Label className="text-sm font-medium">İl</Label>
                  <Select 
                    value={selectedCity} 
                    onValueChange={handleCityChange}
                  disabled={isLoading}
                >
                    <SelectTrigger className="hover:border-accent/50 focus:border-accent/50">
                      <SelectValue placeholder="İl Seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                  {cities.map((city) => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                    </SelectContent>
                  </Select>
                {errors.city && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
                      {errors.city.message}
                    </p>
                )}
              </div>
              <div className="space-y-2">
                  <Label className="text-sm font-medium">İlçe</Label>
                  <Controller
                    name="district"
                    control={control}
                    render={({ field }) => (
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                        disabled={isLoading || !selectedCity}
                      >
                        <SelectTrigger className="hover:border-accent/50 focus:border-accent/50">
                          <SelectValue placeholder={selectedCity ? "İlçe Seçiniz" : "Önce il seçiniz"} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableDistricts.map((district) => (
                            <SelectItem key={district} value={district}>{district}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                />
                {errors.district && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
                      {errors.district.message}
                    </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium">Açık Adres</Label>
              <textarea 
                id="address"
                placeholder="Detaylı adres bilgisi"
                rows={3}
                disabled={isLoading}
                  className="flex w-full rounded-xl border-2 border-border/50 bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:border-accent/50 disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-colors"
                {...register("address")}
              />
              {errors.address && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
                    {errors.address.message}
                  </p>
              )}
            </div>
            <div className="space-y-2">
              <Controller
                name="location"
                control={control}
                rules={{ required: "Harita üzerinden konum seçiniz" }}
                render={({ field, fieldState }) => (
                  <LocationPicker
                    onLocationSelect={handleLocationSelect}
                    selectedLocation={selectedLocation}
                    error={fieldState.error?.message}
                    disabled={isLoading}
                    city={selectedCity}
                    district={selectedDistrict}
                  />
                )}
              />
              {errors.location && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
                  {errors.location.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

          <Card className="border-border/50 shadow-lg backdrop-blur-sm bg-card/80 overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className="h-1 bg-gradient-to-r from-blue-500/50 via-blue-500 to-blue-500/50" />
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                  <Printer className="h-5 w-5 text-blue-500" />
                </div>
              Yazıcı Bilgileri
            </CardTitle>
              <CardDescription className="text-muted-foreground">
              Sahip olduğunuz 3D yazıcılar hakkında bilgi verin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {printers.map((printer, index) => (
              <div key={index} className="space-y-4 p-4 rounded-xl border border-border/50 bg-muted/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Yazıcı {index + 1}</span>
                  {printers.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePrinter(index)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-[80px_1fr_1fr] sm:grid-cols-[100px_1fr_1fr] gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Sayısı</Label>
                    <Input
                      type="number"
                      min={1}
                      max={99}
                      value={printer.quantity}
                      onChange={(e) => handlePrinterQuantityChange(index, Math.max(1, parseInt(e.target.value) || 1))}
                      disabled={isLoading}
                      className="h-10"
                    />
                  </div>
              <div className="space-y-2">
                  <Label className="text-sm font-medium">Yazıcı Markası</Label>
                    <Combobox
                      options={getSortedBrands()}
                      value={printer.brand}
                      onValueChange={(brand) => handlePrinterBrandChange(index, brand)}
                      placeholder="Marka Seçiniz"
                      searchPlaceholder="Marka ara..."
                      emptyText="Marka bulunamadı."
                  disabled={isLoading}
                    />
              </div>
              <div className="space-y-2">
                  <Label className="text-sm font-medium">Yazıcı Modeli</Label>
                    <Combobox
                      options={printer.availableModels}
                      value={printer.model}
                      onValueChange={(model) => handlePrinterModelChange(index, model)}
                      placeholder={printer.brand ? "Model Seçiniz" : "Önce marka seçiniz"}
                      searchPlaceholder="Model ara..."
                      emptyText="Model bulunamadı."
                      disabled={isLoading || !printer.brand}
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={addPrinter}
              disabled={isLoading}
              className="w-full border-dashed border-2 hover:border-blue-500/50 hover:bg-blue-500/5"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ekstra Yazıcı Ekle
            </Button>

            <div className="space-y-2">
                <Label htmlFor="experience" className="text-sm font-medium">3D Baskı Deneyiminiz</Label>
              <textarea 
                id="experience"
                placeholder="3D baskı konusundaki deneyiminizi kısaca anlatın..."
                rows={4}
                disabled={isLoading}
                  className="flex w-full rounded-xl border-2 border-border/50 bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-colors"
                {...register("experience")}
              />
              {errors.experience && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
                    {errors.experience.message}
                  </p>
              )}
            </div>
          </CardContent>
        </Card>

        {error && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/20 shrink-0">
                <span className="text-lg">!</span>
              </div>
            {error}
          </div>
        )}

          <Button 
            type="submit" 
            className="w-full h-14 text-base font-semibold gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-xl shadow-primary/25 rounded-xl transition-all duration-300 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Gönderiliyor...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
          Başvuruyu Gönder
              </>
            )}
        </Button>

          <p className="text-sm text-center text-muted-foreground pb-8">
          Başvurunuz onaylandıktan sonra Provider paneline erişim sağlayabilirsiniz.
        </p>
      </form>
      </div>
    </div>
  )
}
