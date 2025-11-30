"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
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

const registerSchema = z.object({
  displayName: z.string().min(2, "Ad Soyad en az 2 karakter olmalıdır"),
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
  confirmPassword: z.string(),
  role: z.enum(["customer", "provider"]),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Şifreler eşleşmiyor",
  path: ["confirmPassword"],
})

type RegisterFormValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  const defaultRole = (searchParams.get("role") as "customer" | "provider") || "customer"
  const isProvider = defaultRole === "provider"

  useEffect(() => {
    if (loading) return
    
    if (user) {
      UserService.getUserProfile(user.uid).then(profile => {
        if (profile) {
          const redirectUrl = profile.role === "provider" 
            ? "/provider" 
            : profile.role === "admin" 
              ? "/admin" 
              : "/customer"
          window.location.href = redirectUrl
        } else {
          setCheckingAuth(false)
        }
      })
      return
    }
    
    setCheckingAuth(false)
  }, [user, loading, router])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: defaultRole,
    },
  })

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true)
    setError(null)
    try {
      const user = await AuthService.register(data.email, data.password, data.displayName)
      if (data.role === "provider") {
        await UserService.createUserProfile(user, { role: "provider" })
        await AuthService.sendVerificationEmail(user, "/provider-application")
        router.push("/verify-email?redirect=/provider-application")
      } else {
        await UserService.createUserProfile(user, { role: data.role })
        await AuthService.sendVerificationEmail(user, "/customer-setup")
        router.push("/verify-email?redirect=/customer-setup")
      }
    } catch (err: any) {
      console.error(err)
      if (err.code === "auth/email-already-in-use") {
        setError("Bu e-posta adresi zaten kullanımda.")
      } else {
        setError("Kayıt işlemi sırasında bir hata oluştu. Lütfen tekrar deneyiniz.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setGoogleLoading(true)
    setError(null)
    try {
      const user = await AuthService.loginWithGoogle()
      const existingProfile = await UserService.getUserProfile(user.uid)
      
      if (!existingProfile) {
        if (isProvider) {
          await UserService.createUserProfile(user, { role: "provider" })
          router.push("/provider-application")
        } else {
          await UserService.createUserProfile(user, { role: "customer" })
          router.push("/customer-setup")
        }
      } else {
        const redirectUrl = existingProfile.role === "provider" 
          ? "/provider" 
          : existingProfile.role === "admin" 
            ? "/admin" 
            : "/customer"
        window.location.href = redirectUrl
      }
    } catch (err: any) {
      console.error(err)
      setError("Google ile kayıt olurken bir hata oluştu.")
    } finally {
      setGoogleLoading(false)
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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Hesap Oluştur</h1>
          <p className="text-sm text-muted-foreground">
            {isProvider ? "Provider" : "Müşteri"} hesabınızı oluşturmak için bilgilerinizi girin
          </p>
        </div>
        
        {/* Form Card */}
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Ad Soyad</Label>
                <Input
                  id="displayName"
                  placeholder="Ahmet Yılmaz"
                  disabled={isLoading}
                  className="h-11"
                  {...register("displayName")}
                />
                {errors.displayName && (
                  <p className="text-xs text-destructive">{errors.displayName.message}</p>
                )}
              </div>
              
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
                <Label htmlFor="password">Şifre</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="En az 6 karakter"
                  disabled={isLoading}
                  className="h-11"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Şifre Tekrar</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Şifrenizi tekrar girin"
                  disabled={isLoading}
                  className="h-11"
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>

              <input type="hidden" {...register("role")} />

              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-11" 
                disabled={isLoading || googleLoading}
                variant={isProvider ? "secondary" : "default"}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Kayıt Ol
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

            {/* Google Signup */}
            <Button 
              variant="outline" 
              className="w-full h-11" 
              onClick={handleGoogleSignup} 
              disabled={isLoading || googleLoading}
              type="button"
            >
              {googleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Google ile Kayıt Ol
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 border-t border-border/50 py-4">
            <p className="text-sm text-muted-foreground text-center">
              Zaten hesabınız var mı?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Giriş Yap
              </Link>
            </p>
            <p className="text-xs text-muted-foreground text-center">
              Kayıt olarak{" "}
              <Link href="/terms" className="underline hover:text-foreground transition-colors">
                Kullanım Koşulları
              </Link>
              {" "}ve{" "}
              <Link href="/privacy" className="underline hover:text-foreground transition-colors">
                Gizlilik Politikası
              </Link>
              'nı kabul etmiş olursunuz.
            </p>
          </CardFooter>
        </Card>

        {/* Switch Role Link */}
        <p className="text-center text-sm text-muted-foreground">
          {isProvider ? "Müşteri misiniz? " : "Provider mı olmak istiyorsunuz? "}
          <Link 
            href={isProvider ? "/register?role=customer" : "/register?role=provider"} 
            className="font-medium text-primary hover:underline"
          >
            {isProvider ? "Müşteri olarak kayıt ol" : "Provider olarak kayıt ol"}
          </Link>
        </p>
      </div>
    </div>
  )
}
