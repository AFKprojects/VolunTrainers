"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MapPin, Award, User } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface CoachProfile {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  location?: string
  bio?: string
  avatar_url?: string
  skills: Array<{
    sport: string
    experience_years: number
    certification?: string
  }>
}

interface CoachProfilePageProps {
  coachId: string
}

export function CoachProfilePage({ coachId }: CoachProfilePageProps) {
  const [profile, setProfile] = useState<CoachProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCoachProfile()
  }, [coachId])

  const fetchCoachProfile = async () => {
    try {
      const { data: userData, error: userError } = await supabase.from("users").select("*").eq("id", coachId).single()

      if (userError) throw userError

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", coachId)
        .single()

      if (profileError) throw profileError

      const { data: skillsData, error: skillsError } = await supabase
        .from("coach_skills")
        .select("*")
        .eq("user_id", coachId)

      if (skillsError) throw skillsError

      setProfile({
        ...userData,
        ...profileData,
        skills: skillsData || [],
      })
    } catch (error) {
      console.error("Error fetching coach profile:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Coach profile not found</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.avatar_url || ""} />
              <AvatarFallback className="text-2xl">
                {profile.first_name.charAt(0)}
                {profile.last_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">
                {profile.first_name} {profile.last_name}
              </CardTitle>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                {profile.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {profile.location}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Volunteer Coach
                </div>
              </div>
              {profile.bio && <p className="text-gray-700">{profile.bio}</p>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Award className="h-5 w-5" />
              Skills & Experience
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {profile.skills.map((skill, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{skill.sport}</h4>
                    <Badge variant="secondary">
                      {skill.experience_years} {skill.experience_years === 1 ? "year" : "years"}
                    </Badge>
                  </div>
                  {skill.certification && (
                    <p className="text-sm text-gray-600">
                      <Award className="h-3 w-3 inline mr-1" />
                      {skill.certification}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
