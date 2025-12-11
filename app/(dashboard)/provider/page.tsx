"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Printer, TrendingUp, DollarSign, Package, ArrowRight, Settings, Clock, CheckCircle, ShieldAlert, Loader2, AlertTriangle, Play, Check, XCircle } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { UserService, UserProfile } from "@/lib/firebase/users"
import { ProviderApplicationService } from "@/lib/firebase/providerApplications"
import { OrderService, Order, OrderStatus } from "@/lib/firebase/orders"
import { PrinterService } from "@/lib/firebase/printers"

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: any }> = {
  pending: { label: "Yeni", color: "text-amber-500 bg-amber-500/10", icon: Clock },
  accepted: { label: "Onaylandı", color: "text-blue-500 bg-blue-500/10", icon: CheckCircle },
  in_production: { label: "Üretimde", color: "text-purple-500 bg-purple-500/10", icon: Package },
  shipped: { label: "Üretim Bitti", color: "text-cyan-500 bg-cyan-500/10", icon: CheckCircle },
  delivered: { label: "Teslim", color: "text-green-500 bg-green-500/10", icon: CheckCircle },
  cancelled: { label: "İptal", color: "text-red-500 bg-red-500/10", icon: XCircle },
}

export default function ProviderDashboard() {
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState({ earnings: 0, active: 0, completed: 0, printers: 0 })
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return
      
      try {
        const userProfile = await UserService.getUserProfile(user.uid)
        setProfile(userProfile)
        
        if (userProfile && !userProfile.verifiedByAdmin) {
          const application = await ProviderApplicationService.getByUserId(user.uid)
          if (application) {
            setApplicationStatus(application.status)
          }
        } else if (userProfile?.verifiedByAdmin) {
          const [ordersData, printersData] = await Promise.all([
            OrderService.getByProviderId(user.uid),
            PrinterService.getByProviderId(user.uid)
          ])
          
          setOrders(ordersData)
          
          const active = ordersData.filter(o => ["pending", "accepted", "in_production"].includes(o.status)).length
          const completed = ordersData.filter(o => o.status === "delivered").length
          const earnings = ordersData
            .filter(o => o.status === "delivered")
            .reduce((sum, o) => sum + (o.price || 0), 0)
          
          setStats({
            earnings,
            active,
            completed,
            printers: printersData.length
          })
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (!authLoading) {
      fetchData()
    }
  }, [user, authLoading])

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setActionLoading(orderId)
    try {
      await OrderService.updateStatus(orderId, newStatus)
      const updatedOrders = await OrderService.getByProviderId(user!.uid)
      setOrders(updatedOrders)
    } catch (error) {
      console.error(error)
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "-"
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })
  }

  const getNextAction = (status: OrderStatus): { label: string; nextStatus: OrderStatus; icon: any } | null => {
    switch (status) {
      case "pending":
        return { label: "Onayla", nextStatus: "accepted", icon: Check }
      case "accepted":
        return { label: "Başla", nextStatus: "in_production", icon: Play }
      case "in_production":
        return { label: "Üretim Bitti", nextStatus: "shipped", icon: CheckCircle }
      default:
        return null
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (profile && !profile.verifiedByAdmin) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardContent className="py-12">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10 mb-6">
                  <Clock className="h-10 w-10 text-amber-500" />
                </div>
                
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                  Admin Onayı Bekleniyor
                </h1>
                
                <p className="text-muted-foreground mb-6 max-w-md">
                  Provider başvurunuz incelenmektedir. Onay süreci tamamlandığında 
                  e-posta ile bilgilendirileceksiniz.
                </p>

                <div className="w-full max-w-sm bg-background rounded-lg border border-border/50 p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Başvuru Durumu:</span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                      applicationStatus === "pending" 
                        ? "bg-amber-500/10 text-amber-500" 
                        : applicationStatus === "rejected"
                        ? "bg-red-500/10 text-red-500"
                        : "bg-blue-500/10 text-blue-500"
                    }`}>
                      {applicationStatus === "pending" && (
                        <>
                          <Clock className="h-3.5 w-3.5" />
                          İnceleniyor
                        </>
                      )}
                      {applicationStatus === "rejected" && (
                        <>
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Reddedildi
                        </>
                      )}
                      {!applicationStatus && (
                        <>
                          <ShieldAlert className="h-3.5 w-3.5" />
                          Başvuru Bulunamadı
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 w-full max-w-md">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <CheckCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">Profil Oluşturuldu</p>
                      <p className="text-xs text-muted-foreground">Bilgileriniz kaydedildi</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
                      <Clock className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">Onay Bekleniyor</p>
                      <p className="text-xs text-muted-foreground">1-3 iş günü</p>
                    </div>
                  </div>
                </div>

                {applicationStatus === "rejected" && (
                  <div className="mt-6 p-4 rounded-lg bg-red-500/5 border border-red-500/20 text-left w-full max-w-md">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-500">Başvurunuz Reddedildi</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Lütfen bilgilerinizi kontrol edip tekrar başvurun veya destek ile iletişime geçin.
                        </p>
                        <Link href="/provider-application" className="mt-3 inline-block">
                          <Button variant="outline" size="sm" className="border-red-500/20 text-red-500 hover:bg-red-500/10">
                            Yeniden Başvur
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {!applicationStatus && (
                  <div className="mt-6">
                    <Link href="/provider-application">
                      <Button className="gap-2">
                        Provider Başvurusu Yap
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Sorularınız mı var?{" "}
            <Link href="/contact" className="text-primary hover:underline">
              Bizimle iletişime geçin
            </Link>
          </p>
        </div>
      </div>
    )
  }

  const pendingOrders = orders.filter(o => o.status === "pending")
  const activeOrders = orders.filter(o => ["accepted", "in_production", "shipped"].includes(o.status))
  const recentOrders = [...pendingOrders, ...activeOrders].slice(0, 5)

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
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

      {pendingOrders.length > 0 && (
        <Card className="mb-6 border-amber-500/50 bg-amber-500/5">
        <CardContent className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
              <Clock className="h-5 w-5 text-amber-500" />
          </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{pendingOrders.length} Yeni Sipariş Bekliyor</p>
              <p className="text-xs text-muted-foreground">Onay bekleyen siparişleriniz var.</p>
          </div>
            <Link href="/provider/orders">
              <Button size="sm" variant="outline">Görüntüle</Button>
            </Link>
        </CardContent>
      </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Kazanç</CardTitle>
            <DollarSign className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">₺{stats.earnings.toLocaleString("tr-TR")}</div>
            <p className="text-xs text-muted-foreground mt-1">Tamamlanan siparişler</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aktif Siparişler</CardTitle>
            <Clock className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.active}</div>
            <p className="text-xs text-muted-foreground mt-1">Bekleyen / Üretimde</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tamamlanan</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.completed}</div>
            <p className="text-xs text-muted-foreground mt-1">Toplam sipariş</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Yazıcı Sayısı</CardTitle>
            <Printer className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.printers}</div>
            <p className="text-xs text-muted-foreground mt-1">Kayıtlı yazıcı</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Gelen Siparişler</CardTitle>
            <Link href="/provider/orders" className="text-sm text-primary hover:underline">
              Tümünü Gör
            </Link>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
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
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => {
                  const status = statusConfig[order.status]
                  const StatusIcon = status.icon
                  const nextAction = getNextAction(order.status)
                  
                  return (
                    <div key={order.id} className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs text-muted-foreground">#{order.id?.slice(0, 8)}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-foreground">{order.fileName}</p>
                        <p className="text-xs text-muted-foreground">{order.customerName} • {formatDate(order.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-primary mr-2">₺{order.price}</p>
                        {nextAction && (
                          <Button
                            size="sm"
                            onClick={() => order.id && handleStatusChange(order.id, nextAction.nextStatus)}
                            disabled={actionLoading === order.id}
                            className="gap-1"
                          >
                            {actionLoading === order.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <nextAction.icon className="h-3 w-3" />
                            )}
                            {nextAction.label}
                          </Button>
                        )}
                        <Link href={`/provider/orders/${order.id}`}>
                          <Button variant="outline" size="sm">Detay</Button>
                        </Link>
                      </div>
                    </div>
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
            <Link href="/provider/orders" className="block">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                    <Package className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Siparişler</p>
                    <p className="text-xs text-muted-foreground">Tümünü yönet</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
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
    </div>
  )
}
