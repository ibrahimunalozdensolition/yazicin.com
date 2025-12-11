"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Package, Clock, CheckCircle, Truck, XCircle, Loader2, Send, MapPin, User, Play, Check, FileDown, AlertTriangle, Upload, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/AuthContext"
import { OrderService, Order, OrderStatus } from "@/lib/firebase/orders"
import { MessageService, Message } from "@/lib/firebase/messages"
import { StorageService } from "@/lib/firebase/storage"

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: any }> = {
  pending: { label: "Onay Bekliyor", color: "text-amber-500", icon: Clock },
  accepted: { label: "Onaylandı", color: "text-blue-500", icon: CheckCircle },
  in_production: { label: "Üretimde", color: "text-purple-500", icon: Package },
  shipped: { label: "Üretim Bitti", color: "text-cyan-500", icon: CheckCircle },
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
  const [productionMinutes, setProductionMinutes] = useState("")
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0, milliseconds: 0 })
  const [showProductionCompleteModal, setShowProductionCompleteModal] = useState(false)
  const [showProblemForm, setShowProblemForm] = useState(false)
  const [problemDescription, setProblemDescription] = useState("")
  const [problemImage, setProblemImage] = useState<File | null>(null)
  const [problemImagePreview, setProblemImagePreview] = useState<string | null>(null)
  const [uploadingProblem, setUploadingProblem] = useState(false)
  const [hasShownModal, setHasShownModal] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (orderId) {
      setLoading(true)
      
      const unsubscribeOrder = OrderService.subscribeToOrder(orderId, (orderData) => {
        if (orderData) {
          if (orderData.status !== "in_production") {
            setHasShownModal(false)
            setShowProductionCompleteModal(false)
            setShowProblemForm(false)
          }
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

  useEffect(() => {
    if (order?.status === "in_production" && order.productionStartedAt && order.productionHours) {
      const interval = setInterval(() => {
        const productionStartedAt = order.productionStartedAt as any
        const startedAt = productionStartedAt?.toDate ? productionStartedAt.toDate() : new Date(productionStartedAt)
        const productionHours = order.productionHours || 0
        const endTime = new Date(startedAt.getTime() + productionHours * 60 * 60 * 1000)
        const now = new Date()
        const remainingMs = Math.max(0, endTime.getTime() - now.getTime())
        
        const hours = Math.floor(remainingMs / (1000 * 60 * 60))
        const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000)
        const milliseconds = Math.floor((remainingMs % 1000) / 10)
        
        setCountdown({ hours, minutes, seconds, milliseconds })
        
        if (remainingMs === 0 && !hasShownModal && order.status === "in_production") {
          setShowProductionCompleteModal(true)
          setHasShownModal(true)
        }
      }, 10)
      
      return () => clearInterval(interval)
    }
  }, [order, hasShownModal])

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
    const hours = parseInt(productionHours) || 0
    const minutes = parseInt(productionMinutes) || 0
    const totalHours = hours + (minutes / 60)
    if (totalHours > 0) {
      await handleStatusChange("in_production", totalHours)
      setProductionMinutes("")
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

  const handleProductionComplete = async () => {
    if (!order?.id) return
    setActionLoading(true)
    try {
      await OrderService.updateStatus(order.id, "shipped")
      setShowProductionCompleteModal(false)
    } catch (error) {
      console.error(error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleProblemImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setProblemImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setProblemImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmitProblem = async () => {
    if (!order?.id || !problemDescription.trim() || !problemImage || !user) return
    
    setUploadingProblem(true)
    try {
      let imageUrl = ""
      
      if (problemImage) {
        const result = await StorageService.uploadImage(
          problemImage,
          `orders/${orderId}/problems/${Date.now()}`,
          user.uid
        )
        imageUrl = result.url
      }

      await MessageService.send({
        orderId: order.id,
        senderId: user.uid,
        senderName: order.providerName,
        senderRole: "provider",
        content: `Baskıdan bir sorun oluştu: ${problemDescription}`,
      })

      if (imageUrl) {
        await MessageService.send({
          orderId: order.id,
          senderId: user.uid,
          senderName: order.providerName,
          senderRole: "provider",
          content: imageUrl,
        })
      }

      setShowProblemForm(false)
      setShowProductionCompleteModal(false)
      setProblemDescription("")
      setProblemImage(null)
      setProblemImagePreview(null)
    } catch (error) {
      console.error(error)
    } finally {
      setUploadingProblem(false)
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

  const formatProductionTime = (hours: number) => {
    const totalMinutes = Math.round(hours * 60)
    if (totalMinutes < 60) {
      return `${totalMinutes} dakika`
    }
    const productionHours = Math.floor(totalMinutes / 60)
    const remainingMinutes = totalMinutes % 60
    if (remainingMinutes === 0) {
      return `${productionHours} saat`
    }
    return `${productionHours} saat ${remainingMinutes} dakika`
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
            <Button onClick={() => handleStatusChange("shipped")} disabled={actionLoading} className="gap-2">
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Üretim Bitti
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
                  setShowProductionForm(false)
                  setProductionHours("")
                  setProductionMinutes("")
                }} className="flex-1">
                  İptal
                </Button>
                <Button 
                  onClick={handleStartProduction} 
                  disabled={(parseInt(productionHours) || 0) === 0 && (parseInt(productionMinutes) || 0) === 0 || actionLoading}
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

      {showProductionCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md border-primary/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Üretim Süresi Tamamlandı
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Üretim süresi doldu. Lütfen durumu seçin:
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleProductionComplete}
                  disabled={actionLoading}
                  className="flex-1"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      İşleniyor...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Üretim Bitti
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowProductionCompleteModal(false)
                    setShowProblemForm(true)
                  }}
                  className="flex-1 text-orange-500 hover:text-orange-500 hover:bg-orange-500/10"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Baskıda Sorun Var
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showProblemForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md border-orange-500/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Baskı Sorunu Bildir
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="problemDescription">Sorun Açıklaması *</Label>
                <textarea
                  id="problemDescription"
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  placeholder="Sorunu detaylı olarak açıklayın..."
                  className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  disabled={uploadingProblem}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="problemImage">Fotoğraf Yükle *</Label>
                <div className="space-y-2">
                  {problemImagePreview ? (
                    <div className="relative">
                      <img
                        src={problemImagePreview}
                        alt="Problem preview"
                        className="w-full h-48 object-cover rounded-md border"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setProblemImage(null)
                          setProblemImagePreview(null)
                        }}
                        className="absolute top-2 right-2"
                        disabled={uploadingProblem}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label
                      htmlFor="problemImageInput"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Fotoğraf seçmek için tıklayın
                      </p>
                    </label>
                  )}
                  <input
                    id="problemImageInput"
                    type="file"
                    accept="image/*"
                    onChange={handleProblemImageSelect}
                    className="hidden"
                    disabled={uploadingProblem}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowProblemForm(false)
                    setShowProductionCompleteModal(true)
                    setProblemDescription("")
                    setProblemImage(null)
                    setProblemImagePreview(null)
                  }}
                  className="flex-1"
                  disabled={uploadingProblem}
                >
                  Geri
                </Button>
                <Button
                  onClick={handleSubmitProblem}
                  disabled={!problemDescription.trim() || !problemImage || uploadingProblem}
                  className="flex-1"
                >
                  {uploadingProblem ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Gönderiliyor...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Gönder
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {order.status === "in_production" && order.productionStartedAt && order.productionHours && (
        <Card className="mb-6 border-purple-500/50 bg-purple-500/5">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10">
                <Package className="h-5 w-5 text-purple-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-purple-500 mb-3">Üretim Devam Ediyor</h3>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-500 tabular-nums">
                      {String(countdown.hours).padStart(2, '0')}
                    </div>
                    <div className="text-xs text-muted-foreground">Saat</div>
                  </div>
                  <div className="text-3xl font-bold text-purple-500">:</div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-500 tabular-nums">
                      {String(countdown.minutes).padStart(2, '0')}
                    </div>
                    <div className="text-xs text-muted-foreground">Dakika</div>
                  </div>
                  <div className="text-3xl font-bold text-purple-500">:</div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-500 tabular-nums">
                      {String(countdown.seconds).padStart(2, '0')}
                    </div>
                    <div className="text-xs text-muted-foreground">Saniye</div>
                  </div>
                  <div className="text-3xl font-bold text-purple-500">:</div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-500 tabular-nums">
                      {String(countdown.milliseconds).padStart(2, '0')}
                    </div>
                    <div className="text-xs text-muted-foreground">Salise</div>
                  </div>
                </div>
              </div>
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
                        {(() => {
                          const isImageUrl = msg.content.match(/^https?:\/\/.+/i) && 
                            (msg.content.includes('firebase') || msg.content.includes('firebasestorage') || 
                             msg.content.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i))
                          return isImageUrl ? (
                            <img
                              src={msg.content}
                              alt="Mesaj görseli"
                              className="max-w-xs max-h-48 w-auto h-auto rounded-lg mb-1 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={(e) => {
                                window.open(msg.content, '_blank')
                              }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                              }}
                            />
                          ) : (
                            <p className="text-sm">{msg.content}</p>
                          )
                        })()}
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
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Sipariş Tutarı</span>
                <span className="text-2xl font-bold text-primary">₺{order.price}</span>
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

