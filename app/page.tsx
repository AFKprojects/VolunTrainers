import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Trophy, Heart, ArrowRight } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">VolunTrainers</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Connecting Volunteer Sports Coaches
            <br />
            <span className="text-blue-600">with Non-Profit Organizations</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Bridge the gap between passionate sports coaches and organizations that need them. Create lasting impact in
            your community through the power of sports.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/signup?role=coach">
                Join as Coach <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/signup?role=foundation">
                Join as Foundation <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card className="border-2 border-blue-100 hover:border-blue-200 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <CardTitle className="text-xl">For Coaches</CardTitle>
                  <CardDescription>Share your expertise and make a difference</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-600">
                <li>• Find meaningful volunteer opportunities</li>
                <li>• Connect with local non-profit organizations</li>
                <li>• Build your coaching portfolio</li>
                <li>• Make a lasting impact in your community</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-100 hover:border-green-200 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Heart className="h-8 w-8 text-green-600" />
                <div>
                  <CardTitle className="text-xl">For Foundations</CardTitle>
                  <CardDescription>Access qualified volunteer coaches</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-600">
                <li>• Post volunteer coaching opportunities</li>
                <li>• Review coach applications and profiles</li>
                <li>• Manage multiple sports programs</li>
                <li>• Build lasting partnerships with coaches</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-lg p-8 shadow-sm border">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">500+</div>
              <div className="text-gray-600">Active Coaches</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">150+</div>
              <div className="text-gray-600">Partner Organizations</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">10,000+</div>
              <div className="text-gray-600">Youth Impacted</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
