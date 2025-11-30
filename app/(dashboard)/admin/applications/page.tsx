"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, CheckCircle, XCircle, Clock, User, MapPin, Printer, Eye } from "lucide-react"
import { ProviderApplicationService, ProviderApplication } from "@/lib/firebase/providerApplications"
import { UserService } from "@/lib/firebase/users"
import { useAuth } from "@/contexts/AuthContext"
import { doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

export default function AdminApplicationsPage() {
  const { user } = useAuth()
  const [applications, setApplications] = useState<ProviderApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending")
  const [selectedApp, setSelectedApp] = useState<ProviderApplication | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectNote, setRejectNote] = useState("")

  useEffect(() => {
    fetchApplications()
  }, [filter])

  const fetchApplications = async () => {
    setLoading(true)
    try {
      let data: ProviderApplication[]
      if (filter === "all") {
        data = await ProviderApplicationService.getAll()
      } else {
        data = await ProviderApplicationService.getByStatus(filter)
      }
      setApplications(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (app: ProviderApplication) => {
    if (!user || !app.id) return
    setActionLoading(true)
    try {
      await ProviderApplicationService.approve(app.id, user.uid)
      
      await UserService.updateUserProfile(app.userId, { role: "provider" })
      
      const providerRef = doc(db, "providers", app.userId)
      await updateDoc(providerRef, {
        status: "approved",
        approvedAt: serverTimestamp(),
      }).catch(async () => {
        const { setDoc } = await import("firebase/firestore")
        await setDoc(providerRef, {
          userId: app.userId,
          businessName: app.businessName,
          status: "approved",
          createdAt: serverTimestamp(),
          approvedAt: serverTimestamp(),
          completedOrders: 0,
          rating: 0,
          address: {
            city: app.city,
            district: app.district,
            fullAddress: app.address,
          },
        })
      })
      
      setSelectedApp(null)
      fetchApplications()
    } catch (error) {
      console.error(error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async (app: ProviderApplication) => {
    if (!user || !app.id) return
    setActionLoading(true)
    try {
      await ProviderApplicationService.reject(app.id, user.uid, rejectNote)
      setSelectedApp(null)
      setRejectNote("")
      fetchApplications()
    } catch (error) {
      console.error(error)
    } finally {
      setActionLoading(false)
    }
  }

  const statusColors = {
    pending: "bg-accent/10 text-accent",
    approved: "bg-green-500/10 text-green-500",
    rejected: "bg-destructive/10 text-destructive",
  }
  
  const statusLabels = {
    pending: "Bekliyor",
    approved: "Onaylandı",
    rejected: "Reddedildi",
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      <Link 
        href="/admin" 
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Admin Paneline Dön
      </Link>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Provider Başvuruları</h1>
          <p className="text-muted-foreground mt-1">Gelen başvuruları inceleyin ve onaylayın.</p>
        </div>
        <div className="flex gap-2">
          {(["pending", "approved", "rejected", "all"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "Tümü" : statusLabels[f as keyof typeof statusLabels]}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : applications.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Başvuru bulunamadı</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {applications.map((app) => (
            <Card key={app.id} className="border-border/50">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-foreground">{app.businessName}</h3>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[app.status]}`}>
                        {statusLabels[app.status]}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {app.displayName}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {app.city}, {app.district}
                      </span>
                      <span className="flex items-center gap-1">
                        <Printer className="h-4 w-4" />
                        {app.printerBrand} {app.printerModel}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {app.createdAt && new Date(app.createdAt.seconds * 1000).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedApp(app)}>
                      <Eye className="h-4 w-4 mr-1" />
                      Detay
                    </Button>
                    {app.status === "pending" && (
                      <>
                        <Button 
                          size="sm" 
                          className="bg-green-500 hover:bg-green-600"
                          onClick={() => handleApprove(app)}
                          disabled={actionLoading}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Onayla
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => setSelectedApp(app)}
                          disabled={actionLoading}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reddet
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Başvuru Detayı</span>
                <Button variant="ghost" size="sm" onClick={() => setSelectedApp(null)}>✕</Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Ad Soyad</p>
                  <p className="font-medium">{selectedApp.displayName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">E-posta</p>
                  <p className="font-medium">{selectedApp.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefon</p>
                  <p className="font-medium">{selectedApp.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">İşletme Adı</p>
                  <p className="font-medium">{selectedApp.businessName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">İşletme Türü</p>
                  <p className="font-medium">{selectedApp.businessType === "individual" ? "Bireysel" : "Şirket"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Konum</p>
                  <p className="font-medium">{selectedApp.city}, {selectedApp.district}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Adres</p>
                <p className="font-medium">{selectedApp.address}</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Yazıcı Markası</p>
                  <p className="font-medium">{selectedApp.printerBrand}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Yazıcı Modeli</p>
                  <p className="font-medium">{selectedApp.printerModel}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Deneyim</p>
                <p className="font-medium">{selectedApp.experience}</p>
              </div>

              {selectedApp.status === "pending" && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Red Notu (Opsiyonel)</label>
                    <textarea
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                      placeholder="Red sebebini yazın..."
                      rows={3}
                      className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setSelectedApp(null)}>
                      İptal
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => handleReject(selectedApp)}
                      disabled={actionLoading}
                    >
                      {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Reddet
                    </Button>
                    <Button 
                      className="bg-green-500 hover:bg-green-600"
                      onClick={() => handleApprove(selectedApp)}
                      disabled={actionLoading}
                    >
                      {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Onayla
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

