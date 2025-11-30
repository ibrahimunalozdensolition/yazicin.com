"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Printer, ShoppingBag, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"
import { UserService, UserRole } from "@/lib/firebase/users"

export default function OnboardingPage() {
  const { user, loading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [pageReady, setPageReady] = useState(false)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)

  useEffect(() => {
    let isMounted = true
    
    const checkUserProfile = async () => {
      if (loading) return
      
      if (!user) {
        if (isMounted) {
          setPageReady(true)
          setNeedsOnboarding(true)
        }
        return
      }

      try {
        const profile = await UserService.getUserProfile(user.uid)
        
        if (profile && profile.role) {
          const redirectUrl = profile.role === "provider" 
            ? "/provider" 
            : profile.role === "admin" 
              ? "/admin" 
              : "/customer"
          
          window.location.href = redirectUrl
          return
        }
        
        if (isMounted) {
          setPageReady(true)
          setNeedsOnboarding(true)
        }
      } catch (error) {
        console.error("Profile check error:", error)
        if (isMounted) {
          setPageReady(true)
          setNeedsOnboarding(true)
        }
      }
    }
    
    checkUserProfile()
    
    return () => {
      isMounted = false
    }
  }, [user, loading])

  const handleRoleSelect = async (role: UserRole) => {
    if (user) {
      setIsLoading(true)
      setSelectedRole(role)
      try {
        if (role === "provider") {
          await UserService.createUserProfile(user, { role: "customer" })
          window.location.href = "/provider-application"
        } else {
          await UserService.createUserProfile(user, { role })
          window.location.href = "/customer-setup"
        }
      } catch (error) {
        console.error(error)
        setIsLoading(false)
        setSelectedRole(null)
      }
    }
  }

  if (!pageReady || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  
  if (!needsOnboarding) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 py-16">
      {/* Header */}
      <div className="text-center max-w-2xl mb-12 space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          Hoş Geldiniz!
        </h1>
        <p className="text-lg text-muted-foreground">
          Yazıcın.com'a katılmak için lütfen kullanım amacınızı seçin.
        </p>
      </div>

      {/* Cards */}
      <div className="grid w-full max-w-3xl gap-6 md:grid-cols-2">
        {/* Customer Card */}
        <Card className="relative flex flex-col border-2 border-border/50 transition-all duration-300 hover:border-primary/50 hover:shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <ShoppingBag className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl">Yazıcım Yok</CardTitle>
            <CardDescription className="text-base">
              3D baskı hizmeti almak istiyorum
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pt-4">
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">✓</span>
                <span>3D baskı ihtiyacım var</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">✓</span>
                <span>En yakın yazıcıları bulmak istiyorum</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">✓</span>
                <span>Fiyat karşılaştırması yapmak istiyorum</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">✓</span>
                <span>Güvenli ödeme ile sipariş vermek istiyorum</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter className="pt-4">
            {user ? (
              <Button 
                className="w-full h-11 text-base gap-2"
                onClick={() => handleRoleSelect("customer")}
                disabled={isLoading}
              >
                {isLoading && selectedRole === "customer" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Müşteri Olarak Devam Et
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            ) : (
              <Link href="/register?role=customer" className="w-full">
                <Button className="w-full h-11 text-base gap-2">
                  Müşteri Olarak Devam Et
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </CardFooter>
        </Card>

        {/* Provider Card */}
        <Card className="relative flex flex-col border-2 border-border/50 transition-all duration-300 hover:border-secondary/50 hover:shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/10">
              <Printer className="h-8 w-8 text-secondary" />
            </div>
            <CardTitle className="text-xl">Yazıcım Var</CardTitle>
            <CardDescription className="text-base">
              3D baskı hizmeti vermek istiyorum
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pt-4">
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-xs font-medium text-secondary">✓</span>
                <span>3D yazıcım var ve değerlendirmek istiyorum</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-xs font-medium text-secondary">✓</span>
                <span>Ek gelir elde etmek istiyorum</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-xs font-medium text-secondary">✓</span>
                <span>Siparişleri kolayca yönetmek istiyorum</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-xs font-medium text-secondary">✓</span>
                <span>Kendi çalışma saatlerimi belirlemek istiyorum</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter className="pt-4">
            {user ? (
              <Button 
                variant="secondary"
                className="w-full h-11 text-base gap-2"
                onClick={() => handleRoleSelect("provider")}
                disabled={isLoading}
              >
                {isLoading && selectedRole === "provider" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Provider Başvurusu Yap
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            ) : (
              <Link href="/register?role=provider" className="w-full">
                <Button variant="secondary" className="w-full h-11 text-base gap-2">
                  Provider Başvurusu Yap
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </CardFooter>
        </Card>
      </div>

      {/* Bottom Link */}
      <p className="mt-8 text-sm text-muted-foreground">
        Zaten hesabınız var mı?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Giriş Yap
        </Link>
      </p>
    </div>
  )
}
