"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { AuthService } from "@/lib/firebase/auth"
import { UserService } from "@/lib/firebase/users"
import { useAuth } from "@/contexts/AuthContext"

const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  password: z.string().min(1, "Şifre gereklidir"),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      if (loading) return
      
      if (user) {
        const profile = await UserService.getUserProfile(user.uid)
        if (profile) {
          if (profile.role === "provider") {
            router.replace("/provider")
          } else if (profile.role === "admin") {
            router.replace("/admin")
          } else {
            router.replace("/customer")
          }
          return
        }
      }
      setCheckingAuth(false)
    }
    
    checkAuth()
  }, [user, loading, router])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)
    setError(null)
    try {
      await AuthService.login(data.email, data.password)
      router.push("/") 
    } catch (err: any) {
      console.error(err)
      setError("Giriş yapılamadı. E-posta veya şifre hatalı.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const user = await AuthService.loginWithGoogle()
      
      const existingProfile = await UserService.getUserProfile(user.uid)
      
      if (!existingProfile) {
        router.push("/onboarding?from=google")
      } else {
        if (existingProfile.role === "provider") {
          router.push("/provider")
        } else {
          router.push("/customer")
        }
      }
    } catch (err) {
      console.error(err)
      setError("Google ile giriş yapılırken bir hata oluştu.")
    } finally {
      setIsLoading(false)
    }
  }

  if (loading || checkingAuth) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo & Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-4">
            <Image 
              src="/logo.png" 
              alt="Yazıcın.com" 
              width={48} 
              height={48}
              className="h-12 w-12"
            />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Giriş Yap</h1>
          <p className="text-sm text-muted-foreground">
            Hesabınıza erişmek için bilgilerinizi girin
          </p>
        </div>

        {/* Form Card */}
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ornek@email.com"
                  disabled={isLoading}
                  className="h-11"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Şifre</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Şifremi unuttum
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  disabled={isLoading}
                  className="h-11"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Giriş Yap
              </Button>
            </form>
            
            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  veya
                </span>
              </div>
            </div>

            {/* Google Login */}
            <Button 
              variant="outline" 
              className="w-full h-11" 
              onClick={handleGoogleLogin} 
              disabled={isLoading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google ile Giriş Yap
            </Button>
          </CardContent>
          <CardFooter className="justify-center border-t border-border/50 py-4">
            <p className="text-sm text-muted-foreground">
              Hesabınız yok mu?{" "}
              <Link href="/onboarding" className="font-medium text-primary hover:underline">
                Kayıt Ol
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
