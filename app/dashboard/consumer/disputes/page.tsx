"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Loader2, MessageSquareWarning, MessageSquare, Clock, Send } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { buildBackendUrl } from "@/lib/api"
import { useAuthUser } from "@/hooks/use-auth-user"
import { toast } from "sonner"

type Dispute = {
  id: string
  category?: string
  orderId?: string
  productName?: string
  reason?: string
  description?: string
  status?: string
  priority?: string
  proofVideoUrl?: string
  proofFileName?: string
  proofFileType?: string
  createdAt?: string | null
  resolvedAt?: string | null
  resolution?: string
  messages?: Array<{ senderRole?: string; senderName?: string; message?: string; createdAt?: string | null }>
}

function formatTime(dateStr?: string | null) {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ""
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days > 7) return date.toLocaleDateString()
  if (days > 0) return `${days}d ago`
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours > 0) return `${hours}h ago`
  const mins = Math.floor(diff / (1000 * 60))
  if (mins > 0) return `${mins}m ago`
  return "Just now"
}

function formatMessageTime(dateStr?: string | null) {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ""
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function statusVariant(status?: string): "default" | "secondary" | "destructive" | "outline" {
  const s = String(status || "").toLowerCase()
  if (s === "open") return "destructive"
  if (s === "resolved" || s === "closed") return "default"
  if (s === "in_progress") return "secondary"
  return "outline"
}

export default function ConsumerDisputesPage() {
  const user = useAuthUser()
  const [loading, setLoading] = useState(true)
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [sending, setSending] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const selectedDispute = disputes.find((d) => d.id === selectedId)

  useEffect(() => {
    async function fetchDisputes() {
      try {
        if (!user?.id) return
        setLoadError(null)

        const response = await fetch(
          buildBackendUrl(`/api/disputes/consumer/${encodeURIComponent(user.id)}`),
        )
        const payload = await response.json()

        if (!response.ok || !payload?.success) {
          throw new Error(payload?.message || payload?.error || "Failed to load disputes")
        }

        const nextDisputes = Array.isArray(payload.disputes) ? payload.disputes : []
        setDisputes(nextDisputes)
        if (nextDisputes.length > 0 && !selectedId) {
          setSelectedId(nextDisputes[0].id)
        }
      } catch (error: any) {
        console.error("Error loading consumer disputes:", error)
        setDisputes([])
        setLoadError(error?.message || "Failed to load disputes")
      } finally {
        setLoading(false)
      }
    }

    fetchDisputes()
  }, [user?.id])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [selectedDispute?.messages])

  async function sendReply() {
    if (!user?.id || !selectedDispute) return
    const message = replyText.trim()
    if (!message) {
      toast.error("Please enter a reply")
      return
    }

    try {
      setSending(true)
      const response = await fetch(buildBackendUrl(`/api/disputes/${encodeURIComponent(selectedDispute.id)}/reply`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderRole: "consumer",
          senderId: user.id,
          senderName: user.name || "Consumer",
          message,
        }),
      })
      const payload = await response.json()

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || payload?.error || "Failed to send reply")
      }

      setReplyText("")
      toast.success("Reply sent")

      const refresh = await fetch(buildBackendUrl(`/api/disputes/consumer/${encodeURIComponent(user.id)}`))
      const refreshPayload = await refresh.json()
      if (refresh.ok && refreshPayload?.success) {
        const nextDisputes = Array.isArray(refreshPayload.disputes) ? refreshPayload.disputes : []
        setDisputes(nextDisputes)
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to send reply")
    } finally {
      setSending(false)
    }
  }

  const stats = useMemo(() => {
    const open = disputes.filter((d) => String(d.status || "").toLowerCase() === "open").length
    const resolved = disputes.filter((d) => ["resolved", "closed"].includes(String(d.status || "").toLowerCase())).length
    return {
      total: disputes.length,
      open,
      resolved,
    }
  }, [disputes])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Disputes</h1>
        <p className="text-muted-foreground">Track dispute logs and admin replies</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Disputes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.open}</div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.resolved}</div>
          </CardContent>
        </Card>
      </div>

      {loadError ? <p className="text-sm text-destructive">{loadError}</p> : null}

      {disputes.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-20 text-center text-muted-foreground">
            <MessageSquareWarning className="h-10 w-10 mx-auto mb-3" />
            <p className="text-lg">No disputes filed yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-[calc(100vh-320px)]">
          <Card className="border-border lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Dispute Logs</CardTitle>
            </CardHeader>
            <ScrollArea className="h-[calc(100vh-400px)]">
              <div className="space-y-1 px-4 pb-4">
                {disputes.map((d) => {
                  const lastMsg = d.messages?.[d.messages.length - 1]
                  const isSelected = d.id === selectedId
                  return (
                    <div
                      key={d.id}
                      onClick={() => setSelectedId(d.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                        isSelected
                          ? "bg-primary/10 border-primary"
                          : "bg-background hover:bg-muted/50 border-transparent"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-medium text-sm text-foreground truncate">{d.productName || d.reason || "Issue"}</p>
                        <Badge variant={statusVariant(d.status)} className="text-xs shrink-0">
                          {String(d.status || "open").replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {d.category === "system" ? "system" : "product"}
                        </Badge>
                        <p className="text-xs text-muted-foreground truncate">
                          {d.category === "system" ? "System issue" : `Order: ${d.orderId || "—"}`}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground truncate flex-1">
                          {lastMsg?.message || d.description || "No messages"}
                        </p>
                        <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(lastMsg?.createdAt || d.createdAt)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </Card>

          <Card className="border-border lg:col-span-3">
            {!selectedDispute ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Select a dispute to view conversation</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{selectedDispute.productName || selectedDispute.reason || "Issue"}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedDispute.category === "system" ? "System Issue" : `Order: ${selectedDispute.orderId || "—"}`}
                      </p>
                    </div>
                    <Badge variant={statusVariant(selectedDispute.status)}>
                      {String(selectedDispute.status || "open").replace("_", " ")}
                    </Badge>
                  </div>
                </CardHeader>

                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {(selectedDispute.messages || []).map((msg, idx) => {
                      const isConsumer = msg.senderRole === "consumer"
                      return (
                        <div key={idx} className={`flex ${isConsumer ? "justify-end" : "justify-start"}`}>
                          <div className="max-w-[75%] space-y-1">
                            <div className={`rounded-lg p-3 ${isConsumer ? "bg-blue-500 text-white" : "bg-primary text-primary-foreground"}`}>
                              <p className="text-xs font-medium mb-1 opacity-90">{msg.senderName || msg.senderRole || "User"}</p>
                              <p className="text-sm">{msg.message || ""}</p>
                            </div>
                            <p className={`text-xs text-muted-foreground px-1 ${isConsumer ? "text-right" : "text-left"}`}>
                              {formatMessageTime(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={chatEndRef} />
                  </div>
                </ScrollArea>

                {String(selectedDispute.status || "").toLowerCase() !== "resolved" ? (
                  <div className="p-4 border-t space-y-2">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Type your reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={2}
                        className="resize-none flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            if (!sending) {
                              void sendReply()
                            }
                          }
                        }}
                      />
                      <Button onClick={() => void sendReply()} className="self-end" disabled={sending}>
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="bg-muted/20 rounded-md p-2 space-y-1">
                      <p className="text-xs text-muted-foreground">Reason: <span className="text-foreground">{selectedDispute.reason || "—"}</span></p>
                      <p className="text-xs text-muted-foreground">Priority: <span className="text-foreground">{selectedDispute.priority || "—"}</span></p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border-t bg-muted/30">
                    <p className="text-sm text-center text-muted-foreground">Dispute resolved</p>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
