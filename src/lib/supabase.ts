import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// Database types
export interface DatabaseListing {
  id: string
  title: string
  price: number
  description: string
  location: string
  seller_name: string
  seller_email: string
  category: string
  image_urls: string[]
  created_at: string
  updated_at: string
  user_id?: string
}

// User profile type
export interface UserProfile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

// Favorites type
export interface Favorite {
  id: string
  user_id: string
  listing_id: string
  created_at: string
}

// Form types for validation
export interface ListingFormData {
  title: string
  price: number
  description: string
  location: string
  seller_name: string
  seller_email: string
  category: string
  images: FileList | null
}

// Auth helpers
export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  return { session, error }
}