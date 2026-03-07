"use client"

import { useEffect, useState, useRef } from "react"
import { Loader2, Send, MessageSquare, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { buildBackendUrl } from "@/lib/api"
import { useAuthUser } from "@/hooks/use-auth-user"
import { toast } from "sonner"

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
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function FarmerDisputesPage() {
  const user = useAuthUser()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const chatEndRef = useRef<HTMLDivElement>(null)

  const selectedDispute = items.find((d) => d.id === selectedId)

  async function fetchData() {
    if (!user?.id) return
    const response = await fetch(buildBackendUrl(`/api/disputes/farmer/${encodeURIComponent(user.id)}`))
    const payload = await response.json()
    const disputes = response.ok && payload?.success ? payload.disputes || [] : []
    setItems(disputes)
    if (disputes.length > 0 && !selectedId) {
      setSelectedId(disputes[0].id)
    }
  }

  useEffect(() => {
    fetchData().finally(() => setLoading(false))
  }, [user?.id])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [selectedDispute?.messages])

  async function sendReply() {
    if (!selectedDispute) return
    const message = replyText.trim()
    if (!message) {
      toast.error("Please enter a reply")
      return
    }
    const response = await fetch(buildBackendUrl(`/api/disputes/${encodeURIComponent(selectedDispute.id)}/reply`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderRole: "farmer",
        senderId: user?.id,
        senderName: user?.name,
        message,
      }),
    })
    const payload = await response.json()

    if (!response.ok || !payload?.success) {
      toast.error(payload?.message || payload?.error || "Failed to send reply")
      return
    }

    setReplyText("")
    toast.success("Reply sent")
    await fetchData()
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
        <h1 className="text-3xl font-bold text-foreground">Product Disputes</h1>
        <p className="text-muted-foreground">Reply to SHG and consumer in product dispute threads</p>
        </div>
        <Badge variant="secondary" className="text-lg px-3 py-1">{items.length}</Badge>
      </div>

      {items.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-20 text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No product disputes found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-[calc(100vh-200px)]">
          <Card className="border-border lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">All Disputes</CardTitle>
            </CardHeader>
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="space-y-1 px-4 pb-4">
                {items.map((d) => {
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
                        <p className="font-medium text-sm text-foreground truncate">{d.productName || d.reason || "Dispute"}</p>
                        <Badge
                          variant={d.status === "open" ? "destructive" : d.status === "resolved" ? "default" : "secondary"}
                          className="text-xs shrink-0"
                        >
                          {d.status || "open"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{d.consumerName || "Unknown consumer"}</p>
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
                      <CardTitle className="text-base">{selectedDispute.productName || selectedDispute.reason || "Dispute"}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        Consumer: {selectedDispute.consumerName || "Unknown"}
                      </p>
                    </div>
                    <Badge
                      variant={selectedDispute.status === "open" ? "destructive" : selectedDispute.status === "resolved" ? "default" : "secondary"}
                    >
                      {selectedDispute.status || "open"}
                    </Badge>
                  </div>
                </CardHeader>

                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {(selectedDispute.messages || []).map((msg: any, idx: number) => {
                      const isFarmer = msg.senderRole === "farmer"
                      const isConsumer = msg.senderRole === "consumer"
                      const isShg = msg.senderRole === "shg"
                      return (
                        <div key={idx} className={`flex ${isFarmer ? "justify-end" : "justify-start"}`}>
                          <div className="max-w-[75%] space-y-1">
                            <div
                              className={`rounded-lg p-3 ${
                                isFarmer
                                  ? "bg-primary text-primary-foreground"
                                  : isConsumer
                                  ? "bg-blue-500 text-white"
                                  : isShg
                                  ? "bg-green-600 text-white"
                                  : "bg-muted text-foreground"
                              }`}
                            >
                              <p className="text-xs font-medium mb-1 opacity-90">{msg.senderName || msg.senderRole}</p>
                              <p className="text-sm">{msg.message}</p>
                            </div>
                            <p className={`text-xs text-muted-foreground px-1 ${isFarmer ? "text-right" : "text-left"}`}>
                              {formatMessageTime(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={chatEndRef} />
                  </div>
                </ScrollArea>

                {selectedDispute.status !== "resolved" ? (
                  <div className="p-4 border-t space-y-2">
                    {selectedDispute.proofVideoUrl ? (
                      <a
                        href={selectedDispute.proofVideoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary underline block"
                      >
                        View Attachment
                      </a>
                    ) : null}
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Type your reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={2}
                        className="resize-none"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            sendReply()
                          }
                        }}
                      />
                    </div>
                    <Button variant="outline" onClick={sendReply} className="w-full">
                      <Send className="h-4 w-4 mr-2" />
                      Send Reply
                    </Button>
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
