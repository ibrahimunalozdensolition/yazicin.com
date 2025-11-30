"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { useAuth } from "@/contexts/AuthContext"
import { UserService } from "@/lib/firebase/users"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [checking, setChecking] = useState(true)
  const [hasRequiredInfo, setHasRequiredInfo] = useState(false)

  useEffect(() => {
    const checkUserInfo = async () => {
      if (authLoading) return
      
      if (!user) {
        setChecking(false)
        return
      }

      try {
        // Kullanıcı profilini kontrol et
        const profile = await UserService.getUserProfile(user.uid)
        
        // Telefon numarası var mı?
        const hasPhone = !!profile?.phoneNumber
        
        // Adres var mı?
        const addressQuery = query(
          collection(db, "addresses"),
          where("userId", "==", user.uid)
        )
        const addressSnapshot = await getDocs(addressQuery)
        const hasAddress = !addressSnapshot.empty

        if (!hasPhone || !hasAddress) {
          // Bilgiler eksik, setup'a yönlendir
          router.replace("/customer-setup")
          return
        }

        setHasRequiredInfo(true)
      } catch (error) {
        console.error("Error checking user info:", error)
      } finally {
        setChecking(false)
      }
    }

    checkUserInfo()
  }, [user, authLoading, router])

  if (authLoading || checking) {
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

  if (!hasRequiredInfo) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
            <Loader2 className="h-10 w-10 animate-spin text-primary relative" />
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">Yönlendiriliyorsunuz...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["customer"]}>
      <div className="flex min-h-screen flex-col">
        {children}
      </div>
    </ProtectedRoute>
  )
}
