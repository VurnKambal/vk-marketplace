import { createClient } from '@supabase/supabase-js'
import { logError } from './logger'

// More flexible environment validation that doesn't throw immediately
const validateEnvironment = () => {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    console.warn(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
    return false;
  }
  return true;
};

// Only validate in browser or when actually needed
const isValidEnvironment = typeof window !== 'undefined' ? validateEnvironment() : true;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create client with fallback for development
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    },
    global: {
      headers: {
        'X-Client-Info': 'vk-marketplace-web'
      }
    }
  }
)

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

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
};

// Auth helpers with better error handling
export const signInWithGoogle = async () => {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error('Supabase not configured') };
  }

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback`
      }
    })
    
    if (error) {
      logError(error, 'Google Sign In')
    }
    
    return { data, error }
  } catch (error) {
    logError(error as Error, 'Google Sign In Exception')
    return { data: null, error: error as Error }
  }
}

export const signOut = async () => {
  if (!isSupabaseConfigured()) {
    return { error: new Error('Supabase not configured') };
  }

  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      logError(error, 'Sign Out')
    }
    
    return { error }
  } catch (error) {
    logError(error as Error, 'Sign Out Exception')
    return { error: error as Error }
  }
}

export const getCurrentUser = async () => {
  if (!isSupabaseConfigured()) {
    return { user: null, error: new Error('Supabase not configured') };
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      logError(error, 'Get Current User')
    }
    
    return { user, error }
  } catch (error) {
    logError(error as Error, 'Get Current User Exception')
    return { user: null, error: error as Error }
  }
}

export const getSession = async () => {
  if (!isSupabaseConfigured()) {
    return { session: null, error: new Error('Supabase not configured') };
  }

  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      logError(error, 'Get Session')
    }
    
    return { session, error }
  } catch (error) {
    logError(error as Error, 'Get Session Exception')
    return { session: null, error: error as Error }
  }
}