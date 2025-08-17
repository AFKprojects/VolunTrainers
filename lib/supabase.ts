import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://ppznkliwivlsrqvwhtij.supabase.co" // Updated with actual project ID
const supabaseAnonKey = "sb_publishable_Mi95oGgSpYNRhqn_i0rU9Q_x5yZOR3w" // Using provided key

console.log("[v0] Supabase URL:", supabaseUrl)
console.log("[v0] Supabase Key available:", !!supabaseAnonKey)

if (!supabaseUrl || supabaseUrl.includes("your-project-id")) {
  throw new Error(
    "Please replace 'your-project-id' in lib/supabase.ts with your actual Supabase project URL (e.g., https://abcdefgh.supabase.co)",
  )
}

if (!supabaseAnonKey) {
  throw new Error("Missing Supabase Anon Key. Please add your anon key to lib/supabase.ts")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          password_hash: string
          role: "coach" | "foundation"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          password_hash: string
          role: "coach" | "foundation"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          password_hash?: string
          role?: "coach" | "foundation"
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          first_name: string
          last_name: string
          phone: string | null
          location: string | null
          bio: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          first_name: string
          last_name: string
          phone?: string | null
          location?: string | null
          bio?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string
          last_name?: string
          phone?: string | null
          location?: string | null
          bio?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          foundation_id: string
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
          updated_at: string
        }
        Insert: {
          id?: string
          foundation_id: string
          title: string
          description: string
          sport: string
          location: string
          start_date?: string | null
          end_date?: string | null
          required_skills?: string[] | null
          max_volunteers?: number | null
          status?: "open" | "closed" | "completed"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          foundation_id?: string
          title?: string
          description?: string
          sport?: string
          location?: string
          start_date?: string | null
          end_date?: string | null
          required_skills?: string[] | null
          max_volunteers?: number | null
          status?: "open" | "closed" | "completed"
          created_at?: string
          updated_at?: string
        }
      }
      applications: {
        Row: {
          id: string
          project_id: string
          coach_id: string
          status: "pending" | "accepted" | "rejected"
          message: string | null
          applied_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          coach_id: string
          status?: "pending" | "accepted" | "rejected"
          message?: string | null
          applied_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          coach_id?: string
          status?: "pending" | "accepted" | "rejected"
          message?: string | null
          applied_at?: string
          updated_at?: string
        }
      }
    }
  }
}
