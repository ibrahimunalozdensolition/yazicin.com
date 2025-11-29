"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Moon, Sun, Menu, X, User, LogOut, LayoutDashboard } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { AuthService } from "@/lib/firebase/auth"
import { UserService, UserProfile } from "@/lib/firebase/users"

export function Header() {
  const { setTheme, theme } = useTheme()
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = React.useState(false)

  React.useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const profile = await UserService.getUserProfile(user.uid)
        setUserProfile(profile)
      } else {
        setUserProfile(null)
      }
    }
    fetchProfile()
  }, [user])

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  const handleLogout = async () => {
    await AuthService.logout()
    setIsProfileMenuOpen(false)
    router.push("/")
  }

  const getDashboardLink = () => {
    if (userProfile?.role === "provider") return "/provider"
    if (userProfile?.role === "admin") return "/admin"
    return "/customer"
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
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

        {/* Desktop Navigation - Center */}
        <nav className="hidden md:flex items-center gap-1">
          <Link href="/" className="px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground rounded-md hover:bg-muted">
            Ana Sayfa
          </Link>
          <Link href="/about" className="px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground rounded-md hover:bg-muted">
            Nasıl Çalışır?
          </Link>
          <Link href="/providers" className="px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground rounded-md hover:bg-muted">
            Provider Ol
          </Link>
          <Link href="/contact" className="px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground rounded-md hover:bg-muted">
            İletişim
          </Link>
        </nav>

        {/* Desktop Actions - Right */}
        <div className="hidden md:flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Tema değiştir</span>
          </Button>
          <div className="h-6 w-px bg-border mx-2" />
          
          {loading ? (
            <div className="h-9 w-20 bg-muted animate-pulse rounded-md" />
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  {user.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt="Profil"
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <User className="h-4 w-4 text-primary" />
                  )}
                </div>
                <span className="text-sm font-medium max-w-[120px] truncate">
                  {user.displayName || user.email?.split("@")[0]}
                </span>
              </button>
              
              {isProfileMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsProfileMenuOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-lg z-50 py-1">
                    <Link
                      href={getDashboardLink()}
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                    >
                      <User className="h-4 w-4" />
                      Profilim
                    </Link>
                    <div className="h-px bg-border my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors w-full"
                    >
                      <LogOut className="h-4 w-4" />
                      Çıkış Yap
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="h-9">
                  Giriş Yap
                </Button>
              </Link>
              <Link href="/onboarding">
                <Button size="sm" className="h-9">
                  Kayıt Ol
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Actions */}
        <div className="flex items-center gap-2 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleMenu}>
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex flex-col space-y-1">
              <Link 
                href="/" 
                className="px-3 py-2.5 text-sm font-medium rounded-md hover:bg-muted transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Ana Sayfa
              </Link>
              <Link 
                href="/about" 
                className="px-3 py-2.5 text-sm font-medium rounded-md hover:bg-muted transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Nasıl Çalışır?
              </Link>
              <Link 
                href="/providers" 
                className="px-3 py-2.5 text-sm font-medium rounded-md hover:bg-muted transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Provider Ol
              </Link>
              <Link 
                href="/contact" 
                className="px-3 py-2.5 text-sm font-medium rounded-md hover:bg-muted transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                İletişim
              </Link>
            </nav>
            <div className="flex flex-col gap-2 pt-4 mt-4 border-t border-border/40">
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-2 mb-2">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {user.photoURL ? (
                        <Image
                          src={user.photoURL}
                          alt="Profil"
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-full"
                        />
                      ) : (
                        <User className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.displayName || "Kullanıcı"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <Link href={getDashboardLink()} onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-start h-10 gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Button>
                  </Link>
                  <Link href="/profile" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-start h-10 gap-2">
                      <User className="h-4 w-4" />
                      Profilim
                    </Button>
                  </Link>
                  <Button 
                    variant="destructive" 
                    className="w-full justify-start h-10 gap-2"
                    onClick={() => {
                      handleLogout()
                      setIsMenuOpen(false)
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Çıkış Yap
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-center h-10">
                      Giriş Yap
                    </Button>
                  </Link>
                  <Link href="/onboarding" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full justify-center h-10">
                      Kayıt Ol
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
