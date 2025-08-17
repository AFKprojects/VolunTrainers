"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface UnreadCount {
  application_id: string
  count: number
}

export function useChat(userId: string) {
  const [unreadCounts, setUnreadCounts] = useState<UnreadCount[]>([])

  useEffect(() => {
    if (!userId) return

    fetchUnreadCounts()
    subscribeToNewMessages()
  }, [userId])

  const fetchUnreadCounts = async () => {
    try {
      // This would require additional database logic to track read/unread status
      // For now, we'll keep it simple and just track message counts
      const { data, error } = await supabase.from("messages").select("application_id").neq("sender_id", userId)

      if (error) throw error

      // Group by application_id and count
      const counts = data?.reduce((acc: { [key: string]: number }, msg) => {
        acc[msg.application_id] = (acc[msg.application_id] || 0) + 1
        return acc
      }, {})

      const unreadArray = Object.entries(counts || {}).map(([application_id, count]) => ({
        application_id,
        count: count as number,
      }))

      setUnreadCounts(unreadArray)
    } catch (error) {
      console.error("Error fetching unread counts:", error)
    }
  }

  const subscribeToNewMessages = () => {
    const channel = supabase
      .channel("new_messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          if (payload.new.sender_id !== userId) {
            fetchUnreadCounts()
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const getUnreadCount = (applicationId: string) => {
    const found = unreadCounts.find((uc) => uc.application_id === applicationId)
    return found?.count || 0
  }

  return {
    unreadCounts,
    getUnreadCount,
    refreshUnreadCounts: fetchUnreadCounts,
  }
}
