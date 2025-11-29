"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, Printer, Package, TrendingUp, Clock } from "lucide-react"
import { ProviderApplicationService } from "@/lib/firebase/providerApplications"
import { ContactService } from "@/lib/firebase/contact"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    pendingApplications: 0,
    newMessages: 0,
    totalProviders: 0,
    totalOrders: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [applications, contacts] = await Promise.all([
          ProviderApplicationService.getByStatus("pending"),
          ContactService.getAll(),
        ])
        
        setStats({
          pendingApplications: applications.length,
          newMessages: contacts.filter((c) => c.status === "new").length,
          totalProviders: 0,
          totalOrders: 0,
        })
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Admin Paneli</h1>
        <p className="text-muted-foreground mt-1">Platformu buradan yönetin.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bekleyen Başvurular</CardTitle>
            <Clock className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {loading ? "-" : stats.pendingApplications}
            </div>
            <Link href="/admin/applications" className="text-xs text-primary hover:underline">
              Görüntüle →
            </Link>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Yeni Mesajlar</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {loading ? "-" : stats.newMessages}
            </div>
            <Link href="/admin/messages" className="text-xs text-primary hover:underline">
              Görüntüle →
            </Link>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Provider</CardTitle>
            <Printer className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {loading ? "-" : stats.totalProviders}
            </div>
            <Link href="/admin/providers" className="text-xs text-primary hover:underline">
              Görüntüle →
            </Link>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Sipariş</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {loading ? "-" : stats.totalOrders}
            </div>
            <Link href="/admin/orders" className="text-xs text-primary hover:underline">
              Görüntüle →
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              Hızlı Erişim
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link 
              href="/admin/applications" 
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              <span className="text-sm font-medium">Provider Başvuruları</span>
              <span className="text-xs text-muted-foreground">{stats.pendingApplications} bekliyor</span>
            </Link>
            <Link 
              href="/admin/messages" 
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              <span className="text-sm font-medium">İletişim Mesajları</span>
              <span className="text-xs text-muted-foreground">{stats.newMessages} yeni</span>
            </Link>
            <Link 
              href="/admin/providers" 
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              <span className="text-sm font-medium">Provider Yönetimi</span>
              <span className="text-xs text-muted-foreground">Tüm providerlar</span>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              Son Aktiviteler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-muted-foreground">Henüz aktivite yok</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

