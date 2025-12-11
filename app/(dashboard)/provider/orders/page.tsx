"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, Loader2, MessageSquare, Play, Check } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/AuthContext"
import { OrderService, Order, OrderStatus } from "@/lib/firebase/orders"

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: any }> = {
  pending: { label: "Onay Bekliyor", color: "text-amber-500 bg-amber-500/10", icon: Clock },
  accepted: { label: "Onaylandı", color: "text-blue-500 bg-blue-500/10", icon: CheckCircle },
  in_production: { label: "Üretimde", color: "text-purple-500 bg-purple-500/10", icon: Package },
  shipped: { label: "Üretim Bitti", color: "text-cyan-500 bg-cyan-500/10", icon: CheckCircle },
  delivered: { label: "Teslim Edildi", color: "text-green-500 bg-green-500/10", icon: CheckCircle },
  cancelled: { label: "İptal", color: "text-red-500 bg-red-500/10", icon: XCircle },
}

export default function ProviderOrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<OrderStatus | "all">("all")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showProductionForm, setShowProductionForm] = useState<string | null>(null)
  const [productionHours, setProductionHours] = useState("")
  const [productionMinutes, setProductionMinutes] = useState("")

  useEffect(() => {
    if (user) {
      setLoading(true)
      const unsubscribe = OrderService.subscribeToProviderOrders(user.uid, (orders) => {
        setOrders(orders)
        setLoading(false)
      })
      
      return () => {
        unsubscribe()
      }
    }
  }, [user])

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus, hours?: number) => {
    setActionLoading(orderId)
    try {
      const additionalData: Partial<Order> = {}
      if (newStatus === "in_production" && hours !== undefined) {
        additionalData.productionHours = hours
      }
      await OrderService.updateStatus(orderId, newStatus, additionalData)
      if (newStatus === "in_production") {
        setShowProductionForm(null)
        setProductionHours("")
      }
    } catch (error) {
      console.error(error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleStartProduction = async (orderId: string) => {
    const hours = parseInt(productionHours) || 0
    const minutes = parseInt(productionMinutes) || 0
    const totalHours = hours + (minutes / 60)
    if (totalHours > 0) {
      await handleStatusChange(orderId, "in_production", totalHours)
      setProductionMinutes("")
    }
  }

  const filteredOrders = filter === "all" ? orders : orders.filter(o => o.status === filter)

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "-"
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })
  }

  const getNextAction = (status: OrderStatus): { label: string; nextStatus: OrderStatus; icon: any } | null => {
    switch (status) {
      case "pending":
        return { label: "Onayla", nextStatus: "accepted", icon: Check }
      case "accepted":
        return { label: "Üretime Başla", nextStatus: "in_production", icon: Play }
      case "in_production":
        return { label: "Üretim Bitti", nextStatus: "shipped", icon: CheckCircle }
      case "shipped":
        return { label: "Teslim Edildi", nextStatus: "delivered", icon: CheckCircle }
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      <Link 
        href="/provider" 
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Panele Dön
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Siparişler</h1>
        <p className="text-muted-foreground mt-1">Gelen siparişleri yönetin</p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          Tümü ({orders.length})
        </Button>
        {Object.entries(statusConfig).map(([status, config]) => {
          const count = orders.filter(o => o.status === status).length
          if (count === 0) return null
          return (
            <Button
              key={status}
              variant={filter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(status as OrderStatus)}
            >
              {config.label} ({count})
            </Button>
          )
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="py-12">
            <div className="text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Sipariş bulunamadı</h3>
              <p className="text-muted-foreground">
                {filter === "all" ? "Henüz hiç sipariş almadınız" : "Bu durumda sipariş yok"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const status = statusConfig[order.status]
            const StatusIcon = status.icon
            const nextAction = getNextAction(order.status)

            return (
              <Card key={order.id} className="border-border/50 hover:border-border transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-sm text-muted-foreground">#{order.id?.slice(0, 8)}</span>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {status.label}
                        </span>
                      </div>
                      <h3 className="font-medium text-foreground mb-1">{order.fileName}</h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span>Müşteri: {order.customerName}</span>
                        <span>Malzeme: {order.printSettings.material}</span>
                        <span>Adet: {order.printSettings.quantity}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Teslimat: {order.shippingAddress.district}, {order.shippingAddress.city}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right">
                        <p className="text-xl font-bold text-primary">₺{order.price}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="flex gap-2">
                        {nextAction && (
                          <Button
                            size="sm"
                            onClick={() => {
                              if (order.id) {
                                if (nextAction.nextStatus === "in_production") {
                                  setShowProductionForm(order.id)
                                } else {
                                  handleStatusChange(order.id, nextAction.nextStatus)
                                }
                              }
                            }}
                            disabled={actionLoading === order.id}
                            className="gap-1.5"
                          >
                            {actionLoading === order.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <nextAction.icon className="h-4 w-4" />
                            )}
                            {nextAction.label}
                          </Button>
                        )}
                        {order.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => order.id && handleStatusChange(order.id, "cancelled")}
                            disabled={actionLoading === order.id}
                            className="text-red-500 hover:text-red-500 hover:bg-red-500/10"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Link href={`/provider/orders/${order.id}`}>
                          <Button variant="outline" size="sm" className="gap-1.5">
                            <MessageSquare className="h-4 w-4" />
                            Detay
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {showProductionForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md border-primary/50">
            <CardHeader>
              <CardTitle className="text-lg">Üretim Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Toplam Üretim Süresi *</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Input
                      type="number"
                      value={productionHours}
                      onChange={(e) => setProductionHours(e.target.value)}
                      placeholder="Saat"
                      min="0"
                      max="999"
                      autoFocus
                    />
                    <p className="text-xs text-muted-foreground text-center">Saat</p>
                  </div>
                  <div className="space-y-1">
                    <Input
                      type="number"
                      value={productionMinutes}
                      onChange={(e) => setProductionMinutes(e.target.value)}
                      placeholder="Dakika"
                      min="0"
                      max="59"
                    />
                    <p className="text-xs text-muted-foreground text-center">Dakika</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Örn: 2 saat 15 dakika</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => {
                  setShowProductionForm(null)
                  setProductionHours("")
                  setProductionMinutes("")
                }} className="flex-1">
                  İptal
                </Button>
                <Button 
                  onClick={() => showProductionForm && handleStartProduction(showProductionForm)} 
                  disabled={(parseInt(productionHours) || 0) === 0 && (parseInt(productionMinutes) || 0) === 0 || actionLoading === showProductionForm}
                  className="flex-1"
                >
                  {actionLoading === showProductionForm ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      İşleniyor...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Üretime Başla
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

