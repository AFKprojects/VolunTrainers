"use client"

import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

export interface UserProfile {
  id: string
  email: string
  role: "coach" | "foundation"
  profile: {
    first_name: string
    last_name: string
    phone?: string
    location?: string
    bio?: string
    avatar_url?: string
  }
  coach_skills?: Array<{
    sport: string
    experience_years: number
    certification?: string
  }>
  foundation_info?: {
    organization_name: string
    website?: string
    description?: string
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchUserProfile(session.user.id)
      } else {
        setUserProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      // Get user data with role
      const { data: userData, error: userError } = await supabase.from("users").select("*").eq("id", userId).single()

      if (userError) throw userError

      // Get profile data
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single()

      if (profileError) throw profileError

      let additionalData = {}

      if (userData.role === "coach") {
        const { data: skillsData } = await supabase.from("coach_skills").select("*").eq("user_id", userId)

        additionalData = { coach_skills: skillsData || [] }
      } else {
        const { data: foundationData } = await supabase
          .from("foundation_info")
          .select("*")
          .eq("user_id", userId)
          .single()

        additionalData = { foundation_info: foundationData }
      }

      setUserProfile({
        id: userData.id,
        email: userData.email,
        role: userData.role,
        profile: profileData,
        ...additionalData,
      })
    } catch (error) {
      console.error("Error fetching user profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return {
    user,
    userProfile,
    loading,
    signOut,
    isAuthenticated: !!user,
    isCoach: userProfile?.role === "coach",
    isFoundation: userProfile?.role === "foundation",
  }
}
