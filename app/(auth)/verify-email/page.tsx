"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Loader2, Mail, CheckCircle, RefreshCw } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { AuthService } from "@/lib/firebase/auth"
import { UserService } from "@/lib/firebase/users"
import { USE_EMULATOR } from "@/lib/firebase/config"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()
  const [isSending, setIsSending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  
  const redirectUrl = searchParams.get("redirect") || "/customer"

  useEffect(() => {
    const checkVerification = async () => {
      if (!loading && !user) {
        router.push("/login")
        return
      }
      
      if (user) {
        if (USE_EMULATOR) {
          const profile = await UserService.getUserProfile(user.uid)
          if (profile?.isEmailVerified) {
            window.location.href = redirectUrl
            return
          }
        } else {
          if (user.emailVerified) {
            window.location.href = redirectUrl
            return
          }
        }
      }
    }
    
    checkVerification()
  }, [user, loading, router, redirectUrl])

  const handleResendVerification = async () => {
    if (!user) return
    
    setIsSending(true)
    setMessage(null)
    try {
      await AuthService.sendVerificationEmail(user)
      setMessage("Doğrulama bağlantısı tekrar gönderildi.")
    } catch (error) {
      console.error(error)
      setMessage("Bir hata oluştu. Lütfen daha sonra tekrar deneyin.")
    } finally {
      setIsSending(false)
    }
  }

  const handleCheckVerification = async () => {
    if (user) {
      await user.reload()
      if (user.emailVerified) {
        window.location.href = redirectUrl
      } else {
        setMessage("E-posta henüz doğrulanmamış. Lütfen gelen kutunuzu kontrol edin.")
      }
    }
  }

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-4">
            <Image 
              src="/logo.png" 
              alt="Yazıcın.com" 
              width={48} 
              height={48}
              className="h-12 w-12"
            />
          </Link>
        </div>

        {/* Card */}
        <Card className="border-border/50">
          <CardContent className="pt-8 pb-8">
            <div className="text-center space-y-6">
              {/* Icon */}
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-10 w-10 text-primary" />
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  E-posta Adresinizi Doğrulayın
                </h1>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{user.email}</span> adresine bir doğrulama bağlantısı gönderdik.
                </p>
              </div>

              {/* Info Box */}
              <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                <p>Hesabınızı aktifleştirmek için e-postanızı kontrol edin ve doğrulama bağlantısına tıklayın.</p>
              </div>

              {/* Success Message */}
              {message && (
                <div className="flex items-center justify-center gap-2 rounded-lg bg-green-500/10 p-3 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  {message}
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                <Button onClick={handleCheckVerification} className="w-full h-11">
                  Doğruladım, Devam Et
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleResendVerification} 
                  disabled={isSending}
                  className="w-full h-11"
                >
                  {isSending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Tekrar Gönder
                </Button>
              </div>

              {/* Help Text */}
              <p className="text-xs text-muted-foreground">
                E-postayı almadınız mı? Spam klasörünü kontrol edin veya tekrar gönderin.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
