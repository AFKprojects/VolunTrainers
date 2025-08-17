"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { MapPin, Phone, Mail, Trophy, Calendar, Edit, Plus, X } from "lucide-react"
import type { UserProfile } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"

interface CoachProfileProps {
  profile: UserProfile
  isOwnProfile?: boolean
  onProfileUpdate?: () => void
}

export function CoachProfile({ profile, isOwnProfile = false, onProfileUpdate }: CoachProfileProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editData, setEditData] = useState({
    first_name: profile.profile.first_name,
    last_name: profile.profile.last_name,
    phone: profile.profile.phone || "",
    location: profile.profile.location || "",
    bio: profile.profile.bio || "",
  })
  const [newSkill, setNewSkill] = useState({
    sport: "",
    experience_years: "",
    certification: "",
  })
  const [showAddSkill, setShowAddSkill] = useState(false)

  const handleSaveProfile = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
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

      if (error) throw error

      setIsEditing(false)
      onProfileUpdate?.()
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("Error updating profile. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleAddSkill = async () => {
    if (!newSkill.sport) return

    setLoading(true)
    try {
      const { error } = await supabase.from("coach_skills").insert({
        user_id: profile.id,
        sport: newSkill.sport,
        experience_years: Number.parseInt(newSkill.experience_years) || 0,
        certification: newSkill.certification || null,
      })

      if (error) throw error

      setNewSkill({ sport: "", experience_years: "", certification: "" })
      setShowAddSkill(false)
      onProfileUpdate?.()
    } catch (error) {
      console.error("Error adding skill:", error)
      alert("Error adding skill. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveSkill = async (skillId: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.from("coach_skills").delete().eq("id", skillId)

      if (error) throw error

      onProfileUpdate?.()
    } catch (error) {
      console.error("Error removing skill:", error)
      alert("Error removing skill. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
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
                  {getInitials(profile.profile.first_name, profile.profile.last_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">
                  {profile.profile.first_name} {profile.profile.last_name}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Trophy className="h-4 w-4" />
                  Volunteer Sports Coach
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
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>Update your personal information</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={editData.first_name}
                          onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
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
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={editData.bio}
                        onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                        rows={3}
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
        {profile.profile.bio && (
          <CardContent>
            <p className="text-gray-700">{profile.profile.bio}</p>
          </CardContent>
        )}
      </Card>

      {/* Skills & Experience */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Skills & Experience</CardTitle>
              <CardDescription>Sports coaching expertise and certifications</CardDescription>
            </div>
            {isOwnProfile && (
              <Dialog open={showAddSkill} onOpenChange={setShowAddSkill}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Skill
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Skill</DialogTitle>
                    <DialogDescription>Add a sport you can coach</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="sport">Sport</Label>
                      <Select
                        value={newSkill.sport}
                        onValueChange={(value) => setNewSkill({ ...newSkill, sport: value })}
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
                      <Label htmlFor="experience">Years of Experience</Label>
                      <Input
                        id="experience"
                        type="number"
                        min="0"
                        value={newSkill.experience_years}
                        onChange={(e) => setNewSkill({ ...newSkill, experience_years: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="certification">Certification (optional)</Label>
                      <Input
                        id="certification"
                        placeholder="e.g., UEFA B License"
                        value={newSkill.certification}
                        onChange={(e) => setNewSkill({ ...newSkill, certification: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddSkill} disabled={loading || !newSkill.sport} className="flex-1">
                        {loading ? "Adding..." : "Add Skill"}
                      </Button>
                      <Button variant="outline" onClick={() => setShowAddSkill(false)} disabled={loading}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {profile.coach_skills && profile.coach_skills.length > 0 ? (
            <div className="space-y-4">
              {profile.coach_skills.map((skill, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold capitalize">{skill.sport}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      {skill.experience_years} years
                    </div>
                    {skill.certification && <Badge variant="secondary">{skill.certification}</Badge>}
                  </div>
                  {isOwnProfile && (
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveSkill(skill.id)} disabled={loading}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No skills added yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
