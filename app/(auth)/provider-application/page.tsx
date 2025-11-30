"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, ArrowLeft, CheckCircle, Printer, Building, MapPin, User, Sparkles, Clock, BadgeCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"
import { ProviderApplicationService } from "@/lib/firebase/providerApplications"
import { ilceler } from "@/lib/data/turkiye-ilce"

const applicationSchema = z.object({
  phoneNumber: z.string().min(10, "Geçerli bir telefon numarası giriniz"),
  businessName: z.string().min(2, "İşletme adı en az 2 karakter olmalıdır"),
  businessType: z.enum(["individual", "company"]),
  city: z.string().min(1, "İl seçiniz"),
  district: z.string().min(1, "İlçe seçiniz"),
  address: z.string().min(10, "Adres en az 10 karakter olmalıdır"),
  printerBrand: z.string().min(1, "Yazıcı markası seçiniz"),
  printerModel: z.string().min(1, "Yazıcı modeli seçiniz"),
  experience: z.string().min(10, "Deneyiminizi en az 10 karakter ile açıklayınız"),
})

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

const printerBrands: Record<string, string[]> = {
  "Creality": [
    "Ender 3", "Ender 3 V2", "Ender 3 V3", "Ender 3 V3 SE", "Ender 3 V3 KE", "Ender 3 V3 Plus",
    "Ender 3 Pro", "Ender 3 S1", "Ender 3 S1 Pro", "Ender 3 S1 Plus", "Ender 3 Max",
    "Ender 5", "Ender 5 Pro", "Ender 5 Plus", "Ender 5 S1",
    "Ender 6", "Ender 7",
    "CR-10", "CR-10 V2", "CR-10 V3", "CR-10 S", "CR-10 S Pro", "CR-10 S Pro V2",
    "CR-10 Mini", "CR-10 Max", "CR-10 Smart", "CR-10 Smart Pro",
    "CR-6 SE", "CR-6 Max",
    "CR-200B", "CR-30",
    "Sermoon D1", "Sermoon V1", "Sermoon V1 Pro",
    "K1", "K1 Max", "K1C", "K1 SE",
    "Halot One", "Halot One Plus", "Halot One Pro", "Halot Sky", "Halot Mage", "Halot Mage Pro",
    "LD-002H", "LD-002R", "LD-006"
  ],
  "Prusa": [
    "Original Prusa i3 MK3S+", "Original Prusa i3 MK4",
    "Original Prusa MINI", "Original Prusa MINI+",
    "Original Prusa XL",
    "Original Prusa SL1", "Original Prusa SL1S Speed",
    "Prusa Pro HT90", "Prusa Pro AFS"
  ],
  "Anycubic": [
    "Kobra", "Kobra Plus", "Kobra Max", "Kobra Neo", "Kobra Go",
    "Kobra 2", "Kobra 2 Plus", "Kobra 2 Max", "Kobra 2 Neo", "Kobra 2 Pro",
    "Kobra 3", "Kobra 3 Combo",
    "Vyper",
    "Mega S", "Mega X", "Mega Pro", "Mega Zero", "Mega Zero 2.0",
    "Chiron",
    "4Max Pro", "4Max Pro 2.0",
    "Photon", "Photon S", "Photon Zero", "Photon Mono", "Photon Mono X",
    "Photon Mono 4K", "Photon Mono X 6K", "Photon Mono X 6Ks",
    "Photon M3", "Photon M3 Plus", "Photon M3 Max", "Photon M3 Premium",
    "Photon M5", "Photon M5s", "Photon M5s Pro",
    "Photon D2", "Photon Ultra"
  ],
  "Elegoo": [
    "Neptune", "Neptune 2", "Neptune 2S", "Neptune 2D",
    "Neptune 3", "Neptune 3 Pro", "Neptune 3 Plus", "Neptune 3 Max",
    "Neptune 4", "Neptune 4 Pro", "Neptune 4 Plus", "Neptune 4 Max",
    "Mars", "Mars 2", "Mars 2 Pro", "Mars 3", "Mars 3 Pro", "Mars 4 Ultra", "Mars 4 Max", "Mars 4 DLP",
    "Saturn", "Saturn 2", "Saturn 8K", "Saturn 3", "Saturn 3 Ultra", "Saturn 4 Ultra",
    "Jupiter", "Jupiter SE"
  ],
  "Bambu Lab": [
    "A1", "A1 Mini",
    "P1P", "P1S",
    "X1", "X1 Carbon", "X1E"
  ],
  "Voron": [
    "Voron 0", "Voron 0.1", "Voron 0.2",
    "Voron Trident",
    "Voron 2.4",
    "Voron Switchwire",
    "Voron Legacy"
  ],
  "Artillery": [
    "Sidewinder X1", "Sidewinder X2", "Sidewinder X3 Pro", "Sidewinder X3 Plus",
    "Genius", "Genius Pro",
    "Hornet",
    "SWX3", "SWX4"
  ],
  "Flashforge": [
    "Adventurer 3", "Adventurer 3 Lite", "Adventurer 4", "Adventurer 5M", "Adventurer 5M Pro",
    "Creator Pro", "Creator Pro 2", "Creator 3", "Creator 3 Pro", "Creator 4",
    "Dreamer", "Dreamer NX",
    "Finder", "Finder 3",
    "Guider II", "Guider IIS", "Guider 3", "Guider 3 Plus",
    "Hunter", "Hunter S",
    "Foto 8.9", "Foto 13.3"
  ],
  "Raise3D": [
    "Pro2", "Pro2 Plus",
    "Pro3", "Pro3 Plus", "Pro3 HS",
    "E2", "E2CF",
    "RMF500",
    "DF2"
  ],
  "Ultimaker": [
    "Ultimaker 2+", "Ultimaker 2+ Connect",
    "Ultimaker 3", "Ultimaker 3 Extended",
    "Ultimaker S3", "Ultimaker S5", "Ultimaker S7",
    "Ultimaker Factor 4",
    "UltiMaker Method", "UltiMaker Method X", "UltiMaker Method XL"
  ],
  "Formlabs": [
    "Form 2", "Form 3", "Form 3+", "Form 3B", "Form 3B+", "Form 3L", "Form 3BL",
    "Form 4", "Form 4B", "Form 4L", "Form 4BL",
    "Fuse 1", "Fuse 1+ 30W"
  ],
  "Phrozen": [
    "Sonic Mini", "Sonic Mini 4K", "Sonic Mini 8K", "Sonic Mini 8K S",
    "Sonic 4K", "Sonic Mega 8K", "Sonic Mega 8K V2",
    "Sonic Mighty 4K", "Sonic Mighty 8K",
    "Transform", "Transform Fast"
  ],
  "Zortrax": [
    "M200", "M200 Plus", "M300", "M300 Plus", "M300 Dual",
    "Inventure", "Apoller", "Endureal",
    "Inkspire", "Inkspire 2"
  ],
  "QIDI": [
    "X-Smart", "X-Smart 3",
    "X-Plus", "X-Plus 3",
    "X-Max", "X-Max 3",
    "X-CF Pro", "X-Carbon",
    "i-Fast", "i-Mates",
    "Tech I", "Tech II"
  ],
  "Longer": [
    "LK1", "LK4", "LK4 Pro", "LK5", "LK5 Pro",
    "Cube 2", "Cube 2 Mini",
    "Orange 10", "Orange 30", "Orange 4K"
  ],
  "Sovol": [
    "SV01", "SV01 Pro", "SV02", "SV03", "SV04", "SV05", "SV06", "SV06 Plus", "SV07", "SV07 Plus",
    "SV08"
  ],
  "Voxelab": [
    "Aquila", "Aquila X2", "Aquila S2", "Aquila D1", "Aquila C2",
    "Aries", "Proxima 6.0", "Polaris"
  ],
  "Two Trees": [
    "Bluer", "Bluer Plus", "Sapphire Plus", "Sapphire Pro", "Sapphire S",
    "SK1"
  ],
  "Tronxy": [
    "X5SA", "X5SA Pro", "X5SA-400", "X5SA-500",
    "XY-2 Pro", "XY-3 SE",
    "Veho 600", "Veho 800"
  ],
  "Flying Bear": [
    "Ghost 5", "Ghost 6", "Reborn", "Reborn 2",
    "Aone 2"
  ],
  "Kingroon": [
    "KP3S", "KP3S Pro", "KP3S Pro S1", "KP5L", "KP5M",
    "KLP1"
  ],
  "Mingda": [
    "Magician X", "Magician Pro", "Magician Max"
  ],
  "Peopoly": [
    "Phenom", "Phenom L", "Phenom XXL", "Phenom Noir",
    "Moai", "Moai 130"
  ],
  "LulzBot": [
    "TAZ 6", "TAZ Pro", "TAZ Workhorse", "TAZ SideKick",
    "Mini", "Mini 2"
  ],
  "MakerBot": [
    "Replicator+", "Replicator Z18",
    "Method", "Method X", "Method XL",
    "Sketch", "Sketch Large"
  ],
  "Sindoh": [
    "3DWOX 1", "3DWOX 2X", "3DWOX 7X"
  ],
  "BCN3D": [
    "Sigma D25", "Epsilon W27", "Epsilon W50", "Omega I60"
  ],
  "Anker": [
    "AnkerMake M5", "AnkerMake M5C"
  ],
  "Snapmaker": [
    "Snapmaker Original", "Snapmaker 2.0 A150", "Snapmaker 2.0 A250", "Snapmaker 2.0 A350",
    "Snapmaker J1", "Snapmaker Artisan"
  ],
  "Diğer": ["Diğer / Özel Yapım"]
}

