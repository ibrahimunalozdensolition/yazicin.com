"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, CheckCircle, User, MapPin, Phone, Sparkles, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/AuthContext"
import { UserService } from "@/lib/firebase/users"
import { ilceler } from "@/lib/data/turkiye-ilce"

const setupSchema = z.object({
  phoneNumber: z.string().min(10, "Geçerli bir telefon numarası giriniz"),
  city: z.string().min(1, "İl seçiniz"),
  district: z.string().min(1, "İlçe seçiniz"),
  address: z.string().min(10, "Adres en az 10 karakter olmalıdır"),
})

type SetupFormValues = z.infer<typeof setupSchema>

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

export default function CustomerSetupPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCity, setSelectedCity] = useState<string>("")
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([])
  const [isComplete, setIsComplete] = useState(false)
  const [checkingRole, setCheckingRole] = useState(true)

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
  })

  const handleCityChange = (city: string) => {
    setSelectedCity(city)
    setValue("city", city)
    setValue("district", "")
    setAvailableDistricts(ilceler[city] || [])
  }

  // Sayfa terkini engelle
  const handleBeforeUnload = useCallback((e: BeforeUnloadEvent) => {
    if (!isComplete) {
      e.preventDefault()
      e.returnValue = "Bilgilerinizi tamamlamadan ayrılamazsınız!"
      return e.returnValue
    }
  }, [isComplete])

  // Tarayıcı geri tuşunu engelle
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (!isComplete) {
        window.history.pushState(null, "", window.location.href)
      }
    }

    // İlk yüklemede history state ekle
    window.history.pushState(null, "", window.location.href)
    window.addEventListener("popstate", handlePopState)
    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("popstate", handlePopState)
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [isComplete, handleBeforeUnload])

  useEffect(() => {
    const checkUserRole = async () => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/customer-setup")
        return
      }

      if (user) {
        try {
          const profile = await UserService.getUserProfile(user.uid)
          if (profile) {
            if (profile.role === "provider") {
              router.push("/provider")
              return
            }
            if (profile.role === "admin") {
              router.push("/admin")
              return
            }
            if (profile.phoneNumber) {
              router.push("/customer")
              return
            }
          }
        } catch (error) {
          console.error("Error checking user role:", error)
        }
        setCheckingRole(false)
      }
    }

    checkUserRole()
  }, [user, authLoading, router])

  const onSubmit = async (data: SetupFormValues) => {
    if (!user) return
    
    setIsLoading(true)
    setError(null)
    try {
      await UserService.ensureUserProfile(user, "customer")
      
      await UserService.updateUserProfile(user.uid, {
        phoneNumber: data.phoneNumber,
      })
      
      const { addDoc, collection, serverTimestamp } = await import("firebase/firestore")
      const { db } = await import("@/lib/firebase/config")
      
      await addDoc(collection(db, "addresses"), {
        userId: user.uid,
        title: "Ev",
        city: data.city,
        district: data.district,
        fullAddress: data.address,
        zipCode: "",
        isDefault: true,
        createdAt: serverTimestamp(),
      })

      setIsComplete(true)
      
      setTimeout(() => {
        window.location.href = "/customer"
      }, 2000)
    } catch (err) {
      console.error(err)
      setError("Bilgiler kaydedilemedi. Lütfen tekrar deneyin.")
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading || checkingRole) {
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

  if (isComplete) {
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
                  <h2 className="text-2xl font-bold text-foreground">Hesabınız Hazır!</h2>
                  <p className="text-muted-foreground">
                    Bilgileriniz başarıyla kaydedildi. Şimdi sipariş vermeye başlayabilirsiniz.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-emerald-600 bg-emerald-500/10 rounded-full px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Yönlendiriliyorsunuz...
                </div>
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

      <div className="container mx-auto px-4 py-8 max-w-xl relative">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl" />
              <div className="relative bg-card border border-border/50 rounded-2xl p-3 shadow-lg">
                <Image src="/logo.png" alt="Yazıcın.com" width={48} height={48} className="h-12 w-12" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3">Son Bir Adım!</h1>
          <p className="text-muted-foreground text-lg">
            Sipariş verebilmek için iletişim ve teslimat bilgilerinizi girin
          </p>
          
          {/* Uyarı mesajı */}
          <div className="mt-6 inline-flex items-center gap-2 text-sm text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-2">
            <AlertTriangle className="h-4 w-4" />
            Bu bilgileri girmeden devam edemezsiniz
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Info */}
          <Card className="border-border/50 shadow-lg backdrop-blur-sm bg-card/80 overflow-hidden">
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
                <Label htmlFor="phoneNumber" className="text-sm font-medium">Telefon Numarası *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="phoneNumber" 
                    placeholder="05XX XXX XX XX" 
                    disabled={isLoading}
                    className="h-11 pl-10 border-border/50 focus:border-primary/50 transition-colors"
                    {...register("phoneNumber")}
                  />
                </div>
                {errors.phoneNumber && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
                    {errors.phoneNumber.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Address Info */}
          <Card className="border-border/50 shadow-lg backdrop-blur-sm bg-card/80 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-accent/50 via-accent to-accent/50" />
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                  <MapPin className="h-5 w-5 text-accent" />
                </div>
                Teslimat Adresi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">İl *</Label>
                  <Select 
                    value={selectedCity} 
                    onValueChange={handleCityChange}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="h-11 hover:border-accent/50 focus:border-accent/50">
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
                  <Label className="text-sm font-medium">İlçe *</Label>
                  <Controller
                    name="district"
                    control={control}
                    render={({ field }) => (
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                        disabled={isLoading || !selectedCity}
                      >
                        <SelectTrigger className="h-11 hover:border-accent/50 focus:border-accent/50">
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
                <Label htmlFor="address" className="text-sm font-medium">Açık Adres *</Label>
                <textarea 
                  id="address"
                  placeholder="Mahalle, sokak, bina no, daire no..."
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
                Kaydediliyor...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Tamamla ve Başla
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Bu bilgileri daha sonra profil ayarlarından değiştirebilirsiniz.
          </p>
        </form>
      </div>
    </div>
  )
}

