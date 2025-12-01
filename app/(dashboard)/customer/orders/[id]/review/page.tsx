"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Star, Loader2, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { OrderService, Order } from "@/lib/firebase/orders"
import { ReviewService } from "@/lib/firebase/reviews"

export default function ReviewPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  const { user } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [alreadyReviewed, setAlreadyReviewed] = useState(false)

  useEffect(() => {
    if (orderId) {
      fetchOrder()
    }
  }, [orderId])

  const fetchOrder = async () => {
    setLoading(true)
    try {
      const data = await OrderService.getById(orderId)
      setOrder(data)
      
      const hasReview = await ReviewService.hasReviewed(orderId)
      if (hasReview) {
        setAlreadyReviewed(true)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!user || !order || rating === 0) return
    
    setSubmitting(true)
    try {
      await ReviewService.create({
        orderId,
        customerId: user.uid,
        customerName: user.displayName || "Müşteri",
        providerId: order.providerId,
        rating,
        comment: comment.trim(),
      })
      setSubmitted(true)
    } catch (error) {
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!order || order.status !== "delivered") {
    return (
      <div className="container mx-auto px-4 md:px-6 py-8">
        <Card className="max-w-lg mx-auto border-border/50">
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-medium mb-2">Değerlendirme yapılamaz</h3>
            <p className="text-muted-foreground mb-6">Bu sipariş henüz teslim edilmedi veya bulunamadı.</p>
            <Link href="/customer/orders">
              <Button variant="outline">Siparişlere Dön</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (alreadyReviewed) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-8">
        <Card className="max-w-lg mx-auto border-green-500/50 bg-green-500/5">
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Zaten değerlendirdiniz</h3>
            <p className="text-muted-foreground mb-6">Bu sipariş için değerlendirmenizi daha önce yaptınız.</p>
            <Link href={`/customer/orders/${orderId}`}>
              <Button variant="outline">Siparişe Dön</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-8">
        <Card className="max-w-lg mx-auto border-green-500/50 bg-green-500/5">
          <CardContent className="py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">Teşekkürler!</h3>
            <p className="text-muted-foreground mb-6">Değerlendirmeniz başarıyla kaydedildi.</p>
            <div className="flex justify-center gap-3">
              <Link href="/customer/orders">
                <Button variant="outline">Siparişlere Dön</Button>
              </Link>
              <Link href="/customer">
                <Button>Panele Git</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      <Link 
        href={`/customer/orders/${orderId}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Siparişe Dön
      </Link>

      <Card className="max-w-lg mx-auto border-border/50">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Siparişinizi Değerlendirin</CardTitle>
          <CardDescription>
            {order.providerName} - {order.fileName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-3">Deneyiminizi puanlayın</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-10 w-10 transition-colors ${
                      star <= (hoverRating || rating)
                        ? "text-yellow-500 fill-yellow-500"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                {rating === 1 && "Çok Kötü"}
                {rating === 2 && "Kötü"}
                {rating === 3 && "Orta"}
                {rating === 4 && "İyi"}
                {rating === 5 && "Mükemmel"}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Yorumunuz (Opsiyonel)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Deneyiminizi paylaşın..."
              rows={4}
              className="flex w-full rounded-lg border border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
            className="w-full"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gönderiliyor...
              </>
            ) : (
              "Değerlendirmeyi Gönder"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

