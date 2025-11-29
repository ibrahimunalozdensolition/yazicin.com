"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, ArrowLeft, CheckCircle, Printer, Building, MapPin, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"
import { ProviderApplicationService } from "@/lib/firebase/providerApplications"

const applicationSchema = z.object({
  phoneNumber: z.string().min(10, "Geçerli bir telefon numarası giriniz"),
  businessName: z.string().min(2, "İşletme adı en az 2 karakter olmalıdır"),
  businessType: z.enum(["individual", "company"]),
  city: z.string().min(2, "İl seçiniz"),
  district: z.string().min(2, "İlçe giriniz"),
  address: z.string().min(10, "Adres en az 10 karakter olmalıdır"),
  printerBrand: z.string().min(2, "Yazıcı markası giriniz"),
  printerModel: z.string().min(2, "Yazıcı modeli giriniz"),
  printerType: z.string().min(2, "Yazıcı tipi seçiniz"),
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

const printerTypes = ["FDM", "SLA", "SLS", "DLP", "Resin"]

export default function ProviderApplicationPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [existingApplication, setExistingApplication] = useState<any>(null)
  const [checkingApplication, setCheckingApplication] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      businessType: "individual",
    },
  })

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
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (existingApplication) {
    const statusColors = {
      pending: "bg-accent/10 text-accent",
      approved: "bg-green-500/10 text-green-500",
      rejected: "bg-destructive/10 text-destructive",
    }
    const statusLabels = {
      pending: "İnceleniyor",
      approved: "Onaylandı",
      rejected: "Reddedildi",
    }

    return (
      <div className="container mx-auto flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 py-16">
        <Card className="w-full max-w-md border-border/50">
          <CardContent className="pt-8 pb-8">
            <div className="text-center space-y-4">
              <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${statusColors[existingApplication.status as keyof typeof statusColors]}`}>
                {existingApplication.status === "approved" ? (
                  <CheckCircle className="h-8 w-8" />
                ) : (
                  <Printer className="h-8 w-8" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Başvurunuz Mevcut</h2>
                <p className="text-muted-foreground mt-2">
                  Daha önce provider başvurusu yapmışsınız.
                </p>
              </div>
              <div className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium ${statusColors[existingApplication.status as keyof typeof statusColors]}`}>
                Durum: {statusLabels[existingApplication.status as keyof typeof statusLabels]}
              </div>
              {existingApplication.status === "approved" && (
                <Link href="/provider">
                  <Button className="w-full mt-4">Provider Paneline Git</Button>
                </Link>
              )}
              {existingApplication.status === "rejected" && existingApplication.adminNote && (
                <div className="text-left mt-4 p-4 rounded-lg bg-muted">
                  <p className="text-sm font-medium text-foreground">Red Sebebi:</p>
                  <p className="text-sm text-muted-foreground mt-1">{existingApplication.adminNote}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 py-16">
        <Card className="w-full max-w-md border-border/50">
          <CardContent className="pt-8 pb-8">
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Başvurunuz Alındı!</h2>
                <p className="text-muted-foreground mt-2">
                  Provider başvurunuz incelemeye alındı. En kısa sürede size dönüş yapacağız.
                </p>
              </div>
              <Link href="/">
                <Button className="w-full mt-4">Ana Sayfaya Dön</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Link 
        href="/" 
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Ana Sayfaya Dön
      </Link>

      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center justify-center gap-2 mb-4">
          <Image src="/logo.png" alt="Yazıcın.com" width={48} height={48} className="h-12 w-12" />
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Provider Başvurusu</h1>
        <p className="text-muted-foreground mt-2">
          3D yazıcınızla gelir elde etmeye başlayın
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              Kişisel Bilgiler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ad Soyad</Label>
                <Input value={user?.displayName || ""} disabled className="bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label>E-posta</Label>
                <Input value={user?.email || ""} disabled className="bg-muted/50" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Telefon Numarası</Label>
              <Input 
                id="phoneNumber" 
                placeholder="05XX XXX XX XX" 
                disabled={isLoading}
                {...register("phoneNumber")}
              />
              {errors.phoneNumber && (
                <p className="text-xs text-destructive">{errors.phoneNumber.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building className="h-5 w-5 text-muted-foreground" />
              İşletme Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">İşletme / Atölye Adı</Label>
              <Input 
                id="businessName" 
                placeholder="Örn: Ahmet'in 3D Atölyesi" 
                disabled={isLoading}
                {...register("businessName")}
              />
              {errors.businessName && (
                <p className="text-xs text-destructive">{errors.businessName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>İşletme Türü</Label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors">
                  <input type="radio" value="individual" {...register("businessType")} className="accent-primary" />
                  <span className="text-sm">Bireysel</span>
                </label>
                <label className="flex items-center gap-2 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors">
                  <input type="radio" value="company" {...register("businessType")} className="accent-primary" />
                  <span className="text-sm">Şirket</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              Konum Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">İl</Label>
                <select
                  id="city"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isLoading}
                  {...register("city")}
                >
                  <option value="">İl Seçiniz</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                {errors.city && (
                  <p className="text-xs text-destructive">{errors.city.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">İlçe</Label>
                <Input 
                  id="district" 
                  placeholder="İlçe giriniz" 
                  disabled={isLoading}
                  {...register("district")}
                />
                {errors.district && (
                  <p className="text-xs text-destructive">{errors.district.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Açık Adres</Label>
              <textarea 
                id="address"
                placeholder="Detaylı adres bilgisi"
                rows={3}
                disabled={isLoading}
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                {...register("address")}
              />
              {errors.address && (
                <p className="text-xs text-destructive">{errors.address.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Printer className="h-5 w-5 text-muted-foreground" />
              Yazıcı Bilgileri
            </CardTitle>
            <CardDescription>
              Sahip olduğunuz 3D yazıcı hakkında bilgi verin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="printerBrand">Yazıcı Markası</Label>
                <Input 
                  id="printerBrand" 
                  placeholder="Örn: Creality, Prusa, Anycubic" 
                  disabled={isLoading}
                  {...register("printerBrand")}
                />
                {errors.printerBrand && (
                  <p className="text-xs text-destructive">{errors.printerBrand.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="printerModel">Yazıcı Modeli</Label>
                <Input 
                  id="printerModel" 
                  placeholder="Örn: Ender 3 V2, MK3S+" 
                  disabled={isLoading}
                  {...register("printerModel")}
                />
                {errors.printerModel && (
                  <p className="text-xs text-destructive">{errors.printerModel.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="printerType">Yazıcı Tipi</Label>
              <select
                id="printerType"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading}
                {...register("printerType")}
              >
                <option value="">Tip Seçiniz</option>
                {printerTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {errors.printerType && (
                <p className="text-xs text-destructive">{errors.printerType.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience">3D Baskı Deneyiminiz</Label>
              <textarea 
                id="experience"
                placeholder="3D baskı konusundaki deneyiminizi kısaca anlatın..."
                rows={4}
                disabled={isLoading}
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                {...register("experience")}
              />
              {errors.experience && (
                <p className="text-xs text-destructive">{errors.experience.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Başvuruyu Gönder
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Başvurunuz onaylandıktan sonra Provider paneline erişim sağlayabilirsiniz.
        </p>
      </form>
    </div>
  )
}

