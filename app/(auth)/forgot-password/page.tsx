"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, ArrowLeft, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { AuthService } from "@/lib/firebase/auth"

const forgotPasswordSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true)
    setError(null)
    try {
      await AuthService.resetPassword(data.email)
      setIsSuccess(true)
    } catch (err: any) {
      console.error(err)
      setError("İşlem başarısız oldu. Lütfen e-posta adresinizi kontrol edin.")
    } finally {
      setIsLoading(false)
    }
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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Şifremi Unuttum</h1>
          <p className="text-sm text-muted-foreground">
            E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.
          </p>
        </div>

        {/* Form Card */}
        <Card className="border-border/50">
          <CardContent className="pt-6">
            {isSuccess ? (
              <div className="text-center space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                  <Mail className="h-8 w-8 text-green-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">E-posta Gönderildi!</h3>
                  <p className="text-sm text-muted-foreground">
                    Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen gelen kutunuzu kontrol edin.
                  </p>
                </div>
                <Button asChild className="w-full h-11">
                  <Link href="/login">Giriş Sayfasına Dön</Link>
                </Button>
              </div>
            ) : (
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

                {error && (
                  <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full h-11" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Bağlantı Gönder
                </Button>
              </form>
            )}
          </CardContent>
          {!isSuccess && (
            <CardFooter className="justify-center border-t border-border/50 py-4">
              <Link 
                href="/login" 
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Giriş ekranına dön
              </Link>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  )
}
