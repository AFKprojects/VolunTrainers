"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trophy, ArrowLeft, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"

export function LoginForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          setError(
            "Please check your email and click the confirmation link before signing in. Check your spam folder if you don't see it.",
          )
        } else if (error.message.includes("Invalid login credentials")) {
          setError("Invalid email or password. Please check your credentials and try again.")
        } else {
          setError(error.message)
        }
        return
      }

      if (data.user) {
        // Get user role to redirect appropriately
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("id", data.user.id)
          .single()

        if (userError) throw userError

        // Redirect based on role
        if (userData.role === "coach") {
          router.push("/coach/dashboard")
        } else {
          router.push("/foundation/dashboard")
        }
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    if (!formData.email) {
      setError("Please enter your email address first.")
      return
    }

    setResendLoading(true)
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: formData.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      })

      if (error) {
        if (error.message.includes("For security purposes")) {
          setError("Please wait 60 seconds before requesting another confirmation email.")
        } else {
          throw error
        }
        return
      }

      setError(null)
      alert("Confirmation email sent! Please check your inbox and spam folder.")
    } catch (error) {
      console.error("Resend error:", error)
      setError("Failed to resend confirmation email. Please try again.")
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Trophy className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold">VolunTrainers</h1>
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-700">
                    <p>{error}</p>
                    {error.includes("confirmation") && !error.includes("wait") && (
                      <div className="mt-2 space-y-2">
                        <Button
                          type="button"
                          variant="link"
                          className="h-auto p-0 text-red-600 underline text-sm"
                          onClick={handleResendConfirmation}
                          disabled={resendLoading}
                        >
                          {resendLoading ? "Sending..." : "Resend confirmation email"}
                        </Button>
                        <div className="text-xs text-red-600 bg-red-100 p-2 rounded">
                          <p className="font-medium">Email not arriving?</p>
                          <ul className="mt-1 space-y-1">
                            <li>• Check your spam/junk folder</li>
                            <li>• Wait 2-3 minutes for delivery</li>
                            <li>• Supabase's default email has rate limits</li>
                          </ul>
                          <p className="mt-1 text-xs">
                            For reliable emails, configure custom SMTP in Supabase project settings.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link href="/signup" className="text-blue-600 hover:underline">
                Sign up
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Button variant="ghost" asChild>
              <Link href="/" className="text-sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
