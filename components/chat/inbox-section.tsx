"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Clock } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { UserProfile } from "@/hooks/use-auth"

interface Conversation {
  application_id: string
  project_title: string
  other_user_name: string
  other_user_first_name: string
  other_user_last_name: string
  other_user_avatar?: string
  other_user_id: string
  last_message?: string
  last_message_time?: string
  unread_count: number
}

interface InboxSectionProps {
  currentUser: UserProfile
  userType: "coach" | "foundation"
  onStartChat: (conversation: Conversation) => void
}

export function InboxSection({ currentUser, userType, onStartChat }: InboxSectionProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConversations()
  }, [currentUser.id, userType])

  const fetchConversations = async () => {
    try {
      let query

      if (userType === "foundation") {
        // For foundations, get conversations from applications to their projects
        query = supabase
          .from("applications")
          .select(`
            id,
            projects!inner(title, foundation_id),
            users!applications_coach_id_fkey(
              profiles!inner(first_name, last_name, avatar_url)
            )
          `)
          .eq("projects.foundation_id", currentUser.id)
      } else {
        // For coaches, get conversations from their applications
        query = supabase
          .from("applications")
          .select(`
            id,
            coach_id,
            projects!inner(
              title,
              foundation_id,
              users!projects_foundation_id_fkey(
                foundation_info!inner(organization_name),
                profiles!inner(avatar_url)
              )
            )
          `)
          .eq("coach_id", currentUser.id)
      }

      const { data: applications, error } = await query

      if (error) throw error

      // Get last messages for each conversation
      const conversationsWithMessages = await Promise.all(
        (applications || []).map(async (app: any) => {
          const { data: lastMessage } = await supabase
            .from("messages")
            .select("content, sent_at, sender_id")
            .eq("application_id", app.id)
            .order("sent_at", { ascending: false })
            .limit(1)
            .single()

          const { count: unreadCount } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("application_id", app.id)
            .neq("sender_id", currentUser.id)

          if (userType === "foundation") {
            const profile = app.users?.profiles?.[0] // Get first profile from array
            return {
              application_id: app.id,
              project_title: app.projects?.title || "Project",
              other_user_name: `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "Coach",
              other_user_first_name: profile?.first_name || "Coach",
              other_user_last_name: profile?.last_name || "",
              other_user_avatar: profile?.avatar_url,
              other_user_id: app.coach_id,
              last_message: lastMessage?.content,
              last_message_time: lastMessage?.sent_at,
              unread_count: unreadCount || 0,
            }
          } else {
            return {
              application_id: app.id,
              project_title: app.projects?.title || "Project",
              other_user_name: app.projects?.users?.foundation_info?.organization_name || "Organization",
              other_user_first_name: app.projects?.users?.foundation_info?.organization_name || "Organization",
              other_user_last_name: "",
              other_user_avatar: app.projects?.users?.profiles?.avatar_url,
              other_user_id: app.projects?.foundation_id,
              last_message: lastMessage?.content,
              last_message_time: lastMessage?.sent_at,
              unread_count: unreadCount || 0,
            }
          }
        }),
      )

      const sortedConversations = conversationsWithMessages.sort((a, b) => {
        if (!a.last_message_time && !b.last_message_time) return 0
        if (!a.last_message_time) return 1
        if (!b.last_message_time) return -1
        return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
      })

      setConversations(sortedConversations)
    } catch (error) {
      console.error("Error fetching conversations:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateString?: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else {
      return date.toLocaleDateString()
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Messages
          {conversations.reduce((total, conv) => total + conv.unread_count, 0) > 0 && (
            <Badge variant="secondary">
              {conversations.reduce((total, conv) => total + conv.unread_count, 0)} unread
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {conversations.length > 0 ? (
          <div className="space-y-3">
            {conversations.map((conversation) => (
              <div
                key={conversation.application_id}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onStartChat(conversation)}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={conversation.other_user_avatar || ""} />
                  <AvatarFallback>{conversation.other_user_name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate ${conversation.unread_count > 0 ? "font-bold" : "font-medium"}`}>
                      {conversation.other_user_name}
                    </p>
                    <div className="flex items-center gap-2">
                      {conversation.last_message_time && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(conversation.last_message_time)}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 truncate">{conversation.project_title}</p>
                  {conversation.last_message && (
                    <p
                      className={`text-xs text-gray-500 truncate mt-1 ${conversation.unread_count > 0 ? "font-semibold" : ""}`}
                    >
                      {conversation.last_message}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No conversations yet</p>
            <p className="text-xs text-gray-400 mt-1">
              {userType === "foundation"
                ? "Messages will appear when coaches apply to your projects"
                : "Messages will appear when you apply to projects"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
