"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChatInterface } from "@/components/chat/chat-interface"
import { InboxSection } from "@/components/chat/inbox-section"
import {
  Trophy,
  Plus,
  MapPin,
  Calendar,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  MessageCircle,
  User,
  LogOut,
  Settings,
  X,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

interface Project {
  id: string
  title: string
  description: string
  sport: string
  location: string
  start_date: string | null
  end_date: string | null
  required_skills: string[] | null
  max_volunteers: number | null
  status: "open" | "closed" | "completed"
  created_at: string
  applications?: Application[]
}

interface Application {
  id: string
  project_id: string
  coach_id: string
  status: "pending" | "accepted" | "rejected"
  message: string | null
  applied_at: string
  coach_profile?: {
    first_name: string
    last_name: string
    location: string | null
    bio: string | null
    avatar_url: string | null
  }
  coach_skills?: Array<{
    sport: string
    experience_years: number
    certification: string | null
  }>
  project_title?: string
}

export default function FoundationDashboard() {
  const { userProfile, loading, signOut } = useAuth()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [showCreateProject, setShowCreateProject] = useState(false)
  const [creatingProject, setCreatingProject] = useState(false)
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    sport: "",
    location: "",
    start_date: "",
    end_date: "",
    required_skills: "",
    max_volunteers: "1",
  })
  const [showChat, setShowChat] = useState(false)
  const [selectedChatApplication, setSelectedChatApplication] = useState<Application | null>(null)
  const [showInbox, setShowInbox] = useState(false)

  useEffect(() => {
    if (!loading && (!userProfile || userProfile.role !== "foundation")) {
      router.push("/login")
    } else if (userProfile) {
      fetchProjects()
      fetchApplications()
    }
  }, [userProfile, loading, router])

  const fetchProjects = async () => {
    if (!userProfile) return

    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("foundation_id", userProfile.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error("Error fetching projects:", error)
    }
  }

  const fetchApplications = async () => {
    if (!userProfile) return

    try {
      const { data, error } = await supabase
        .from("applications")
        .select(`
          *,
          projects!inner(foundation_id, title),
          users!applications_coach_id_fkey(
            profiles!inner(first_name, last_name, location, bio, avatar_url),
            coach_skills(sport, experience_years, certification)
          )
        `)
        .eq("projects.foundation_id", userProfile.id)
        .order("applied_at", { ascending: false })

      if (error) throw error

      console.log("[v0] Raw applications data:", data)

      const formattedApplications =
        data?.map((app: any) => {
          console.log("[v0] Processing application:", app)
          console.log("[v0] User profiles data:", app.users?.profiles)

          const coachProfile = app.users?.profiles

          return {
            ...app,
            coach_profile: coachProfile,
            coach_skills: app.users?.coach_skills || [],
            project_title: app.projects?.title,
          }
        }) || []

      console.log("[v0] Formatted applications:", formattedApplications)
      setApplications(formattedApplications)
    } catch (error) {
      console.error("Error fetching applications:", error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleCreateProject = async () => {
    if (!userProfile || !newProject.title || !newProject.description || !newProject.sport) return

    setCreatingProject(true)
    try {
      const skillsArray = newProject.required_skills
        .split(",")
        .map((skill) => skill.trim())
        .filter((skill) => skill.length > 0)

      const { error } = await supabase.from("projects").insert({
        foundation_id: userProfile.id,
        title: newProject.title,
        description: newProject.description,
        sport: newProject.sport,
        location: newProject.location,
        start_date: newProject.start_date || null,
        end_date: newProject.end_date || null,
        required_skills: skillsArray.length > 0 ? skillsArray : null,
        max_volunteers: Number.parseInt(newProject.max_volunteers) || 1,
        status: "open",
      })

      if (error) throw error

      setNewProject({
        title: "",
        description: "",
        sport: "",
        location: "",
        start_date: "",
        end_date: "",
        required_skills: "",
        max_volunteers: "1",
      })
      setShowCreateProject(false)
      fetchProjects()
    } catch (error) {
      console.error("Error creating project:", error)
      alert("Error creating project. Please try again.")
    } finally {
      setCreatingProject(false)
    }
  }

  const handleApplicationAction = async (applicationId: string, action: "accepted" | "rejected") => {
    try {
      const { error } = await supabase
        .from("applications")
        .update({
          status: action,
          updated_at: new Date().toISOString(),
        })
        .eq("id", applicationId)

      if (error) throw error

      fetchApplications()
    } catch (error) {
      console.error("Error updating application:", error)
      alert("Error updating application. Please try again.")
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  const handleStartChat = (application: Application) => {
    console.log("[v0] Starting chat with application:", application)
    console.log("[v0] Coach profile:", application.coach_profile)
    setSelectedChatApplication(application)
    setShowChat(true)
  }

  const handleInboxChat = (conversation: any) => {
    console.log("[v0] Inbox conversation data:", conversation)

    const firstName = conversation.other_user_first_name || conversation.first_name || "Coach"
    const lastName = conversation.other_user_last_name || conversation.last_name || ""

    const chatApplication: Application = {
      id: conversation.application_id,
      project_id: "",
      coach_id: conversation.other_user_id,
      status: "accepted",
      message: null,
      applied_at: "",
      coach_profile: {
        first_name: firstName,
        last_name: lastName,
        location: null,
        bio: null,
        avatar_url: conversation.other_user_avatar,
      },
      project_title: conversation.project_title,
    }

    console.log("[v0] Built chat application with coach profile:", chatApplication.coach_profile)
    setSelectedChatApplication(chatApplication)
    setShowChat(true)
    setShowInbox(false)
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800"
      case "closed":
        return "bg-gray-100 text-gray-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "accepted":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!userProfile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold">VolunTrainers</h1>
              <p className="text-sm text-gray-600">{userProfile.foundation_info?.organization_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowInbox(true)}>
              <MessageCircle className="h-4 w-4 mr-2" />
              Inbox
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/profile">
                <Settings className="h-4 w-4 mr-2" />
                Profile
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Trophy className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{projects.length}</p>
                  <p className="text-sm text-gray-600">Total Projects</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{projects.filter((p) => p.status === "open").length}</p>
                  <p className="text-sm text-gray-600">Active Projects</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{applications.filter((a) => a.status === "pending").length}</p>
                  <p className="text-sm text-gray-600">Pending Applications</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{applications.filter((a) => a.status === "accepted").length}</p>
                  <p className="text-sm text-gray-600">Active Coaches</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-full">
          {/* Tabs */}
          <Tabs defaultValue="projects" className="space-y-6">
            <TabsList>
              <TabsTrigger value="projects">My Projects</TabsTrigger>
              <TabsTrigger value="applications">Applications</TabsTrigger>
            </TabsList>

            {/* Projects Tab */}
            <TabsContent value="projects" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">My Projects</h2>
                <Dialog open={showCreateProject} onOpenChange={setShowCreateProject}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Project
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Project</DialogTitle>
                      <DialogDescription>Post a new volunteer coaching opportunity</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Project Title</Label>
                        <Input
                          id="title"
                          placeholder="e.g., Youth Football Training Program"
                          value={newProject.title}
                          onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          placeholder="Describe the project, goals, and what you're looking for in a coach..."
                          rows={4}
                          value={newProject.description}
                          onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="sport">Sport</Label>
                          <Select
                            value={newProject.sport}
                            onValueChange={(value) => setNewProject({ ...newProject, sport: value })}
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
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            placeholder="City, Country"
                            value={newProject.location}
                            onChange={(e) => setNewProject({ ...newProject, location: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="startDate">Start Date (optional)</Label>
                          <Input
                            id="startDate"
                            type="date"
                            value={newProject.start_date}
                            onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="endDate">End Date (optional)</Label>
                          <Input
                            id="endDate"
                            type="date"
                            value={newProject.end_date}
                            onChange={(e) => setNewProject({ ...newProject, end_date: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="skills">Required Skills (comma-separated)</Label>
                        <Input
                          id="skills"
                          placeholder="e.g., Youth coaching, Team management, Weekend availability"
                          value={newProject.required_skills}
                          onChange={(e) => setNewProject({ ...newProject, required_skills: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxVolunteers">Maximum Volunteers</Label>
                        <Input
                          id="maxVolunteers"
                          type="number"
                          min="1"
                          value={newProject.max_volunteers}
                          onChange={(e) => setNewProject({ ...newProject, max_volunteers: e.target.value })}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleCreateProject}
                          disabled={
                            creatingProject || !newProject.title || !newProject.description || !newProject.sport
                          }
                          className="flex-1"
                        >
                          {creatingProject ? "Creating..." : "Create Project"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowCreateProject(false)}
                          disabled={creatingProject}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-6">
                {projects.length > 0 ? (
                  projects.map((project) => (
                    <Card key={project.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-xl">{project.title}</CardTitle>
                            <CardDescription className="flex items-center gap-4 mt-2">
                              <span className="flex items-center gap-1">
                                <Trophy className="h-4 w-4" />
                                {project.sport}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {project.location}
                              </span>
                              {project.start_date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {formatDate(project.start_date)}
                                </span>
                              )}
                            </CardDescription>
                          </div>
                          <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 mb-4">{project.description}</p>
                        {project.required_skills && project.required_skills.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-semibold text-gray-900 mb-2">Required Skills:</p>
                            <div className="flex flex-wrap gap-2">
                              {project.required_skills.map((skill, index) => (
                                <Badge key={index} variant="secondary">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>Max volunteers: {project.max_volunteers}</span>
                          <span>Created: {formatDate(project.created_at)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
                      <p className="text-gray-600 mb-4">
                        Create your first project to start connecting with volunteer coaches
                      </p>
                      <Button onClick={() => setShowCreateProject(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Project
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Applications Tab */}
            <TabsContent value="applications" className="space-y-6">
              <h2 className="text-2xl font-bold">Coach Applications</h2>
              <div className="grid gap-6">
                {applications.length > 0 ? (
                  applications.map((application) => (
                    <Card key={application.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={application.coach_profile?.avatar_url || ""} />
                              <AvatarFallback>
                                {getInitials(
                                  application.coach_profile?.first_name || "U",
                                  application.coach_profile?.last_name || "U",
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg">
                                {application.coach_profile?.first_name} {application.coach_profile?.last_name}
                              </CardTitle>
                              <CardDescription className="flex items-center gap-4">
                                {application.coach_profile?.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {application.coach_profile.location}
                                  </span>
                                )}
                                <span>Applied: {formatDate(application.applied_at)}</span>
                              </CardDescription>
                            </div>
                          </div>
                          <Badge className={getStatusColor(application.status)}>{application.status}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {application.message && (
                          <div className="mb-4">
                            <p className="text-sm font-semibold text-gray-900 mb-2">Application Message:</p>
                            <p className="text-gray-700">{application.message}</p>
                          </div>
                        )}
                        {application.coach_profile?.bio && (
                          <div className="mb-4">
                            <p className="text-sm font-semibold text-gray-900 mb-2">Coach Bio:</p>
                            <p className="text-gray-700">{application.coach_profile.bio}</p>
                          </div>
                        )}
                        {application.coach_skills && application.coach_skills.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-semibold text-gray-900 mb-2">Skills & Experience:</p>
                            <div className="space-y-2">
                              {application.coach_skills.map((skill, index) => (
                                <div key={index} className="flex items-center gap-4 text-sm">
                                  <span className="font-medium capitalize">{skill.sport}</span>
                                  <span className="text-gray-600">{skill.experience_years} years</span>
                                  {skill.certification && <Badge variant="secondary">{skill.certification}</Badge>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {application.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApplicationAction(application.id, "accepted")}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApplicationAction(application.id, "rejected")}
                              className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleStartChat(application)}>
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Message
                            </Button>
                          </div>
                        )}
                        {application.status === "accepted" && (
                          <Button size="sm" variant="outline" onClick={() => handleStartChat(application)}>
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Message Coach
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No applications yet</h3>
                      <p className="text-gray-600">
                        Applications from coaches will appear here once you create projects
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Inbox Modal */}
      {showInbox && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Messages</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowInbox(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <InboxSection currentUser={userProfile} userType="foundation" onStartChat={handleInboxChat} />
            </div>
          </div>
        </div>
      )}

      {/* Chat Interface */}
      {showChat && selectedChatApplication && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <ChatInterface
            applicationId={selectedChatApplication.id}
            currentUser={userProfile}
            otherUser={{
              id: selectedChatApplication.coach_id,
              name: (() => {
                const profile = selectedChatApplication.coach_profile
                console.log("[v0] Building coach name from profile:", profile)

                if (profile?.first_name && profile?.last_name) {
                  return `${profile.first_name} ${profile.last_name}`
                } else if (profile?.first_name) {
                  return profile.first_name
                } else if (profile?.last_name) {
                  return profile.last_name
                } else {
                  return "Coach"
                }
              })(),
              avatar_url: selectedChatApplication.coach_profile?.avatar_url,
            }}
            projectTitle={selectedChatApplication.project_title || "Project Discussion"}
            onBack={() => {
              setShowChat(false)
              setSelectedChatApplication(null)
              setShowInbox(true)
            }}
            onClose={() => {
              setShowChat(false)
              setSelectedChatApplication(null)
            }}
          />
        </div>
      )}
    </div>
  )
}
