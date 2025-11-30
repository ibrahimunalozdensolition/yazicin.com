"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/contexts/AuthContext"
import { UserService, UserProfile } from "@/lib/firebase/users"
import { ProviderApplicationService, ProviderApplication } from "@/lib/firebase/providerApplications"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  Loader2, User, Mail, Phone, Shield, Calendar, ArrowLeft, 
  Building, MapPin, Printer, FileText, CheckCircle, Clock, 
  XCircle, Edit, BadgeCheck, Briefcase
} from "lucide-react"

interface CustomerAddress {
  city: string
  district: string
  fullAddress: string
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [providerApplication, setProviderApplication] = useState<ProviderApplication | null>(null)
  const [customerAddress, setCustomerAddress] = useState<CustomerAddress | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        // Kullanıcı profilini çek
        const profileData = await UserService.getUserProfile(user.uid)
        setProfile(profileData)
        
        // Provider ise başvuru bilgilerini de çek
        if (profileData?.role === 'provider') {
          const applicationData = await ProviderApplicationService.getByUserId(user.uid)
          setProviderApplication(applicationData)
        }
        
        // Müşteri ise adres bilgisini çek
        if (profileData?.role === 'customer') {
          const { collection, query, where, getDocs } = await import("firebase/firestore")
          const { db } = await import("@/lib/firebase/config")
          
          const addressQuery = query(
            collection(db, "addresses"),
            where("userId", "==", user.uid),
            where("isDefault", "==", true)
          )
          const addressSnapshot = await getDocs(addressQuery)
          
          if (!addressSnapshot.empty) {
            const addressData = addressSnapshot.docs[0].data() as CustomerAddress
            setCustomerAddress(addressData)
          }
        }
      }
      setLoading(false)
    }
    fetchData()
  }, [user])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
            <Loader2 className="h-10 w-10 animate-spin text-primary relative" />
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">Profil yükleniyor...</p>
        </div>
      </div>
    )
  }

  const roleLabel = profile?.role === 'provider' ? 'Provider' : profile?.role === 'admin' ? 'Admin' : 'Müşteri'
  const roleColor = profile?.role === 'provider' 
    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
    : profile?.role === 'admin' 
      ? 'bg-red-500/10 text-red-500 border-red-500/20' 
      : 'bg-primary/10 text-primary border-primary/20'

  const applicationStatusConfig = {
    pending: { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20", icon: Clock, label: "İnceleniyor" },
    approved: { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20", icon: CheckCircle, label: "Onaylandı" },
    rejected: { bg: "bg-red-500/10", text: "text-red-500", border: "border-red-500/20", icon: XCircle, label: "Reddedildi" },
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 md:px-6 py-8 max-w-4xl relative">
        {/* Back Button */}
        <Link 
          href={profile?.role === 'provider' ? '/provider' : profile?.role === 'admin' ? '/admin' : '/customer'} 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-all duration-200 mb-8 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Panele Dön
        </Link>

        {/* Profile Header Card */}
        <Card className="border-border/50 shadow-xl backdrop-blur-sm bg-card/80 overflow-hidden mb-6">
          <div className="h-24 bg-gradient-to-r from-primary/20 via-secondary/10 to-accent/20" />
          <CardContent className="relative pt-0 pb-6">
            <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-12">
              <div className="relative">
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-card border-4 border-card shadow-lg">
                  {user?.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt={profile?.displayName || "Profil"}
                      width={96}
                      height={96}
                      className="rounded-xl"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20">
                      <User className="h-10 w-10 text-primary" />
                    </div>
                  )}
                </div>
                {user?.emailVerified && (
                  <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 border-2 border-card">
                    <BadgeCheck className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-1 pt-2 md:pt-0">
                <h1 className="text-2xl font-bold text-foreground">{profile?.displayName || user?.displayName}</h1>
                <p className="text-muted-foreground">{profile?.email || user?.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium border ${roleColor}`}>
                  <Shield className="h-3.5 w-3.5" />
                  {roleLabel}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Account Info Card */}
          <Card className="border-border/50 shadow-lg backdrop-blur-sm bg-card/80 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                Hesap Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Ad Soyad</Label>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{profile?.displayName || user?.displayName || "-"}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">E-posta</Label>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{profile?.email || user?.email || "-"}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Telefon</Label>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{providerApplication?.phoneNumber || profile?.phoneNumber || "Belirtilmedi"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Status Card */}
          <Card className="border-border/50 shadow-lg backdrop-blur-sm bg-card/80 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-secondary/50 via-secondary to-secondary/50" />
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10">
                  <Calendar className="h-5 w-5 text-secondary" />
                </div>
                Hesap Durumu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                <span className="text-sm text-muted-foreground">E-posta Doğrulaması</span>
                <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${user?.emailVerified ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {user?.emailVerified ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Doğrulanmış
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4" />
                      Doğrulanmamış
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                <span className="text-sm text-muted-foreground">Hesap Türü</span>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${roleColor}`}>
                  {roleLabel}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                <span className="text-sm text-muted-foreground">Üyelik Tarihi</span>
                <span className="text-sm font-medium text-foreground">
                  {profile?.createdAt ? new Date(profile.createdAt.seconds * 1000).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  }) : '-'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Provider-specific information */}
        {profile?.role === 'provider' && providerApplication && (
          <div className="mt-6 space-y-6">
            {/* Provider Application Status */}
            <Card className="border-border/50 shadow-lg backdrop-blur-sm bg-card/80 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-accent/50 via-accent to-accent/50" />
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                      <FileText className="h-5 w-5 text-accent" />
                    </div>
                    Başvuru Durumu
                  </CardTitle>
                  {providerApplication.status && (
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium border ${applicationStatusConfig[providerApplication.status].bg} ${applicationStatusConfig[providerApplication.status].text} ${applicationStatusConfig[providerApplication.status].border}`}>
                      {(() => {
                        const StatusIcon = applicationStatusConfig[providerApplication.status].icon
                        return <StatusIcon className="h-4 w-4" />
                      })()}
                      {applicationStatusConfig[providerApplication.status].label}
                    </span>
                  )}
                </div>
              </CardHeader>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Business Info */}
              <Card className="border-border/50 shadow-lg backdrop-blur-sm bg-card/80 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-emerald-500/50 via-emerald-500 to-emerald-500/50" />
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                      <Building className="h-5 w-5 text-emerald-500" />
                    </div>
                    İşletme Bilgileri
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">İşletme Adı</Label>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{providerApplication.businessName}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">İşletme Türü</Label>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{providerApplication.businessType === 'individual' ? 'Bireysel' : 'Şirket'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Location Info */}
              <Card className="border-border/50 shadow-lg backdrop-blur-sm bg-card/80 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-blue-500/50 via-blue-500 to-blue-500/50" />
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                      <MapPin className="h-5 w-5 text-blue-500" />
                    </div>
                    Konum Bilgileri
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">İl</Label>
                      <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                        <span className="font-medium">{providerApplication.city}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">İlçe</Label>
                      <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                        <span className="font-medium">{providerApplication.district}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Açık Adres</Label>
                    <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                      <span className="font-medium text-sm">{providerApplication.address}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Printer Info */}
            <Card className="border-border/50 shadow-lg backdrop-blur-sm bg-card/80 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-purple-500/50 via-purple-500 to-purple-500/50" />
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
                    <Printer className="h-5 w-5 text-purple-500" />
                  </div>
                  Yazıcı Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Yazıcı Markası</Label>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                      <Printer className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{providerApplication.printerBrand}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Yazıcı Modeli</Label>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                      <Printer className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{providerApplication.printerModel}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">3D Baskı Deneyimi</Label>
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                    <p className="text-sm text-foreground leading-relaxed">{providerApplication.experience}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Application Date */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Başvuru Tarihi: {providerApplication.createdAt ? new Date(providerApplication.createdAt.seconds * 1000).toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : '-'}
            </div>
          </div>
        )}

        {/* Customer specific - Address Info */}
        {profile?.role === 'customer' && customerAddress && (
          <Card className="mt-6 border-border/50 shadow-lg backdrop-blur-sm bg-card/80 overflow-hidden">
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">İl</Label>
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                    <span className="font-medium">{customerAddress.city}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">İlçe</Label>
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                    <span className="font-medium">{customerAddress.district}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Açık Adres</Label>
                <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                  <span className="font-medium text-sm">{customerAddress.fullAddress}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Customer CTA */}
        {profile?.role === 'customer' && (
          <Card className="mt-6 border-border/50 shadow-lg backdrop-blur-sm bg-card/80 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
            <CardContent className="pt-6">
              <div className="text-center py-6 space-y-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mx-auto">
                  <User className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">3D Baskı Hizmeti Al</h3>
                  <p className="text-muted-foreground mt-1 text-sm">
                    STL dosyanızı yükleyin, en yakın yazıcıyı bulun ve sipariş verin.
                  </p>
                </div>
                <Link href="/order/new">
                  <Button className="mt-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                    Yeni Sipariş Ver
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
