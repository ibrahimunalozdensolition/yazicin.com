"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, Mail, MailOpen, Trash2, Clock } from "lucide-react"
import { ContactService, ContactForm } from "@/lib/firebase/contact"

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactForm[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState<ContactForm | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    setLoading(true)
    try {
      const data = await ContactService.getAll()
      setMessages(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id: string) => {
    setActionLoading(true)
    try {
      await ContactService.updateStatus(id, "read")
      fetchMessages()
      if (selectedMessage?.id === id) {
        setSelectedMessage({ ...selectedMessage, status: "read" })
      }
    } catch (error) {
      console.error(error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bu mesajı silmek istediğinize emin misiniz?")) return
    setActionLoading(true)
    try {
      await ContactService.delete(id)
      setSelectedMessage(null)
      fetchMessages()
    } catch (error) {
      console.error(error)
    } finally {
      setActionLoading(false)
    }
  }

  const statusColors = {
    new: "bg-primary/10 text-primary",
    read: "bg-muted text-muted-foreground",
    replied: "bg-green-500/10 text-green-500",
  }
  
  const statusLabels = {
    new: "Yeni",
    read: "Okundu",
    replied: "Yanıtlandı",
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

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">İletişim Mesajları</h1>
        <p className="text-muted-foreground mt-1">Gelen iletişim formlarını yönetin.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : messages.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Henüz mesaj yok</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {messages.map((msg) => (
            <Card 
              key={msg.id} 
              className={`border-border/50 cursor-pointer transition-colors hover:bg-muted/50 ${msg.status === "new" ? "border-l-4 border-l-primary" : ""}`}
              onClick={() => {
                setSelectedMessage(msg)
                if (msg.status === "new" && msg.id) {
                  handleMarkAsRead(msg.id)
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {msg.status === "new" ? (
                        <Mail className="h-4 w-4 text-primary" />
                      ) : (
                        <MailOpen className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-medium text-foreground truncate">{msg.name}</span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[msg.status]}`}>
                        {statusLabels[msg.status]}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">{msg.subject}</p>
                    <p className="text-sm text-muted-foreground truncate">{msg.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {msg.email} • {msg.createdAt && new Date(msg.createdAt.seconds * 1000).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (msg.id) handleDelete(msg.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Mesaj Detayı</span>
                <Button variant="ghost" size="sm" onClick={() => setSelectedMessage(null)}>✕</Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Gönderen</p>
                  <p className="font-medium">{selectedMessage.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">E-posta</p>
                  <p className="font-medium">{selectedMessage.email}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Konu</p>
                <p className="font-medium">{selectedMessage.subject}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mesaj</p>
                <p className="font-medium whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tarih</p>
                <p className="font-medium">
                  {selectedMessage.createdAt && new Date(selectedMessage.createdAt.seconds * 1000).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedMessage(null)}>
                  Kapat
                </Button>
                <Button asChild>
                  <a href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}>
                    Yanıtla
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

