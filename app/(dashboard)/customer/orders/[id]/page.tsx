"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Package, Clock, CheckCircle, Truck, XCircle, Loader2, Send, MapPin, Printer, Star, DollarSign, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/AuthContext"
import { OrderService, Order, OrderStatus } from "@/lib/firebase/orders"
import { MessageService, Message } from "@/lib/firebase/messages"
import { ReviewService } from "@/lib/firebase/reviews"

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: any; step: number }> = {
  pending: { label: "Onay Bekliyor", color: "text-amber-500", icon: Clock, step: 1 },
  accepted: { label: "Onaylandı", color: "text-blue-500", icon: CheckCircle, step: 2 },
  in_production: { label: "Üretimde", color: "text-purple-500", icon: Package, step: 3 },
  shipped: { label: "Kargoda", color: "text-cyan-500", icon: Truck, step: 4 },
  delivered: { label: "Teslim Edildi", color: "text-green-500", icon: CheckCircle, step: 5 },
  cancelled: { label: "İptal Edildi", color: "text-red-500", icon: XCircle, step: 0 },
}

const steps = [
  { status: "pending", label: "Onay Bekliyor" },
  { status: "accepted", label: "Onaylandı" },
  { status: "in_production", label: "Üretimde" },
  { status: "shipped", label: "Kargoda" },
  { status: "delivered", label: "Teslim Edildi" },
]

