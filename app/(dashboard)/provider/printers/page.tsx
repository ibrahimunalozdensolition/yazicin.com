"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Loader2, Printer as PrinterIcon, Settings, Power, PowerOff, Trash2, Edit } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { PrinterService, Printer, PrinterStatus } from "@/lib/firebase/printers"

export default function ProviderPrintersPage() {
  const { user } = useAuth()
  const [printers, setPrinters] = useState<Printer[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchPrinters()
    }
  }, [user])

  const fetchPrinters = async () => {
    if (!user) return
    setLoading(true)
    try {
      console.log("Fetching printers for user.uid:", user.uid)
      const data = await PrinterService.getByProviderId(user.uid)
      console.log("Printers found:", data)
      
      const allPrinters = await PrinterService.getAll()
      console.log("All printers in database:", allPrinters)
      
      setPrinters(data)
    } catch (error) {
      console.error("Error fetching printers:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusToggle = async (printer: Printer) => {
    if (!printer.id) return
    setActionLoading(printer.id)
    try {
      const newStatus: PrinterStatus = printer.status === "active" ? "inactive" : "active"
      await PrinterService.updateStatus(printer.id, newStatus)
      fetchPrinters()
    } catch (error) {
      console.error(error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bu yazıcıyı silmek istediğinize emin misiniz?")) return
    setActionLoading(id)
    try {
      await PrinterService.delete(id)
      fetchPrinters()
    } catch (error) {
      console.error(error)
    } finally {
      setActionLoading(null)
    }
  }

  const statusColors = {
    active: "bg-green-500/10 text-green-500",
    inactive: "bg-muted text-muted-foreground",
    maintenance: "bg-accent/10 text-accent",
    busy: "bg-primary/10 text-primary",
  }

  const statusLabels = {
    active: "Aktif",
    inactive: "Pasif",
    maintenance: "Bakımda",
    busy: "Meşgul",
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      <Link 
        href="/provider" 
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Provider Paneline Dön
      </Link>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Yazıcılarım</h1>
          <p className="text-muted-foreground mt-1">3D yazıcılarınızı yönetin.</p>
        </div>
        <Link href="/provider/printers/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Yeni Yazıcı Ekle
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : printers.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <PrinterIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Henüz yazıcınız yok</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
              Sipariş almaya başlamak için ilk yazıcınızı ekleyin.
            </p>
            <Link href="/provider/printers/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Yazıcı Ekle
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {printers.map((printer) => (
            <Card key={printer.id} className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{printer.brand} {printer.model}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{printer.type}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[printer.status]}`}>
                    {statusLabels[printer.status]}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Baskı Hacmi</span>
                    <span className="font-medium">{printer.buildVolume.x}x{printer.buildVolume.y}x{printer.buildVolume.z} mm</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Malzemeler</span>
                    <span className="font-medium">{printer.materials.slice(0, 3).join(", ")}{printer.materials.length > 3 ? "..." : ""}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Fiyat (gram)</span>
                    <span className="font-medium">₺{printer.pricing.perGram}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2 border-t border-border/50">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleStatusToggle(printer)}
                    disabled={actionLoading === printer.id}
                  >
                    {actionLoading === printer.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : printer.status === "active" ? (
                      <>
                        <PowerOff className="h-4 w-4 mr-1" />
                        Pasif Yap
                      </>
                    ) : (
                      <>
                        <Power className="h-4 w-4 mr-1" />
                        Aktif Yap
                      </>
                    )}
                  </Button>
                  <Link href={`/provider/printers/${printer.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => printer.id && handleDelete(printer.id)}
                    disabled={actionLoading === printer.id}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

