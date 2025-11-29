import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, Printer, CheckCircle, Shield, Cuboid, Zap, HeartHandshake, Play } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center text-center py-20 md:py-28 lg:py-36 space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
              </span>
              Türkiye'nin En Büyük 3D Baskı Ağı
            </div>

            {/* Heading */}
            <div className="max-w-4xl space-y-4">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl text-foreground">
                Hayalinizdeki Tasarımları{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Gerçeğe Dönüştürün
                </span>
              </h1>
              <p className="mx-auto max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed">
                STL dosyalarınızı yükleyin, size en yakın profesyonel baskı hizmetini bulun. Hızlı fiyat teklifi, güvenli ödeme ve garantili teslimat.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
              <Link href="/onboarding" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base font-medium gap-2">
                  Hemen Başla
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/about" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 text-base font-medium gap-2">
                  <Play className="h-4 w-4" />
                  Nasıl Çalışır?
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 md:gap-16 pt-8 w-full max-w-lg">
              <div className="flex flex-col items-center space-y-1">
                <span className="text-2xl md:text-3xl font-bold text-foreground">500+</span>
                <span className="text-xs md:text-sm text-muted-foreground">Aktif Yazıcı</span>
              </div>
              <div className="flex flex-col items-center space-y-1">
                <span className="text-2xl md:text-3xl font-bold text-foreground">24 Saat</span>
                <span className="text-xs md:text-sm text-muted-foreground">Ort. Teslimat</span>
              </div>
              <div className="flex flex-col items-center space-y-1">
                <span className="text-2xl md:text-3xl font-bold text-foreground">%100</span>
                <span className="text-xs md:text-sm text-muted-foreground">Memnuniyet</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Neden Yazıcın.com?
            </h2>
            <p className="text-lg text-muted-foreground">
              3D baskı sürecini herkes için erişilebilir, hızlı ve güvenilir hale getiriyoruz.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <FeatureCard 
              icon={<Printer className="h-6 w-6" />}
              iconBg="bg-primary/10"
              iconColor="text-primary"
              title="Geniş Yazıcı Ağı"
              description="Türkiye genelindeki yüzlerce onaylı provider ile ihtiyacınıza en uygun baskı hizmetini, en yakın lokasyondan alın."
            />
            <FeatureCard 
              icon={<Zap className="h-6 w-6" />}
              iconBg="bg-accent/10"
              iconColor="text-accent"
              title="Anında Fiyatlama"
              description="Dosyanızı yükleyin, malzeme ve kalite ayarlarınızı seçin, saniyeler içinde fiyat teklifi alın."
            />
            <FeatureCard 
              icon={<Shield className="h-6 w-6" />}
              iconBg="bg-secondary/10"
              iconColor="text-secondary"
              title="Güvenli Ödeme"
              description="Ödemeniz güvende tutulur. Siz ürünü teslim alıp onaylayana kadar provider'a aktarılmaz."
            />
            <FeatureCard 
              icon={<Cuboid className="h-6 w-6" />}
              iconBg="bg-blue-500/10"
              iconColor="text-blue-500"
              title="Kalite Kontrol"
              description="Tüm providerlar ön elemeden geçer. Puanlama sistemi ile kalite standartları sürekli yüksek tutulur."
            />
            <FeatureCard 
              icon={<HeartHandshake className="h-6 w-6" />}
              iconBg="bg-pink-500/10"
              iconColor="text-pink-500"
              title="7/24 Destek"
              description="Sipariş sürecinin her aşamasında destek ekibimiz yanınızda. Sorularınız cevapsız kalmaz."
            />
            <FeatureCard 
              icon={<CheckCircle className="h-6 w-6" />}
              iconBg="bg-green-500/10"
              iconColor="text-green-500"
              title="Garantili Teslimat"
              description="Söz verilen sürede teslimat garantisi. Gecikme veya hasar durumunda iade/yenileme güvencesi."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 border border-border/50">
            <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative px-6 py-16 md:px-16 md:py-24">
              <div className="max-w-2xl mx-auto text-center space-y-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-card border border-border/50 mb-4">
                  <Image 
                    src="/logo.png" 
                    alt="Yazıcın.com" 
                    width={48} 
                    height={48}
                    className="h-12 w-12"
                  />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                  3D Yazıcınız mı Var?
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  3D yazıcınızı sisteme ekleyerek boş zamanlarınızda ek gelir elde edin. Provider panelimiz ile siparişlerinizi kolayca yönetin, kazancınızı artırın.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                  <Link href="/register?role=provider">
                    <Button size="lg" variant="secondary" className="h-12 px-8 text-base font-medium">
                      Provider Ol & Kazan
                    </Button>
                  </Link>
                  <Link href="/provider-info">
                    <Button size="lg" variant="ghost" className="h-12 px-8 text-base font-medium">
                      Detaylı Bilgi →
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  iconBg, 
  iconColor, 
  title, 
  description 
}: { 
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  title: string
  description: string 
}) {
  return (
    <div className="group relative flex flex-col p-6 bg-card rounded-2xl border border-border/50 transition-all duration-300 hover:shadow-lg hover:border-border">
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${iconBg} ${iconColor} mb-4`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}
