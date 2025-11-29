"use client"

import { useState } from "react"
import Image from "next/image"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Mail, Phone, MapPin, Send, Loader2, CheckCircle } from "lucide-react"
import { ContactService } from "@/lib/firebase/contact"

const contactSchema = z.object({
  name: z.string().min(2, "Ad Soyad en az 2 karakter olmalıdır"),
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  subject: z.string().min(3, "Konu en az 3 karakter olmalıdır"),
  message: z.string().min(10, "Mesaj en az 10 karakter olmalıdır"),
})

type ContactFormValues = z.infer<typeof contactSchema>

export default function ContactPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
  })

  const onSubmit = async (data: ContactFormValues) => {
    setIsLoading(true)
    setError(null)
    try {
      await ContactService.submit(data)
      setIsSuccess(true)
      reset()
    } catch (err) {
      console.error(err)
      setError("Mesaj gönderilemedi. Lütfen tekrar deneyin.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              İletişime Geçin
            </h1>
            <p className="text-lg text-muted-foreground">
              Sorularınız, önerileriniz veya işbirliği talepleriniz için bize ulaşın.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Bize Ulaşın</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Herhangi bir sorunuz veya geri bildiriminiz varsa, aşağıdaki kanallardan bize ulaşabilirsiniz. En kısa sürede size dönüş yapacağız.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">E-posta</h3>
                    <a href="mailto:info@yazicin.com" className="text-muted-foreground hover:text-primary transition-colors">
                      info@yazicin.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10 shrink-0">
                    <Phone className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Telefon</h3>
                    <a href="tel:+908501234567" className="text-muted-foreground hover:text-primary transition-colors">
                      0850 123 45 67
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 shrink-0">
                    <MapPin className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Adres</h3>
                    <p className="text-muted-foreground">
                      İstanbul, Türkiye
                    </p>
                  </div>
                </div>
              </div>

              {/* Brand */}
              <div className="pt-8 border-t border-border/50">
                <div className="flex items-center gap-3">
                  <Image 
                    src="/logo.png" 
                    alt="Yazıcın.com" 
                    width={48} 
                    height={48}
                    className="h-12 w-12"
                  />
                  <div>
                    <span className="text-lg font-bold">Yazıcın.com</span>
                    <p className="text-sm text-muted-foreground">Türkiye'nin 3D Baskı Platformu</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Mesaj Gönderin</CardTitle>
                <CardDescription>
                  Formu doldurun, size en kısa sürede dönelim.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isSuccess ? (
                  <div className="text-center py-8 space-y-4">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Mesajınız Alındı!</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        En kısa sürede size dönüş yapacağız.
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsSuccess(false)}
                      className="mt-4"
                    >
                      Yeni Mesaj Gönder
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Ad Soyad</Label>
                        <Input 
                          id="name" 
                          placeholder="Adınız Soyadınız" 
                          className="h-11" 
                          disabled={isLoading}
                          {...register("name")}
                        />
                        {errors.name && (
                          <p className="text-xs text-destructive">{errors.name.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">E-posta</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="ornek@email.com" 
                          className="h-11" 
                          disabled={isLoading}
                          {...register("email")}
                        />
                        {errors.email && (
                          <p className="text-xs text-destructive">{errors.email.message}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="subject">Konu</Label>
                      <Input 
                        id="subject" 
                        placeholder="Mesajınızın konusu" 
                        className="h-11" 
                        disabled={isLoading}
                        {...register("subject")}
                      />
                      {errors.subject && (
                        <p className="text-xs text-destructive">{errors.subject.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Mesaj</Label>
                      <textarea 
                        id="message" 
                        placeholder="Mesajınızı buraya yazın..."
                        rows={5}
                        disabled={isLoading}
                        className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                        {...register("message")}
                      />
                      {errors.message && (
                        <p className="text-xs text-destructive">{errors.message.message}</p>
                      )}
                    </div>

                    {error && (
                      <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                        {error}
                      </div>
                    )}

                    <Button type="submit" className="w-full h-11" disabled={isLoading}>
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Gönder
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}

