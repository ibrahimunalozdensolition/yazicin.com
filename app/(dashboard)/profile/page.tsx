"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/contexts/AuthContext"
import { UserService, UserProfile } from "@/lib/firebase/users"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, User, Mail, Phone, Shield, Calendar, ArrowLeft } from "lucide-react"

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const data = await UserService.getUserProfile(user.uid)
        setProfile(data)
      }
      setLoading(false)
    }
    fetchProfile()
  }, [user])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const roleLabel = profile?.role === 'provider' ? 'Provider' : profile?.role === 'admin' ? 'Admin' : 'Müşteri'
  const roleColor = profile?.role === 'provider' ? 'bg-secondary text-secondary-foreground' : profile?.role === 'admin' ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground'

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 max-w-2xl">
      {/* Back Button */}
      <Link 
        href={profile?.role === 'provider' ? '/provider' : '/customer'} 
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Panele Dön
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted border border-border">
          {user?.photoURL ? (
            <Image
              src={user.photoURL}
              alt={profile?.displayName || "Profil"}
              width={80}
              height={80}
              className="rounded-full"
            />
          ) : (
            <User className="h-10 w-10 text-muted-foreground" />
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{profile?.displayName || user?.displayName}</h1>
          <p className="text-muted-foreground">{profile?.email || user?.email}</p>
          <span className={`inline-flex items-center mt-2 rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColor}`}>
            {roleLabel}
          </span>
        </div>
      </div>
      
      {/* Profile Card */}
      <Card className="border-border/50 mb-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            Hesap Bilgileri
          </CardTitle>
          <CardDescription>Kişisel bilgilerinizi buradan görüntüleyebilirsiniz.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                Ad Soyad
              </Label>
              <Input value={profile?.displayName || user?.displayName || ""} disabled className="bg-muted/50" />
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                E-posta
              </Label>
              <Input value={profile?.email || user?.email || ""} disabled className="bg-muted/50" />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                Telefon
              </Label>
              <Input value={profile?.phoneNumber || "Belirtilmedi"} disabled className="bg-muted/50" />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Shield className="h-4 w-4" />
                Hesap Türü
              </Label>
              <Input value={roleLabel} disabled className="bg-muted/50" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Status Card */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            Hesap Durumu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">E-posta Doğrulaması</span>
              <span className={`text-sm font-medium ${user?.emailVerified ? 'text-green-500' : 'text-accent'}`}>
                {user?.emailVerified ? 'Doğrulanmış' : 'Doğrulanmamış'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Üyelik Tarihi</span>
              <span className="text-sm font-medium text-foreground">
                {profile?.createdAt ? new Date(profile.createdAt.seconds * 1000).toLocaleDateString('tr-TR') : '-'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
