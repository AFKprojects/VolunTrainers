import { CoachProfilePage } from "@/components/profile/coach-profile-page"

interface PageProps {
  params: {
    id: string
  }
}

export default function CoachProfile({ params }: PageProps) {
  return <CoachProfilePage coachId={params.id} />
}
