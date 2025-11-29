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
  const [error, setError] = useState<string | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  const defaultRole = (searchParams.get("role") as "customer" | "provider") || "customer"
  const isProvider = defaultRole === "provider"

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
      await UserService.createUserProfile(user, { role: data.role })
      await AuthService.sendVerificationEmail(user)
      router.push("/verify-email")
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
                disabled={isLoading}
                variant={isProvider ? "secondary" : "default"}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Kayıt Ol
              </Button>
            </form>
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
