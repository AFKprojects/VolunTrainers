"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Trophy, Users, Heart, ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase"

export function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialRole = searchParams.get("role") as "coach" | "foundation" | null

  const [role, setRole] = useState<"coach" | "foundation">(initialRole || "coach")
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    location: "",
    bio: "",
    // Coach specific
    sport: "",
    experienceYears: "",
    certification: "",
    // Foundation specific
    organizationName: "",
    website: "",
    description: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords don't match")
      return
    }

    setLoading(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      })

      if (authError) throw authError

      if (authData.user) {
        // Insert user record
        const { error: userError } = await supabase.from("users").insert({
          id: authData.user.id,
          email: formData.email,
          password_hash: "handled_by_auth",
          role: role,
        })

        if (userError) throw userError

        // Insert profile
        const { error: profileError } = await supabase.from("profiles").insert({
          user_id: authData.user.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone || null,
          location: formData.location || null,
          bio: formData.bio || null,
        })

        if (profileError) throw profileError

        // Insert role-specific data
        if (role === "coach") {
          const { error: skillError } = await supabase.from("coach_skills").insert({
            user_id: authData.user.id,
            sport: formData.sport,
            experience_years: Number.parseInt(formData.experienceYears) || 0,
            certification: formData.certification || null,
          })

          if (skillError) throw skillError
        } else {
          const { error: foundationError } = await supabase.from("foundation_info").insert({
            user_id: authData.user.id,
            organization_name: formData.organizationName,
            website: formData.website || null,
            description: formData.description || null,
          })

          if (foundationError) throw foundationError
        }

        alert(`Account created successfully! 

IMPORTANT: Please check your email to verify your account. 

⚠️ Email Delivery Notice:
• Check your spam/junk folder
• Emails may take a few minutes to arrive
• If no email arrives, this is due to Supabase's default email provider limitations

For reliable email delivery, configure a custom SMTP provider in your Supabase project settings (Authentication > Settings > SMTP Settings).`)
        router.push("/login")
      }
    } catch (error) {
      console.error("Signup error:", error)
      alert("Error creating account. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Trophy className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold">VolunTrainers</h1>
          </div>
          <CardTitle className="text-2xl">Create Your Account</CardTitle>
          <CardDescription>Join our community of volunteer sports coaches and organizations</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div className="space-y-2">
              <Label>I want to join as:</Label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={role === "coach" ? "default" : "outline"}
                  onClick={() => setRole("coach")}
                  className="h-auto p-4 flex flex-col items-center gap-2"
                >
                  <Users className="h-6 w-6" />
                  <div>
                    <div className="font-semibold">Coach</div>
                    <div className="text-xs opacity-70">Volunteer your skills</div>
                  </div>
                </Button>
                <Button
                  type="button"
                  variant={role === "foundation" ? "default" : "outline"}
                  onClick={() => setRole("foundation")}
                  className="h-auto p-4 flex flex-col items-center gap-2"
                >
                  <Heart className="h-6 w-6" />
                  <div>
                    <div className="font-semibold">Foundation</div>
                    <div className="text-xs opacity-70">Find coaches</div>
                  </div>
                </Button>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>
            </div>

            {role === "coach" ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sport">Primary Sport</Label>
                    <Select
                      value={formData.sport}
                      onValueChange={(value) => setFormData({ ...formData, sport: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select sport" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="football">Football</SelectItem>
                        <SelectItem value="basketball">Basketball</SelectItem>
                        <SelectItem value="volleyball">Volleyball</SelectItem>
                        <SelectItem value="athletics">Athletics</SelectItem>
                        <SelectItem value="tennis">Tennis</SelectItem>
                        <SelectItem value="swimming">Swimming</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experienceYears">Years of Experience</Label>
                    <Input
                      id="experienceYears"
                      type="number"
                      min="0"
                      value={formData.experienceYears}
                      onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="certification">Certifications (optional)</Label>
                  <Input
                    id="certification"
                    placeholder="e.g., UEFA B License, FIBA Level 3"
                    value={formData.certification}
                    onChange={(e) => setFormData({ ...formData, certification: e.target.value })}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="organizationName">Organization Name</Label>
                  <Input
                    id="organizationName"
                    required
                    value={formData.organizationName}
                    onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Contact First Name</Label>
                    <Input
                      id="firstName"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Contact Last Name</Label>
                    <Input
                      id="lastName"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website (optional)</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://your-organization.org"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Organization Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Tell us about your organization and mission..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="City, Country"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder={
                  role === "coach"
                    ? "Tell us about your coaching philosophy and experience..."
                    : "Additional information about your organization..."
                }
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 hover:underline">
                Sign in
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
