"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageCircle } from "lucide-react"
import { useChat } from "@/hooks/use-chat"

interface ChatButtonProps {
  applicationId: string
  userId: string
  onClick: () => void
  size?: "sm" | "default"
  variant?: "default" | "outline"
  children?: React.ReactNode
}

export function ChatButton({
  applicationId,
  userId,
  onClick,
  size = "sm",
  variant = "outline",
  children,
}: ChatButtonProps) {
  const { getUnreadCount } = useChat(userId)
  const unreadCount = getUnreadCount(applicationId)

  return (
    <Button size={size} variant={variant} onClick={onClick} className="relative">
      <MessageCircle className="h-4 w-4 mr-2" />
      {children || "Message"}
      {unreadCount > 0 && (
        <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500">
          {unreadCount > 9 ? "9+" : unreadCount}
        </Badge>
      )}
    </Button>
  )
}
