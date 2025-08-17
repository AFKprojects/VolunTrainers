"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trophy, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

export default function ConfirmPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        const token_hash = searchParams.get("token_hash")
        const type = searchParams.get("type")

        if (token_hash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as any,
          })

          if (error) {
            console.error("Confirmation error:", error)
            setStatus("error")
            setMessage("Failed to confirm email. The link may be expired or invalid.")
          } else {
            setStatus("success")
            setMessage("Email confirmed successfully! You can now sign in to your account.")
          }
        } else {
          setStatus("error")
          setMessage("Invalid confirmation link.")
        }
      } catch (error) {
        console.error("Confirmation error:", error)
        setStatus("error")
        setMessage("An error occurred during confirmation.")
      }
    }

    handleEmailConfirmation()
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Trophy className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold">VolunTrainers</h1>
          </div>
          <CardTitle className="text-2xl">Email Confirmation</CardTitle>
          <CardDescription>
            {status === "loading" && "Confirming your email address..."}
            {status === "success" && "Your email has been confirmed!"}
            {status === "error" && "Confirmation failed"}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === "loading" && (
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          )}

          {status === "success" && (
            <div className="space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <p className="text-gray-600">{message}</p>
              <Button asChild className="w-full">
                <Link href="/login">Sign In Now</Link>
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <XCircle className="h-16 w-16 text-red-500 mx-auto" />
              <p className="text-gray-600">{message}</p>
              <div className="space-y-2">
                <Button asChild className="w-full">
                  <Link href="/login">Try Signing In</Link>
                </Button>
                <Button variant="outline" asChild className="w-full bg-transparent">
                  <Link href="/signup">Create New Account</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
