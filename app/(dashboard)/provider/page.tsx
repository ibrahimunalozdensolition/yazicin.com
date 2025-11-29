"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Printer, TrendingUp, DollarSign, Package, ArrowRight, Settings, Clock, CheckCircle } from "lucide-react"

export default function ProviderDashboard() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Provider Paneli</h1>
          <p className="text-muted-foreground mt-1">Siparişlerinizi ve kazançlarınızı yönetin.</p>
        </div>
        <Link href="/provider/printers/new">
          <Button className="h-11 gap-2">
            <Printer className="h-4 w-4" />
            Yazıcı Ekle
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Kazanç</CardTitle>
            <DollarSign className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">₺0</div>
            <p className="text-xs text-muted-foreground mt-1">
              Bu ay
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aktif Siparişler</CardTitle>
            <Clock className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">0</div>
            <p className="text-xs text-muted-foreground mt-1">
              Bekleyen / Üretimde
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tamamlanan</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">0</div>
            <p className="text-xs text-muted-foreground mt-1">
              Toplam sipariş
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Yazıcı Sayısı</CardTitle>
            <Printer className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">0</div>
            <p className="text-xs text-muted-foreground mt-1">
              Kayıtlı yazıcı
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Orders List */}
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Gelen Siparişler</CardTitle>
            <Link href="/provider/orders" className="text-sm text-primary hover:underline">
              Tümünü Gör
            </Link>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">Henüz sipariş yok</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                Yazıcılarınızı ekleyip fiyatlandırmanızı yapılandırdıktan sonra siparişler burada görünecek.
              </p>
              <Link href="/provider/printers/new">
                <Button className="gap-2">
                  <Printer className="h-4 w-4" />
                  Yazıcı Ekle
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Hızlı İşlemler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/provider/printers" className="block">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Printer className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Yazıcılarım</p>
                    <p className="text-xs text-muted-foreground">Yönet ve ekle</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
            <Link href="/provider/earnings" className="block">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                    <TrendingUp className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Kazançlarım</p>
                    <p className="text-xs text-muted-foreground">Gelir takibi</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
            <Link href="/provider/settings" className="block">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                    <Settings className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Ayarlar</p>
                    <p className="text-xs text-muted-foreground">Fiyatlandırma & Profil</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Status Banner */}
      <Card className="mt-6 border-accent/50 bg-accent/5">
        <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
              <Clock className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Hesabınız Onay Bekliyor</p>
              <p className="text-xs text-muted-foreground">Provider başvurunuz inceleniyor.</p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            Durumu Kontrol Et
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
