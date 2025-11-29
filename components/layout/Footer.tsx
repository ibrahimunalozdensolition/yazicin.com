import Link from "next/link"
import Image from "next/image"
import { Mail, Phone, MapPin } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-muted/30">
      <div className="container mx-auto px-4 md:px-6">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 md:py-16">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <Image 
                src="/logo.png" 
                alt="Yazıcın.com" 
                width={40} 
                height={40}
                className="h-10 w-10"
              />
              <span className="text-xl font-bold tracking-tight">
                Yazıcın<span className="text-primary">.com</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Türkiye'nin en büyük 3D baskı pazar yeri. Hızlı, güvenilir ve kaliteli baskı hizmeti.
            </p>
          </div>
          
          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Hızlı Erişim</h3>
            <nav className="flex flex-col space-y-2.5">
              <Link href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Hakkımızda
              </Link>
              <Link href="/how-it-works" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Nasıl Çalışır?
              </Link>
              <Link href="/providers" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Provider Ol
              </Link>
              <Link href="/faq" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Sıkça Sorulan Sorular
              </Link>
            </nav>
          </div>

          {/* Legal Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Yasal</h3>
            <nav className="flex flex-col space-y-2.5">
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Kullanım Koşulları
              </Link>
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Gizlilik Politikası
              </Link>
              <Link href="/cookies" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Çerez Politikası
              </Link>
              <Link href="/kvkk" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                KVKK Aydınlatma
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">İletişim</h3>
            <div className="flex flex-col space-y-2.5">
              <a href="mailto:info@yazicin.com" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Mail className="h-4 w-4" />
                info@yazicin.com
              </a>
              <a href="tel:+908501234567" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Phone className="h-4 w-4" />
                0850 123 45 67
              </a>
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                İstanbul, Türkiye
              </span>
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-border/40 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            © {new Date().getFullYear()} Yazıcın.com. Tüm hakları saklıdır.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Twitter
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Instagram
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
