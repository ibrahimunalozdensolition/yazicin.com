import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Users, Globe, Award, ArrowRight } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-20 md:py-28">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Türkiye'nin 3D Baskı Platformu
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Yazıcın.com, 3D baskı ihtiyacı olan bireyler ve kurumlar ile yazıcı sahiplerini bir araya getiren Türkiye'nin en büyük dijital üretim platformudur.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">Misyonumuz</h2>
              <p className="text-muted-foreground leading-relaxed">
                Türkiye genelinde dağınık olan 3D baskı kapasitesini tek platformda toplayarak, bireysel ve kurumsal kullanıcıların 3D baskıya erişimini kolay, şeffaf ve izlenebilir hale getirmek istiyoruz.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Yazıcı sahiplerine yan gelir imkânı sağlarken, tüm süreci dijitalleştirerek ölçeklenebilir bir sistem oluşturuyoruz.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/onboarding">
                  <Button className="gap-2">
                    Hemen Başla
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <Image 
                  src="/logo.png" 
                  alt="Yazıcın.com" 
                  width={200} 
                  height={200}
                  className="w-1/2 h-1/2 object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">Değerlerimiz</h2>
            <p className="text-muted-foreground">
              Platform olarak benimsediğimiz temel ilkeler.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-border/50 text-center">
              <CardContent className="pt-6">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <CheckCircle className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Güvenilirlik</h3>
                <p className="text-sm text-muted-foreground">
                  Tüm işlemleriniz güvence altında. Ödemeniz teslimata kadar korunur.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 text-center">
              <CardContent className="pt-6">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary/10 mb-4">
                  <Users className="h-7 w-7 text-secondary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Topluluk</h3>
                <p className="text-sm text-muted-foreground">
                  Yazıcı sahipleri ve müşterilerden oluşan güçlü bir ekosistem.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 text-center">
              <CardContent className="pt-6">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 mb-4">
                  <Globe className="h-7 w-7 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Erişilebilirlik</h3>
                <p className="text-sm text-muted-foreground">
                  Türkiye'nin her yerinden hizmete kolayca ulaşın.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 text-center">
              <CardContent className="pt-6">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10 mb-4">
                  <Award className="h-7 w-7 text-blue-500" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Kalite</h3>
                <p className="text-sm text-muted-foreground">
                  Onaylı providerlar ve sürekli kalite kontrolü.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Siz de Topluluğumuza Katılın
            </h2>
            <p className="text-muted-foreground">
              İster 3D baskı hizmeti alın, ister yazıcınızla gelir elde edin. Yazıcın.com ile dijital üretimin bir parçası olun.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/onboarding">
                <Button size="lg" className="h-12 px-8">
                  Ücretsiz Kayıt Ol
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="h-12 px-8">
                  Bize Ulaşın
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