export default function OrderDetailPage() {
  const params = useParams()
  const orderId = params.id as string
  const { user } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [hasReviewed, setHasReviewed] = useState(false)
  const [priceActionLoading, setPriceActionLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (orderId) {
      setLoading(true)
      
      const unsubscribeOrder = OrderService.subscribeToOrder(orderId, (orderData) => {
        if (orderData) {
          setOrder(orderData)
          if (orderData.status === "delivered") {
            ReviewService.hasReviewed(orderId).then(setHasReviewed)
          }
          setLoading(false)
        } else {
          setOrder(null)
          setLoading(false)
        }
      })
      
      const unsubscribeMessages = MessageService.subscribeToMessages(orderId, (msgs) => {
        setMessages(msgs)
        setTimeout(() => scrollToBottom(), 100)
      })
      
      return () => {
        unsubscribeOrder()
        unsubscribeMessages()
      }
    }
  }, [orderId])

  useEffect(() => {
    setTimeout(() => scrollToBottom(), 100)
  }, [messages])

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !order) return
    
    setSending(true)
    try {
      await MessageService.send({
        orderId,
        senderId: user.uid,
        senderName: user.displayName || "Müşteri",
        senderRole: "customer",
        content: newMessage.trim(),
      })
      setNewMessage("")
      setTimeout(() => scrollToBottom(), 100)
    } catch (error) {
      console.error(error)
    } finally {
      setSending(false)
    }
  }

  const handlePriceChangeResponse = async (accept: boolean) => {
    if (!order?.id) return
    setPriceActionLoading(true)
    try {
      await OrderService.respondToPriceChange(order.id, accept)
    } catch (error) {
      console.error(error)
    } finally {
      setPriceActionLoading(false)
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "-"
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
  }

  const formatTime = (timestamp: any) => {
    if (!timestamp) return ""
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-8">
        <Card className="border-border/50">
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Sipariş bulunamadı</h3>
            <Link href="/customer/orders">
              <Button variant="outline">Siparişlere Dön</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentStep = statusConfig[order.status].step

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      <Link 
        href="/customer/orders" 
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Siparişlere Dön
      </Link>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-foreground">Sipariş #{orderId.slice(0, 8)}</h1>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusConfig[order.status].color} bg-current/10`}>
              {statusConfig[order.status].label}
            </span>
          </div>
          <p className="text-muted-foreground">{formatDate(order.createdAt)}</p>
        </div>
        {order.status === "delivered" && !hasReviewed && (
          <Link href={`/customer/orders/${orderId}/review`}>
            <Button className="gap-2">
              <Star className="h-4 w-4" />
              Değerlendir
            </Button>
          </Link>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {order.status !== "cancelled" && (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Sipariş Durumu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-muted" />
                  <div className="space-y-6">
                    {steps.map((step, index) => {
                      const isCompleted = currentStep > index + 1
                      const isCurrent = currentStep === index + 1
                      return (
                        <div key={step.status} className="relative flex items-center gap-4">
                          <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                            isCompleted ? "bg-primary border-primary" : 
                            isCurrent ? "bg-primary/10 border-primary" : 
                            "bg-background border-muted"
                          }`}>
                            {isCompleted ? (
                              <CheckCircle className="h-4 w-4 text-white" />
                            ) : (
                              <span className={`text-xs font-medium ${isCurrent ? "text-primary" : "text-muted-foreground"}`}>
                                {index + 1}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className={`font-medium ${isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground"}`}>
                              {step.label}
                            </p>
                            {isCurrent && (
                              <p className="text-xs text-muted-foreground">Şu anki durum</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {order.proposedPrice && order.priceChangeStatus === "pending" && (
            <Card className="border-amber-500/50 bg-amber-500/5">
              <CardContent className="py-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-amber-500 mb-2">Fiyat Değişikliği Önerisi</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                        <span className="text-muted-foreground">Mevcut Fiyat:</span>
                        <span className="font-medium text-foreground">₺{order.price}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <span className="text-muted-foreground">Önerilen Fiyat:</span>
                        <span className="font-bold text-amber-600">₺{order.proposedPrice}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-background/50">
                        <span className="text-muted-foreground">Fark:</span>
                        <span className={`font-medium ${order.proposedPrice > order.price ? "text-red-500" : "text-green-500"}`}>
                          {order.proposedPrice > order.price ? "+" : ""}₺{Math.abs(order.proposedPrice - order.price)}
                        </span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          onClick={() => handlePriceChangeResponse(false)}
                          disabled={priceActionLoading}
                          className="flex-1 text-red-500 hover:text-red-500 hover:bg-red-500/10"
                        >
                          {priceActionLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Reddet"
                          )}
                        </Button>
                        <Button
                          onClick={() => handlePriceChangeResponse(true)}
                          disabled={priceActionLoading}
                          className="flex-1"
                        >
                          {priceActionLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Onayla
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {order.status === "in_production" && order.productionHours && order.productionStartedAt && (
            <Card className="border-purple-500/50 bg-purple-500/5">
              <CardContent className="py-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10">
                    <Package className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-purple-500 mb-2">Üretim Bilgileri</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Toplam üretim süresi:</span>
                        <span className="font-medium text-foreground">{order.productionHours} saat</span>
                      </div>
                      {(() => {
                        const startedAt = order.productionStartedAt?.toDate ? order.productionStartedAt.toDate() : new Date(order.productionStartedAt)
                        const endTime = new Date(startedAt.getTime() + order.productionHours * 60 * 60 * 1000)
                        const now = new Date()
                        const remainingMs = endTime.getTime() - now.getTime()
                        const remainingHours = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60)))
                        const estimatedDelivery = new Date(endTime.getTime() + 2 * 24 * 60 * 60 * 1000)
                        
                        return (
                          <>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Üretim başlangıcı:</span>
                              <span className="font-medium text-foreground">
                                {startedAt.toLocaleDateString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Üretim bitişi:</span>
                              <span className="font-medium text-foreground">
                                {endTime.toLocaleDateString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            {remainingMs > 0 ? (
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-purple-500" />
                                <span className="text-muted-foreground">Kalan süre:</span>
                                <span className="font-medium text-purple-500">{remainingHours} saat</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-green-500 font-medium">Üretim tamamlandı</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Tahmini teslimat:</span>
                              <span className="font-medium text-foreground">
                                {estimatedDelivery.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}
                              </span>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {order.status === "cancelled" && (
            <Card className="border-red-500/50 bg-red-500/5">
              <CardContent className="py-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
                    <XCircle className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-red-500">Sipariş İptal Edildi</h3>
                    {order.cancelReason && (
                      <p className="text-sm text-muted-foreground mt-1">Sebep: {order.cancelReason}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Mesajlar</CardTitle>
            </CardHeader>
            <CardContent>
              <div ref={messagesContainerRef} className="h-[300px] overflow-y-auto mb-4 space-y-3 p-3 rounded-lg bg-muted/30">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    Henüz mesaj yok. Provider ile iletişime geçin.
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderRole === "customer" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        msg.senderRole === "customer"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted rounded-bl-md"
                      }`}>
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${
                          msg.senderRole === "customer" ? "text-primary-foreground/70" : "text-muted-foreground"
                        }`}>
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Mesajınızı yazın..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                  disabled={sending}
                />
                <Button onClick={handleSendMessage} disabled={!newMessage.trim() || sending}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Sipariş Detayları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Dosya</p>
                <p className="font-medium">{order.fileName}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Malzeme</p>
                  <p className="font-medium">{order.printSettings.material}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Renk</p>
                  <p className="font-medium">{order.printSettings.color}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Doluluk</p>
                  <p className="font-medium">{order.printSettings.infill}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Adet</p>
                  <p className="font-medium">{order.printSettings.quantity}</p>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="space-y-2">
                  {order.proposedPrice && order.priceChangeStatus === "pending" && (
                    <div className="flex justify-between items-center p-2 rounded-lg bg-amber-500/10">
                      <p className="text-sm text-muted-foreground">Önerilen:</p>
                      <p className="text-lg font-semibold text-amber-600">₺{order.proposedPrice}</p>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <p className="text-muted-foreground">Toplam</p>
                    <div className="flex items-center gap-2">
                      {order.proposedPrice && order.priceChangeStatus === "pending" && (
                        <span className="text-sm line-through text-muted-foreground">₺{order.price}</span>
                      )}
                      <p className={`text-xl font-bold ${order.proposedPrice && order.priceChangeStatus === "pending" ? "text-amber-600" : "text-primary"}`}>
                        ₺{order.proposedPrice && order.priceChangeStatus === "pending" ? order.proposedPrice : order.price}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Printer className="h-5 w-5 text-muted-foreground" />
                Provider
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-foreground">{order.providerName}</p>
              <p className="text-sm text-muted-foreground">{order.printerName}</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                Teslimat Adresi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground">{order.shippingAddress.fullAddress}</p>
              <p className="text-sm text-muted-foreground">
                {order.shippingAddress.district}, {order.shippingAddress.city}
              </p>
            </CardContent>
          </Card>

          {order.trackingNumber && (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Truck className="h-5 w-5 text-muted-foreground" />
                  Kargo Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{order.trackingCompany}</p>
                <p className="text-sm text-muted-foreground font-mono">{order.trackingNumber}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

