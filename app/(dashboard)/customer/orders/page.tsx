"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Package, Clock, CheckCircle, Truck, XCircle, Loader2, MessageSquare, Star } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { OrderService, Order, OrderStatus } from "@/lib/firebase/orders"
import { ReviewService } from "@/lib/firebase/reviews"

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: any }> = {
  pending: { label: "Onay Bekliyor", color: "text-amber-500 bg-amber-500/10", icon: Clock },
  accepted: { label: "Onaylandı", color: "text-blue-500 bg-blue-500/10", icon: CheckCircle },
  in_production: { label: "Üretimde", color: "text-purple-500 bg-purple-500/10", icon: Package },
  shipped: { label: "Kargoda", color: "text-cyan-500 bg-cyan-500/10", icon: Truck },
  delivered: { label: "Teslim Edildi", color: "text-green-500 bg-green-500/10", icon: CheckCircle },
  cancelled: { label: "İptal", color: "text-red-500 bg-red-500/10", icon: XCircle },
}

export default function CustomerOrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<OrderStatus | "all">("all")
  const [reviewedOrders, setReviewedOrders] = useState<Set<string>>(new Set())

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
      
      const reviewed = new Set<string>()
      for (const order of data) {
        if (order.status === "delivered" && order.id) {
          const hasReview = await ReviewService.hasReviewed(order.id)
          if (hasReview) reviewed.add(order.id)
        }
      }
      setReviewedOrders(reviewed)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = filter === "all" ? orders : orders.filter(o => o.status === filter)

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "-"
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      <Link 
        href="/customer" 
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Panele Dön
      </Link>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Siparişlerim</h1>
          <p className="text-muted-foreground mt-1">Tüm siparişlerinizi buradan takip edin</p>
        </div>
        <Link href="/order/new">
          <Button>Yeni Sipariş</Button>
        </Link>
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
              <p className="text-muted-foreground mb-6">
                {filter === "all" ? "Henüz hiç sipariş vermediniz" : "Bu durumda sipariş yok"}
              </p>
              <Link href="/order/new">
                <Button>İlk Siparişinizi Oluşturun</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const status = statusConfig[order.status]
            const StatusIcon = status.icon
            const canReview = order.status === "delivered" && order.id && !reviewedOrders.has(order.id)

            return (
              <Card key={order.id} className="border-border/50 hover:border-border transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                        <span>Provider: {order.providerName}</span>
                        <span>Malzeme: {order.printSettings.material}</span>
                        <span>Adet: {order.printSettings.quantity}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <p className="text-xl font-bold text-primary">₺{order.price}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                      <div className="flex gap-2">
                        {canReview && (
                          <Link href={`/customer/orders/${order.id}/review`}>
                            <Button variant="outline" size="sm" className="gap-1.5">
                              <Star className="h-4 w-4" />
                              Değerlendir
                            </Button>
                          </Link>
                        )}
                        <Link href={`/customer/orders/${order.id}`}>
                          <Button variant="outline" size="sm" className="gap-1.5">
                            <MessageSquare className="h-4 w-4" />
                            Detay
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {order.trackingNumber && (
                    <div className="mt-4 p-3 rounded-lg bg-muted/50 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Kargo Takip:</span>
                        <span className="font-medium">{order.trackingCompany} - {order.trackingNumber}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

