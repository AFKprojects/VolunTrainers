"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  MapPin,
  Calendar,
  Users,
  Clock,
  CheckCircle,
  MessageCircle,
  Building,
  LogOut,
  Settings,
  Search,
  Filter,
  Send,
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
  foundation_info?: {
    organization_name: string
    website?: string
    description?: string
  }
  foundation_profile?: {
    first_name: string
    last_name: string
    location?: string
  }
  user_application?: {
    id: string
    status: "pending" | "accepted" | "rejected"
    message: string | null
    applied_at: string
  }
}

interface Application {
  id: string
  project_id: string
  status: "pending" | "accepted" | "rejected"
  message: string | null
  applied_at: string
  updated_at: string
  project?: {
    title: string
    sport: string
    location: string
    foundation_id: string
    foundation_info?: {
      organization_name: string
    }
  }
}

export default function CoachDashboard() {
  const { userProfile, loading, signOut } = useAuth()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sportFilter, setSportFilter] = useState("all")
  const [locationFilter, setLocationFilter] = useState("")
  const [showApplicationDialog, setShowApplicationDialog] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [applicationMessage, setApplicationMessage] = useState("")
  const [submittingApplication, setSubmittingApplication] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [selectedChatApplication, setSelectedChatApplication] = useState<Application | null>(null)
  const [showInbox, setShowInbox] = useState(false)

  useEffect(() => {
    if (!loading && (!userProfile || userProfile.role !== "coach")) {
      router.push("/login")
    } else if (userProfile) {
      fetchProjects()
      fetchApplications()
    }
  }, [userProfile, loading, router])

  const fetchProjects = async () => {
    if (!userProfile) return

    try {
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select(`
          *,
          users!projects_foundation_id_fkey(
            id,
            foundation_info(organization_name, website, description),
            profiles(first_name, last_name, location)
          )
        `)
        .eq("status", "open")
        .order("created_at", { ascending: false })

      if (projectsError) throw projectsError

      // Get user's applications to mark applied projects
      const { data: userApplications, error: applicationsError } = await supabase
        .from("applications")
        .select("project_id, id, status, message, applied_at")
        .eq("coach_id", userProfile.id)

      if (applicationsError) throw applicationsError

      const projectsWithApplications = projectsData?.map((project: any) => {
        const userApplication = userApplications?.find((app) => app.project_id === project.id)
        return {
          ...project,
          foundation_info: project.users?.foundation_info?.[0] || null,
          foundation_profile: project.users?.profiles?.[0] || null,
          user_application: userApplication || null,
        }
      })

      setProjects(projectsWithApplications || [])
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
          projects!inner(
            title,
            sport,
            location,
            foundation_id,
            users!projects_foundation_id_fkey(
              foundation_info(organization_name)
            )
          )
        `)
        .eq("coach_id", userProfile.id)
        .order("applied_at", { ascending: false })

      if (error) throw error

      const formattedApplications =
        data?.map((app: any) => ({
          ...app,
          project: {
            ...app.projects,
            foundation_info: app.projects.users?.foundation_info?.[0] || null,
          },
        })) || []

      setApplications(formattedApplications)
    } catch (error) {
      console.error("Error fetching applications:", error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleApplyToProject = async () => {
    if (!userProfile || !selectedProject) return

    setSubmittingApplication(true)
    try {
      const { error } = await supabase.from("applications").insert({
        project_id: selectedProject.id,
        coach_id: userProfile.id,
        message: applicationMessage || null,
        status: "pending",
      })

      if (error) throw error

      setApplicationMessage("")
      setShowApplicationDialog(false)
      setSelectedProject(null)
      fetchProjects()
      fetchApplications()
    } catch (error) {
      console.error("Error submitting application:", error)
      alert("Error submitting application. Please try again.")
    } finally {
      setSubmittingApplication(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  const handleStartChat = (application: Application) => {
    console.log("[v0] Starting chat with application:", application)
    setSelectedChatApplication(application)
    setShowChat(true)
  }

  const handleInboxChat = (conversation: any) => {
    const chatApplication: Application = {
      id: conversation.application_id,
      project_id: "",
      status: "accepted",
      message: null,
      applied_at: "",
      updated_at: "",
      project: {
        title: conversation.project_title,
        sport: "",
        location: "",
        foundation_id: conversation.other_user_id,
        foundation_info: {
          organization_name: conversation.other_user_name || "Organization",
        },
      },
    }
    setSelectedChatApplication(chatApplication)
    setShowChat(true)
    setShowInbox(false)
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
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

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.foundation_info?.organization_name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesSport = sportFilter === "all" || project.sport === sportFilter
    const matchesLocation = !locationFilter || project.location.toLowerCase().includes(locationFilter.toLowerCase())

    return matchesSearch && matchesSport && matchesLocation
  })

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
              <p className="text-sm text-gray-600">
                {userProfile.profile.first_name} {userProfile.profile.last_name}
              </p>
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
                  <p className="text-sm text-gray-600">Available Projects</p>
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
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{applications.filter((a) => a.status === "accepted").length}</p>
                  <p className="text-sm text-gray-600">Accepted Applications</p>
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
                  <p className="text-2xl font-bold">{applications.length}</p>
                  <p className="text-sm text-gray-600">Total Applications</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-full">
          {/* Tabs */}
          <Tabs defaultValue="browse" className="space-y-6">
            <TabsList>
              <TabsTrigger value="browse">Browse Projects</TabsTrigger>
              <TabsTrigger value="applications">My Applications</TabsTrigger>
            </TabsList>

            {/* Browse Projects Tab */}
            <TabsContent value="browse" className="space-y-6">
              {/* Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Find Volunteer Opportunities</CardTitle>
                  <CardDescription>Search and filter projects that match your skills and interests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="search">Search</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="search"
                          placeholder="Search projects..."
                          className="pl-10"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sport">Sport</Label>
                      <Select value={sportFilter} onValueChange={setSportFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All sports" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All sports</SelectItem>
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
                        placeholder="Filter by location..."
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>&nbsp;</Label>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchTerm("")
                          setSportFilter("all")
                          setLocationFilter("")
                        }}
                        className="w-full"
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        Clear Filters
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Projects Grid */}
              <div className="grid gap-6">
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((project) => (
                    <Card key={project.id} className={project.user_application ? "border-blue-200 bg-blue-50/30" : ""}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-xl">{project.title}</CardTitle>
                            <CardDescription className="flex items-center gap-4 mt-2">
                              <span className="flex items-center gap-1">
                                <Building className="h-4 w-4" />
                                {project.foundation_info?.organization_name}
                              </span>
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
                          {project.user_application && (
                            <Badge className={getStatusColor(project.user_application.status)}>
                              {project.user_application.status}
                            </Badge>
                          )}
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
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600">
                            <span>Max volunteers: {project.max_volunteers}</span>
                            <span className="ml-4">Posted: {formatDate(project.created_at)}</span>
                          </div>
                          {!project.user_application ? (
                            <Dialog
                              open={showApplicationDialog && selectedProject?.id === project.id}
                              onOpenChange={(open) => {
                                setShowApplicationDialog(open)
                                if (!open) {
                                  setSelectedProject(null)
                                  setApplicationMessage("")
                                }
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  onClick={() => {
                                    setSelectedProject(project)
                                    setShowApplicationDialog(true)
                                  }}
                                >
                                  <Send className="h-4 w-4 mr-2" />
                                  Apply Now
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Apply to Project</DialogTitle>
                                  <DialogDescription>
                                    Send your application to {project.foundation_info?.organization_name}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="p-4 bg-gray-50 rounded-lg">
                                    <h4 className="font-semibold text-gray-900 mb-2">{project.title}</h4>
                                    <p className="text-sm text-gray-600">
                                      {project.sport} • {project.location}
                                    </p>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="message">Application Message (optional)</Label>
                                    <Textarea
                                      id="message"
                                      placeholder="Tell the organization why you're interested and what you can bring to this project..."
                                      rows={4}
                                      value={applicationMessage}
                                      onChange={(e) => setApplicationMessage(e.target.value)}
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={handleApplyToProject}
                                      disabled={submittingApplication}
                                      className="flex-1"
                                    >
                                      {submittingApplication ? "Submitting..." : "Submit Application"}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setShowApplicationDialog(false)
                                        setSelectedProject(null)
                                        setApplicationMessage("")
                                      }}
                                      disabled={submittingApplication}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">
                                Applied {formatDate(project.user_application.applied_at)}
                              </span>
                              {project.user_application.status === "accepted" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const chatApplication: Application = {
                                      id: project.user_application.id,
                                      project_id: project.id,
                                      status: project.user_application.status,
                                      message: project.user_application.message,
                                      applied_at: project.user_application.applied_at,
                                      updated_at: project.user_application.applied_at,
                                      project: {
                                        title: project.title,
                                        sport: project.sport,
                                        location: project.location,
                                        foundation_info: project.foundation_info,
                                        foundation_id: project.users?.id || "",
                                      },
                                    }
                                    handleStartChat(chatApplication)
                                  }}
                                >
                                  <MessageCircle className="h-4 w-4 mr-2" />
                                  Message
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects found</h3>
                      <p className="text-gray-600">Try adjusting your search filters to find more opportunities</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Applications Tab */}
            <TabsContent value="applications" className="space-y-6">
              <h2 className="text-2xl font-bold">My Applications</h2>
              <div className="grid gap-6">
                {applications.length > 0 ? (
                  applications.map((application) => (
                    <Card key={application.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{application.project?.title}</CardTitle>
                            <CardDescription className="flex items-center gap-4 mt-2">
                              <span className="flex items-center gap-1">
                                <Building className="h-4 w-4" />
                                {application.project?.foundation_info?.organization_name}
                              </span>
                              <span className="flex items-center gap-1">
                                <Trophy className="h-4 w-4" />
                                {application.project?.sport}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {application.project?.location}
                              </span>
                            </CardDescription>
                          </div>
                          <Badge className={getStatusColor(application.status)}>{application.status}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {application.message && (
                          <div className="mb-4">
                            <p className="text-sm font-semibold text-gray-900 mb-2">Your Application Message:</p>
                            <p className="text-gray-700">{application.message}</p>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>Applied: {formatDate(application.applied_at)}</span>
                          {application.status === "accepted" && (
                            <Button size="sm" variant="outline" onClick={() => handleStartChat(application)}>
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Message Foundation
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No applications yet</h3>
                      <p className="text-gray-600 mb-4">
                        Start browsing projects to find volunteer opportunities that match your skills
                      </p>
                      <Button onClick={() => document.querySelector('[value="browse"]')?.click()}>
                        Browse Projects
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

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
              <InboxSection currentUser={userProfile} userType="coach" onStartChat={handleInboxChat} />
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
              id:
                projects.find((p) => p.id === selectedChatApplication.project_id)?.users?.id ||
                selectedChatApplication.project?.foundation_id ||
                "",
              name: selectedChatApplication.project?.foundation_info?.organization_name || "Foundation",
              avatar_url: undefined,
            }}
            projectTitle={selectedChatApplication.project?.title || "Project Discussion"}
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
