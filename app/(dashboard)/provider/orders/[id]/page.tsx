"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Package, Clock, CheckCircle, Truck, XCircle, Loader2, Send, MapPin, User, Play, Check, FileDown, DollarSign, Edit } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/AuthContext"
import { OrderService, Order, OrderStatus } from "@/lib/firebase/orders"
import { MessageService, Message } from "@/lib/firebase/messages"

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: any }> = {
  pending: { label: "Onay Bekliyor", color: "text-amber-500", icon: Clock },
  accepted: { label: "Onaylandı", color: "text-blue-500", icon: CheckCircle },
  in_production: { label: "Üretimde", color: "text-purple-500", icon: Package },
  shipped: { label: "Kargoda", color: "text-cyan-500", icon: Truck },
  delivered: { label: "Teslim Edildi", color: "text-green-500", icon: CheckCircle },
  cancelled: { label: "İptal Edildi", color: "text-red-500", icon: XCircle },
}

export default function ProviderOrderDetailPage() {
  const params = useParams()
  const orderId = params.id as string
  const { user } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState("")
  const [trackingCompany, setTrackingCompany] = useState("")
  const [showTrackingForm, setShowTrackingForm] = useState(false)
  const [showProductionForm, setShowProductionForm] = useState(false)
  const [productionHours, setProductionHours] = useState("")
  const [showPriceForm, setShowPriceForm] = useState(false)
  const [newPrice, setNewPrice] = useState("")
  const [priceLoading, setPriceLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (orderId) {
      setLoading(true)
      
      const unsubscribeOrder = OrderService.subscribeToOrder(orderId, (orderData) => {
        if (orderData) {
          setOrder(orderData)
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
        senderName: order.providerName,
        senderRole: "provider",
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

  const handleStatusChange = async (newStatus: OrderStatus, hours?: number) => {
    if (!order?.id) return
    setActionLoading(true)
    try {
      const additionalData: Partial<Order> = {}
      if (newStatus === "in_production" && hours !== undefined) {
        additionalData.productionHours = hours
      }
      await OrderService.updateStatus(order.id, newStatus, additionalData)
      if (newStatus === "in_production") {
        setShowProductionForm(false)
        setProductionHours("")
      }
    } catch (error) {
      console.error(error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleStartProduction = async () => {
    const hours = parseFloat(productionHours)
    if (hours > 0) {
      await handleStatusChange("in_production", hours)
    }
  }

  const handleShipOrder = async () => {
    if (!order?.id || !trackingNumber || !trackingCompany) return
    setActionLoading(true)
    try {
      await OrderService.addTrackingInfo(order.id, trackingNumber, trackingCompany)
      await OrderService.updateStatus(order.id, "shipped")
      setShowTrackingForm(false)
      setTrackingNumber("")
      setTrackingCompany("")
    } catch (error) {
      console.error(error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleProposePriceChange = async () => {
    if (!order?.id || !newPrice) return
    const price = parseFloat(newPrice)
    if (price <= 0 || price === order.price) return

    setPriceLoading(true)
    try {
      await OrderService.proposePriceChange(order.id, price)
      setShowPriceForm(false)
      setNewPrice("")
    } catch (error) {
      console.error(error)
    } finally {
      setPriceLoading(false)
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
            <Link href="/provider/orders">
              <Button variant="outline">Siparişlere Dön</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      <Link 
        href="/provider/orders" 
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
        
        <div className="flex gap-2">
          {order.status === "pending" && (
            <>
              <Button onClick={() => handleStatusChange("accepted")} disabled={actionLoading} className="gap-2">
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Onayla
              </Button>
              <Button variant="outline" onClick={() => handleStatusChange("cancelled")} disabled={actionLoading} className="text-red-500 hover:text-red-500">
                <XCircle className="h-4 w-4" />
              </Button>
            </>
          )}
          {order.status === "accepted" && (
            <Button onClick={() => setShowProductionForm(true)} disabled={actionLoading} className="gap-2">
              <Play className="h-4 w-4" />
              Üretime Başla
            </Button>
          )}
          {order.status === "in_production" && (
            <Button onClick={() => setShowTrackingForm(true)} disabled={actionLoading} className="gap-2">
              <Truck className="h-4 w-4" />
              Kargoya Ver
            </Button>
          )}
          {order.status === "shipped" && (
            <Button onClick={() => handleStatusChange("delivered")} disabled={actionLoading} className="gap-2">
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Teslim Edildi
            </Button>
          )}
        </div>
      </div>

      {showProductionForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md border-primary/50">
            <CardHeader>
              <CardTitle className="text-lg">Üretim Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="productionHours">Toplam Üretim Süresi (Saat) *</Label>
                <Input
                  id="productionHours"
                  type="number"
                  value={productionHours}
                  onChange={(e) => setProductionHours(e.target.value)}
                  placeholder="Örn: 5.5"
                  min="0"
                  step="0.1"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">Makine kaç saat kullanılacak?</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => {
                  setShowProductionForm(false)
                  setProductionHours("")
                }} className="flex-1">
                  İptal
                </Button>
                <Button 
                  onClick={handleStartProduction} 
                  disabled={!productionHours || parseFloat(productionHours) <= 0 || actionLoading}
                  className="flex-1"
                >
                  {actionLoading ? (
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

      {showPriceForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md border-primary/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Fiyat Güncelleme
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPrice">Mevcut Fiyat</Label>
                <Input
                  id="currentPrice"
                  value={`₺${order.price}`}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPrice">Yeni Fiyat (₺) *</Label>
                <Input
                  id="newPrice"
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="Örn: 100"
                  min="0"
                  step="0.01"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">Müşteri onayından sonra fiyat güncellenecek</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => {
                  setShowPriceForm(false)
                  setNewPrice("")
                }} className="flex-1">
                  İptal
                </Button>
                <Button
                  onClick={handleProposePriceChange}
                  disabled={!newPrice || parseFloat(newPrice) <= 0 || parseFloat(newPrice) === order.price || priceLoading}
                  className="flex-1"
                >
                  {priceLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Gönderiliyor...
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Fiyat Öner
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showTrackingForm && (
        <Card className="mb-6 border-primary/50">
          <CardHeader>
            <CardTitle className="text-lg">Kargo Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kargo Firması</Label>
                <Input
                  value={trackingCompany}
                  onChange={(e) => setTrackingCompany(e.target.value)}
                  placeholder="Örn: Yurtiçi Kargo"
                />
              </div>
              <div className="space-y-2">
                <Label>Takip Numarası</Label>
                <Input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Kargo takip numarası"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowTrackingForm(false)}>İptal</Button>
              <Button onClick={handleShipOrder} disabled={!trackingNumber || !trackingCompany || actionLoading}>
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Kargoya Ver
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Mesajlar</CardTitle>
            </CardHeader>
            <CardContent>
              <div ref={messagesContainerRef} className="h-[300px] overflow-y-auto mb-4 space-y-3 p-3 rounded-lg bg-muted/30">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    Henüz mesaj yok. Müşteri ile iletişime geçin.
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderRole === "provider" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        msg.senderRole === "provider"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted rounded-bl-md"
                      }`}>
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${
                          msg.senderRole === "provider" ? "text-primary-foreground/70" : "text-muted-foreground"
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

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Baskı Detayları</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Dosya</p>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{order.fileName}</p>
                    <a href={order.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <FileDown className="h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                </div>
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
                  <p className="text-sm text-muted-foreground">Kalite</p>
                  <p className="font-medium capitalize">{order.printSettings.quality}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Adet</p>
                  <p className="font-medium">{order.printSettings.quantity}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                Müşteri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-foreground">{order.customerName}</p>
              <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
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

          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="py-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Sipariş Tutarı</span>
                  <span className="text-2xl font-bold text-primary">₺{order.price}</span>
                </div>
                {order.proposedPrice && order.priceChangeStatus === "pending" && (
                  <div className="pt-3 border-t border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Önerilen Fiyat</span>
                      <span className="text-lg font-semibold text-amber-500">₺{order.proposedPrice}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Müşteri onayı bekleniyor</p>
                  </div>
                )}
                {(order.status === "pending" || order.status === "accepted") && (!order.proposedPrice || order.priceChangeStatus !== "pending") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewPrice(order.price.toString())
                      setShowPriceForm(true)
                    }}
                    className="w-full mt-3"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Fiyat Güncelle
                  </Button>
                )}
              </div>
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

