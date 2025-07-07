import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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