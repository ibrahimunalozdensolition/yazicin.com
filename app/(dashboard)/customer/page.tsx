"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Package, Clock, ShoppingBag, ArrowRight, FileUp, Loader2, CheckCircle, Truck, MessageSquare } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { OrderService, Order, OrderStatus } from "@/lib/firebase/orders"

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: any }> = {
  pending: { label: "Onay Bekliyor", color: "text-amber-500 bg-amber-500/10", icon: Clock },
  accepted: { label: "Onaylandı", color: "text-blue-500 bg-blue-500/10", icon: CheckCircle },
  in_production: { label: "Üretimde", color: "text-purple-500 bg-purple-500/10", icon: Package },
  shipped: { label: "Üretim Bitti", color: "text-cyan-500 bg-cyan-500/10", icon: CheckCircle },
  delivered: { label: "Teslim Edildi", color: "text-green-500 bg-green-500/10", icon: CheckCircle },
  cancelled: { label: "İptal", color: "text-red-500 bg-red-500/10", icon: Clock },
}

export default function CustomerDashboard() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0 })

  useEffect(() => {
    if (user) {
      fetchOrders()
    }
  }, [user])

  const fetchOrders = async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await OrderService.getByCustomerId(user.uid)
      setOrders(data)
      
      const active = data.filter(o => ["pending", "accepted", "in_production", "shipped"].includes(o.status)).length
      const completed = data.filter(o => o.status === "delivered").length
      
      setStats({
        total: data.length,
        active,
        completed
      })
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "-"
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })
  }

  const recentOrders = orders.slice(0, 5)

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Hoş Geldiniz!</h1>
          <p className="text-muted-foreground mt-1">Siparişlerinizi buradan takip edebilirsiniz.</p>
        </div>
        <Link href="/order/new">
          <Button className="h-11 gap-2">
            <Plus className="h-4 w-4" />
            Yeni Sipariş Oluştur
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Sipariş</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Tüm zamanlar</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aktif Siparişler</CardTitle>
            <Clock className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.active}</div>
            <p className="text-xs text-muted-foreground mt-1">İşlemde olan</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tamamlanan</CardTitle>
            <Package className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.completed}</div>
            <p className="text-xs text-muted-foreground mt-1">Teslim alınan</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Son Siparişler</CardTitle>
            <Link href="/customer/orders" className="text-sm text-primary hover:underline">
              Tümünü Gör
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <ShoppingBag className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">Henüz siparişiniz yok</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                İlk siparişinizi oluşturmak için STL dosyanızı yükleyin ve en uygun yazıcıyı bulun.
              </p>
              <Link href="/order/new">
                <Button className="gap-2">
                  <FileUp className="h-4 w-4" />
                  Sipariş Oluştur
                </Button>
              </Link>
            </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => {
                  const status = statusConfig[order.status]
                  const StatusIcon = status.icon
                  return (
                    <Link key={order.id} href={`/customer/orders/${order.id}`} className="block">
                      <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs text-muted-foreground">#{order.id?.slice(0, 8)}</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                              <StatusIcon className="h-3 w-3" />
                              {status.label}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-foreground">{order.fileName}</p>
                          <p className="text-xs text-muted-foreground">{order.providerName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">₺{order.price}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Hızlı İşlemler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/order/new" className="block">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FileUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Yeni Sipariş</p>
                    <p className="text-xs text-muted-foreground">STL dosyası yükle</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
            <Link href="/customer/orders" className="block">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                    <Package className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Siparişlerim</p>
                    <p className="text-xs text-muted-foreground">Tüm siparişler</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
            <Link href="/profile" className="block">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                    <Clock className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Profil Ayarları</p>
                    <p className="text-xs text-muted-foreground">Hesap bilgileri</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
