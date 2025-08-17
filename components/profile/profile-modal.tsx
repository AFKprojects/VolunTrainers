"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Award, Building, Globe } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  userType: "coach" | "foundation"
}

interface CoachProfile {
  first_name: string
  last_name: string
  avatar_url?: string
  location?: string
  bio?: string
  skills?: Array<{
    sport: string
    experience_years: number
    certification?: string
  }>
}

interface FoundationProfile {
  organization_name: string
  website?: string
  description?: string
  avatar_url?: string
  location?: string
}

const ProfileModal = ({ isOpen, onClose, userId, userType }: ProfileModalProps) => {
  const [profile, setProfile] = useState<CoachProfile | FoundationProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen && userId) {
      fetchProfile()
    }
  }, [isOpen, userId, userType])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      console.log("[v0] Profile modal fetching profile for userId:", userId, "userType:", userType)

      if (userType === "coach") {
        console.log("[v0] Fetching coach profile from profiles table...")
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .single()

        console.log("[v0] Profile data result:", profileData, "error:", profileError)

        if (profileError) {
          console.error("[v0] Profile fetch error:", profileError)
          throw profileError
        }

        console.log("[v0] Fetching coach skills...")
        const { data: skillsData, error: skillsError } = await supabase
          .from("coach_skills")
          .select("*")
          .eq("user_id", userId)

        console.log("[v0] Skills data result:", skillsData, "error:", skillsError)

        setProfile({
          ...profileData,
          skills: skillsData || [],
        })
      } else {
        console.log("[v0] Fetching foundation profile from foundation_info table...")
        const { data: foundationData, error: foundationError } = await supabase
          .from("foundation_info")
          .select("*")
          .eq("user_id", userId)
          .single()

        console.log("[v0] Foundation data result:", foundationData, "error:", foundationError)

        if (foundationError) {
          console.error("[v0] Foundation fetch error:", foundationError)
          throw foundationError
        }

        console.log("[v0] Fetching foundation avatar from profiles table...")
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("user_id", userId)
          .single()

        console.log("[v0] Foundation avatar result:", profileData, "error:", profileError)

        setProfile({
          ...foundationData,
          avatar_url: profileData?.avatar_url,
        })
      }
    } catch (error) {
      console.error("[v0] Error fetching profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const renderCoachProfile = (profile: CoachProfile) => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={profile.avatar_url || ""} />
          <AvatarFallback className="text-lg">
            {profile.first_name.charAt(0)}
            {profile.last_name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-2xl font-bold">
            {profile.first_name} {profile.last_name}
          </h2>
          {profile.location && (
            <p className="text-gray-600 flex items-center gap-1 mt-1">
              <MapPin className="h-4 w-4" />
              {profile.location}
            </p>
          )}
        </div>
      </div>

      {profile.bio && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">About</h3>
            <p className="text-gray-700">{profile.bio}</p>
          </CardContent>
        </Card>
      )}

      {profile.skills && profile.skills.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4">Skills & Experience</h3>
            <div className="space-y-3">
              {profile.skills.map((skill, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{skill.sport}</p>
                    {skill.certification && (
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Award className="h-3 w-3" />
                        {skill.certification}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary">{skill.experience_years} years</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  const renderFoundationProfile = (profile: FoundationProfile) => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={profile.avatar_url || ""} />
          <AvatarFallback className="text-lg">
            <Building className="h-8 w-8" />
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-2xl font-bold">{profile.organization_name}</h2>
          {profile.location && (
            <p className="text-gray-600 flex items-center gap-1 mt-1">
              <MapPin className="h-4 w-4" />
              {profile.location}
            </p>
          )}
          {profile.website && (
            <p className="text-blue-600 flex items-center gap-1 mt-1">
              <Globe className="h-4 w-4" />
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {profile.website}
              </a>
            </p>
          )}
        </div>
      </div>

      {profile.description && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">About Organization</h3>
            <p className="text-gray-700">{profile.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : profile ? (
          userType === "coach" ? (
            renderCoachProfile(profile as CoachProfile)
          ) : (
            renderFoundationProfile(profile as FoundationProfile)
          )
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Profile not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default ProfileModal