export default function ProviderApplicationPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [existingApplication, setExistingApplication] = useState<any>(null)
  const [checkingApplication, setCheckingApplication] = useState(true)
  const [selectedBrand, setSelectedBrand] = useState<string>("")
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [selectedCity, setSelectedCity] = useState<string>("")
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([])


  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      businessType: "individual",
    },
  })

  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand)
    setValue("printerBrand", brand)
    setValue("printerModel", "")
    setAvailableModels(printerBrands[brand] || [])
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
    
    setIsLoading(true)
    setError(null)
    try {
      await ProviderApplicationService.submit({
        ...data,
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
          <Card className="w-full max-w-md border-emerald-500/20 shadow-xl backdrop-blur-sm bg-card/80">
            <CardContent className="pt-10 pb-10">
              <div className="text-center space-y-6">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/20">
                  <CheckCircle className="h-10 w-10 text-emerald-500" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">Başvurunuz Alındı!</h2>
                  <p className="text-muted-foreground">
                    Provider başvurunuz incelemeye alındı. En kısa sürede size dönüş yapacağız.
                  </p>
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
                <Input 
                  id="phoneNumber" 
                  placeholder="05XX XXX XX XX" 
                  disabled={isLoading}
                  className="h-11 border-border/50 focus:border-primary/50 transition-colors"
                  {...register("phoneNumber")}
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
                  <Label htmlFor="city" className="text-sm font-medium">İl</Label>
                  <select
                    id="city"
                    className="flex h-11 w-full rounded-xl border-2 border-border/50 bg-background px-4 py-2 text-sm ring-offset-background focus:outline-none focus:border-accent/50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                    disabled={isLoading}
                    value={selectedCity}
                    onChange={(e) => handleCityChange(e.target.value)}
                  >
                    <option value="">İl Seçiniz</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  {errors.city && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
                      {errors.city.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district" className="text-sm font-medium">İlçe</Label>
                  <select
                    id="district"
                    className="flex h-11 w-full rounded-xl border-2 border-border/50 bg-background px-4 py-2 text-sm ring-offset-background focus:outline-none focus:border-accent/50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                    disabled={isLoading || !selectedCity}
                    {...register("district")}
                  >
                    <option value="">{selectedCity ? "İlçe Seçiniz" : "Önce il seçiniz"}</option>
                    {availableDistricts.map((district) => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
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
                Sahip olduğunuz 3D yazıcı hakkında bilgi verin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="printerBrand" className="text-sm font-medium">Yazıcı Markası</Label>
                  <select
                    id="printerBrand"
                    className="flex h-11 w-full rounded-xl border-2 border-border/50 bg-background px-4 py-2 text-sm ring-offset-background focus:outline-none focus:border-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                    disabled={isLoading}
                    value={selectedBrand}
                    onChange={(e) => handleBrandChange(e.target.value)}
                  >
                    <option value="">Marka Seçiniz</option>
                    {Object.keys(printerBrands).sort().map((brand) => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                  {errors.printerBrand && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
                      {errors.printerBrand.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="printerModel" className="text-sm font-medium">Yazıcı Modeli</Label>
                  <select
                    id="printerModel"
                    className="flex h-11 w-full rounded-xl border-2 border-border/50 bg-background px-4 py-2 text-sm ring-offset-background focus:outline-none focus:border-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                    disabled={isLoading || !selectedBrand}
                    {...register("printerModel")}
                  >
                    <option value="">{selectedBrand ? "Model Seçiniz" : "Önce marka seçiniz"}</option>
                    {availableModels.map((model) => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                  {errors.printerModel && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
                      {errors.printerModel.message}
                    </p>
                  )}
                </div>
              </div>
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
