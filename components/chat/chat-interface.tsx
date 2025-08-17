"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, MessageCircle, X, ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase"
import ProfileModal from "@/components/profile/profile-modal"
import type { UserProfile } from "@/hooks/use-auth"

interface Message {
  id: string
  application_id: string
  sender_id: string
  content: string
  sent_at: string
  sender_profile?: {
    first_name: string
    last_name: string
    avatar_url?: string
  }
}

interface ChatInterfaceProps {
  applicationId: string
  currentUser: UserProfile
  otherUser: {
    id: string
    name: string
    avatar_url?: string
  }
  projectTitle: string
  onBack?: () => void
  onClose: () => void
}

export function ChatInterface({
  applicationId,
  currentUser,
  otherUser,
  projectTitle,
  onBack,
  onClose,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [viewedMessages, setViewedMessages] = useState<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchMessages()

    const timer = setTimeout(() => {
      markMessagesAsViewed()
    }, 1000)

    const channel = supabase
      .channel(`messages:${applicationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `application_id=eq.${applicationId}`,
        },
        async (payload) => {
          console.log("[v0] Real-time message received:", payload.new)

          const { data: messageData, error } = await supabase
            .from("messages")
            .select(`
              *,
              users!messages_sender_id_fkey(
                profiles!inner(first_name, last_name, avatar_url)
              )
            `)
            .eq("id", payload.new.id)
            .single()

          if (!error && messageData) {
            const formattedMessage: Message = {
              ...messageData,
              sender_profile: messageData.users?.profiles,
            }

            setMessages((prev) => {
              if (prev.some((msg) => msg.id === formattedMessage.id)) {
                return prev
              }
              return [...prev, formattedMessage]
            })
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      clearTimeout(timer)
    }
  }, [applicationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const markMessagesAsViewed = () => {
    const unreadMessageIds = messages.filter((msg) => msg.sender_id !== currentUser.id).map((msg) => msg.id)

    setViewedMessages((prev) => new Set([...prev, ...unreadMessageIds]))
  }

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          users!messages_sender_id_fkey(
            profiles!inner(first_name, last_name, avatar_url)
          )
        `)
        .eq("application_id", applicationId)
        .order("sent_at", { ascending: true })

      if (error) throw error

      const formattedMessages =
        data?.map((msg: any) => ({
          ...msg,
          sender_profile: msg.users?.profiles,
        })) || []

      setMessages(formattedMessages)
    } catch (error) {
      console.error("Error fetching messages:", error)
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    } else {
      return date.toLocaleDateString()
    }
  }

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {}
    messages.forEach((message) => {
      const date = new Date(message.sent_at).toDateString()
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(message)
    })
    return groups
  }

  const messageGroups = groupMessagesByDate(messages)

  const sendMessage = async () => {
    if (!newMessage.trim()) return

    setSending(true)
    const { data, error } = await supabase
      .from("messages")
      .insert([
        {
          application_id: applicationId,
          sender_id: currentUser.id,
          content: newMessage,
          sent_at: new Date().toISOString(),
        },
      ])
      .select()

    if (!error && data) {
      const formattedMessage: Message = {
        ...data[0],
        sender_profile: {
          first_name: currentUser.first_name,
          last_name: currentUser.last_name,
          avatar_url: currentUser.avatar_url,
        },
      }

      setMessages((prev) => [...prev, formattedMessage])
    }

    setNewMessage("")
    setSending(false)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }

  const handleProfileClick = () => {
    setShowProfileModal(true)
  }

  return (
    <>
      <Card className="w-full max-w-4xl max-h-[80vh] h-[600px] flex flex-col fixed inset-0 m-auto z-50 shadow-2xl">
        <CardHeader className="flex-shrink-0 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={onBack || onClose}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Avatar className="h-10 w-10 cursor-pointer" onClick={handleProfileClick}>
                <AvatarImage src={otherUser.avatar_url || ""} />
                <AvatarFallback>{otherUser.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg cursor-pointer hover:text-blue-600" onClick={handleProfileClick}>
                  {otherUser.name}
                </CardTitle>
                <p className="text-sm text-gray-600">{projectTitle}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          <ScrollArea className="flex-1 p-4 max-h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : messages.length > 0 ? (
              <div className="space-y-4">
                {Object.entries(messageGroups).map(([date, dayMessages]) => (
                  <div key={date}>
                    <div className="flex justify-center mb-4">
                      <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        {formatDate(date)}
                      </span>
                    </div>
                    {dayMessages.map((message) => {
                      const isOwnMessage = message.sender_id === currentUser.id
                      const isUnread = !isOwnMessage && !viewedMessages.has(message.id)
                      const senderName = isOwnMessage
                        ? `${currentUser.first_name} ${currentUser.last_name}`
                        : message.sender_profile?.first_name && message.sender_profile?.last_name
                          ? `${message.sender_profile.first_name} ${message.sender_profile.last_name}`
                          : message.sender_profile?.first_name || otherUser.name

                      return (
                        <div key={message.id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} mb-3`}>
                          <div className={`flex gap-2 max-w-[70%] ${isOwnMessage ? "flex-row-reverse" : "flex-row"}`}>
                            {!isOwnMessage && (
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarImage src={message.sender_profile?.avatar_url || ""} />
                                <AvatarFallback className="text-xs">
                                  {getInitials(
                                    message.sender_profile?.first_name || "U",
                                    message.sender_profile?.last_name || "U",
                                  )}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div
                              className={`rounded-lg px-3 py-2 ${
                                isOwnMessage
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-100 text-gray-900 border border-gray-200"
                              }`}
                            >
                              {!isOwnMessage && <p className="text-xs font-medium text-blue-600 mb-1">{senderName}</p>}
                              <p className={`text-sm ${isUnread ? "font-bold" : ""}`}>{message.content}</p>
                              <p className={`text-xs mt-1 ${isOwnMessage ? "text-blue-100" : "text-gray-500"}`}>
                                {formatTime(message.sent_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-500">
                <div className="text-center">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No messages yet. Start the conversation!</p>
                </div>
              </div>
            )}
          </ScrollArea>

          <div className="border-t p-4 flex-shrink-0">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                disabled={sending}
                autoFocus
              />
              <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        userId={otherUser.id}
        userType={currentUser.role === "foundation" ? "coach" : "foundation"}
      />
    </>
  )
}
