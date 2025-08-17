"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { MapPin, Phone, Mail, Building, Globe, Edit } from "lucide-react"
import type { UserProfile } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"

interface FoundationProfileProps {
  profile: UserProfile
  isOwnProfile?: boolean
  onProfileUpdate?: () => void
}

export function FoundationProfile({ profile, isOwnProfile = false, onProfileUpdate }: FoundationProfileProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editData, setEditData] = useState({
    first_name: profile.profile.first_name,
    last_name: profile.profile.last_name,
    phone: profile.profile.phone || "",
    location: profile.profile.location || "",
    bio: profile.profile.bio || "",
    organization_name: profile.foundation_info?.organization_name || "",
    website: profile.foundation_info?.website || "",
    description: profile.foundation_info?.description || "",
  })

  const handleSaveProfile = async () => {
    setLoading(true)
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: editData.first_name,
          last_name: editData.last_name,
          phone: editData.phone || null,
          location: editData.location || null,
          bio: editData.bio || null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", profile.id)

      if (profileError) throw profileError

      // Update foundation info
      const { error: foundationError } = await supabase
        .from("foundation_info")
        .update({
          organization_name: editData.organization_name,
          website: editData.website || null,
          description: editData.description || null,
        })
        .eq("user_id", profile.id)

      if (foundationError) throw foundationError

      setIsEditing(false)
      onProfileUpdate?.()
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("Error updating profile. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (orgName: string) => {
    return orgName
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.profile.avatar_url || ""} />
                <AvatarFallback className="text-lg">
                  {getInitials(profile.foundation_info?.organization_name || "ORG")}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{profile.foundation_info?.organization_name}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Building className="h-4 w-4" />
                  Non-Profit Organization
                </CardDescription>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  {profile.profile.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {profile.profile.location}
                    </div>
                  )}
                  {profile.profile.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {profile.profile.phone}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {profile.email}
                  </div>
                  {profile.foundation_info?.website && (
                    <div className="flex items-center gap-1">
                      <Globe className="h-4 w-4" />
                      <a
                        href={profile.foundation_info.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Website
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {isOwnProfile && (
              <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>Update your organization information</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="orgName">Organization Name</Label>
                      <Input
                        id="orgName"
                        value={editData.organization_name}
                        onChange={(e) => setEditData({ ...editData, organization_name: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Contact First Name</Label>
                        <Input
                          id="firstName"
                          value={editData.first_name}
                          onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Contact Last Name</Label>
                        <Input
                          id="lastName"
                          value={editData.last_name}
                          onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={editData.phone}
                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={editData.location}
                        onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        value={editData.website}
                        onChange={(e) => setEditData({ ...editData, website: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Organization Description</Label>
                      <Textarea
                        id="description"
                        value={editData.description}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Additional Info</Label>
                      <Textarea
                        id="bio"
                        value={editData.bio}
                        onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveProfile} disabled={loading} className="flex-1">
                        {loading ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditing(false)} disabled={loading}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        {(profile.foundation_info?.description || profile.profile.bio) && (
          <CardContent>
            <div className="space-y-3">
              {profile.foundation_info?.description && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">About Our Organization</h4>
                  <p className="text-gray-700">{profile.foundation_info.description}</p>
                </div>
              )}
              {profile.profile.bio && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Additional Information</h4>
                  <p className="text-gray-700">{profile.profile.bio}</p>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>Get in touch with our organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-500" />
              <span>{profile.email}</span>
            </div>
            {profile.profile.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-500" />
                <span>{profile.profile.phone}</span>
              </div>
            )}
            {profile.profile.location && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-gray-500" />
                <span>{profile.profile.location}</span>
              </div>
            )}
            {profile.foundation_info?.website && (
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-gray-500" />
                <a
                  href={profile.foundation_info.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {profile.foundation_info.website}
                </a>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Building className="h-5 w-5 text-gray-500" />
              <span>
                Contact: {profile.profile.first_name} {profile.profile.last_name}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
