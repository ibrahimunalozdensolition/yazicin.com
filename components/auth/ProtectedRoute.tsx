"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { UserService, UserRole } from "@/lib/firebase/users"
import { USE_EMULATOR } from "@/lib/firebase/config"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [checkingRole, setCheckingRole] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      if (loading) return

      if (!user) {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
        return
      }

      let isVerified = false
      if (USE_EMULATOR) {
        const profile = await UserService.getUserProfile(user.uid)
        isVerified = profile?.isEmailVerified || false
      } else {
        isVerified = user.emailVerified
      }

      if (!isVerified) {
        router.push("/verify-email")
        return
      }

      if (allowedRoles && allowedRoles.length > 0) {
        try {
          // Kullanıcı rolünü kontrol et
          const userProfile = await UserService.getUserProfile(user.uid)
          
          if (userProfile && allowedRoles.includes(userProfile.role)) {
            setIsAuthorized(true)
          } else {
            // Yetkisiz erişim -> Kendi dashboardına yönlendir
            if (userProfile?.role === "provider") {
              router.push("/provider")
            } else {
              router.push("/customer")
            }
          }
        } catch (error) {
          console.error("Rol kontrolü hatası:", error)
          // Hata durumunda güvenli tarafta kalıp customer'a atalım veya login'e
          router.push("/login") 
        } finally {
            setCheckingRole(false)
        }
      } else {
        setIsAuthorized(true)
        setCheckingRole(false)
      }
    }

    checkAuth()
  }, [user, loading, router, allowedRoles, pathname])

  if (loading || checkingRole) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return isAuthorized ? <>{children}</> : null
}

