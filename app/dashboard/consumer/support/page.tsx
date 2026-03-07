"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, MessageSquare, Clock, Send, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { buildBackendUrl } from "@/lib/api"
import { useAuthUser } from "@/hooks/use-auth-user"
import { toast } from "sonner"

type SupportIssue = {
  id: string
  title?: string
  reason?: string
  description?: string
  status?: string
  priority?: string
  createdAt?: string | null
  raisedById?: string
  messages?: Array<{ senderRole?: string; senderId?: string; senderName?: string; message?: string; createdAt?: string | null }>
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

export default function ConsumerSupportPage() {
  const user = useAuthUser()
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [replyText, setReplyText] = useState("")
  const [sending, setSending] = useState(false)
  const [creating, setCreating] = useState(false)
  const [items, setItems] = useState<SupportIssue[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const selectedIssue = items.find((item) => item.id === selectedId)

  async function fetchData() {
    if (!user?.id) return
    const response = await fetch(buildBackendUrl(`/api/disputes/raised/${encodeURIComponent(user.id)}`))
    const payload = await response.json()
    const nextItems = response.ok && payload?.success ? payload.disputes || [] : []
    setItems(nextItems)
    if (nextItems.length > 0 && !selectedId) {
      setSelectedId(nextItems[0].id)
    }
  }

  useEffect(() => {
    fetchData().finally(() => setLoading(false))
  }, [user?.id])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [selectedIssue?.messages])

  async function submitIssue() {
    if (!title.trim() || !description.trim() || !user?.id) {
      toast.error("Please fill all fields")
      return
    }

    try {
      setCreating(true)
      const response = await fetch(buildBackendUrl("/api/disputes/system"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          title,
          description,
          priority: "medium",
        }),
      })
      const payload = await response.json()
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || payload?.error || "Failed to submit issue")
      }

      setTitle("")
      setDescription("")
      toast.success("Issue submitted to admin")
      await fetchData()
      if (payload?.disputeId) {
        setSelectedId(payload.disputeId)
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to submit issue")
    } finally {
      setCreating(false)
    }
  }

  async function sendReply() {
    if (!selectedIssue || !user?.id) return
    const message = replyText.trim()
    if (!message) {
      toast.error("Please enter a reply")
      return
    }

    try {
      setSending(true)
      const response = await fetch(buildBackendUrl(`/api/disputes/${encodeURIComponent(selectedIssue.id)}/reply`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderRole: user.role,
          senderId: user.id,
          senderName: user.name,
          message,
        }),
      })
      const payload = await response.json()

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || payload?.error || "Failed to send reply")
      }

      setReplyText("")
      toast.success("Reply sent")
      await fetchData()
    } catch (error: any) {
      toast.error(error?.message || "Failed to send reply")
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Support</h1>
          <p className="text-muted-foreground">Direct conversation with admin for system issues</p>
        </div>
        <Badge variant="secondary" className="text-lg px-3 py-1">{items.length}</Badge>
      </div>

      <Card className="border-border">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm">Raise New Issue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          <div className="grid gap-2 md:grid-cols-12">
            <div className="md:col-span-4">
              <Input
                placeholder="Issue title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="md:col-span-6">
              <Textarea
                placeholder="Describe the issue..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={1}
                className="min-h-[40px] max-h-[96px]"
              />
            </div>
            <div className="md:col-span-2">
              <Button onClick={submitIssue} disabled={creating} className="w-full">
                {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Raise
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-20 text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No support issues raised</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 h-[calc(100vh-260px)]">
          <Card className="border-border lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">My Support Issues</CardTitle>
            </CardHeader>
            <ScrollArea className="h-[calc(100vh-340px)]">
              <div className="space-y-1 px-4 pb-4">
                {items.map((issue) => {
                  const allowedMessages = (issue.messages || []).filter((m) =>
                    String(m.senderRole || "") === "admin" || String(m.senderId || "") === String(user?.id || ""),
                  )
                  const lastMsg = allowedMessages[allowedMessages.length - 1]
                  const isSelected = issue.id === selectedId
                  return (
                    <div
                      key={issue.id}
                      onClick={() => setSelectedId(issue.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                        isSelected
                          ? "bg-primary/10 border-primary"
                          : "bg-background hover:bg-muted/50 border-transparent"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-medium text-sm text-foreground truncate">{issue.title || issue.reason || "Support Issue"}</p>
                        <Badge
                          variant={issue.status === "open" ? "destructive" : issue.status === "resolved" ? "default" : "secondary"}
                          className="text-xs shrink-0"
                        >
                          {issue.status || "open"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground truncate flex-1">
                          {lastMsg?.message || issue.description || "No messages"}
                        </p>
                        <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(lastMsg?.createdAt || issue.createdAt)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </Card>

          <Card className="border-border lg:col-span-3">
            {!selectedIssue ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Select an issue to view conversation</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <CardHeader className="pb-2 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm">{selectedIssue.title || selectedIssue.reason || "Support Issue"}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">Direct support with admin</p>
                    </div>
                    <Badge
                      variant={selectedIssue.status === "open" ? "destructive" : selectedIssue.status === "resolved" ? "default" : "secondary"}
                    >
                      {selectedIssue.status || "open"}
                    </Badge>
                  </div>
                </CardHeader>

                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-4">
                    {(selectedIssue.messages || [])
                      .filter((m) =>
                        String(m.senderRole || "") === "admin" || String(m.senderId || "") === String(user?.id || ""),
                      )
                      .map((msg, idx) => {
                        const isRequester = String(msg.senderId || "") === String(user?.id || "")
                        return (
                          <div key={idx} className={`flex ${isRequester ? "justify-end" : "justify-start"}`}>
                            <div className="max-w-[75%] space-y-1">
                              <div className={`rounded-lg p-3 ${isRequester ? "bg-blue-500 text-white" : "bg-primary text-primary-foreground"}`}>
                                <p className="text-xs font-medium mb-1 opacity-90">{msg.senderName || msg.senderRole || "User"}</p>
                                <p className="text-sm">{msg.message || ""}</p>
                              </div>
                              <p className={`text-xs text-muted-foreground px-1 ${isRequester ? "text-right" : "text-left"}`}>
                                {formatMessageTime(msg.createdAt)}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    <div ref={chatEndRef} />
                  </div>
                </ScrollArea>

                {String(selectedIssue.status || "").toLowerCase() !== "resolved" ? (
                  <div className="p-4 border-t space-y-2">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Type your reply to admin..."
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
                  </div>
                ) : (
                  <div className="p-4 border-t bg-muted/30">
                    <p className="text-sm text-center text-muted-foreground">Issue resolved</p>
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
