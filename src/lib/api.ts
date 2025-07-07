import { supabase, DatabaseListing, ListingFormData } from './supabase'
import { v4 as uuidv4 } from 'uuid'

// Upload images to Supabase Storage
export async function uploadImages(files: FileList): Promise<string[]> {
  const imageUrls: string[] = []
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const fileExt = file.name.split('.').pop()
    const fileName = `${uuidv4()}.${fileExt}`
    const filePath = `listings/${fileName}`

    const { error } = await supabase.storage
      .from('marketplace-images')
      .upload(filePath, file)

    if (error) {
      console.error('Error uploading image:', error)
      throw new Error('Failed to upload image')
    }

    const { data: { publicUrl } } = supabase.storage
      .from('marketplace-images')
      .getPublicUrl(filePath)

    imageUrls.push(publicUrl)
  }

  return imageUrls
}

// Create a new listing
export async function createListing(formData: Omit<ListingFormData, 'images'> & { image_urls: string[] }): Promise<DatabaseListing> {
  const { data, error } = await supabase
    .from('listings')
    .insert([
      {
        title: formData.title,
        price: formData.price,
        description: formData.description,
        location: formData.location,
        seller_name: formData.seller_name,
        seller_email: formData.seller_email,
        category: formData.category,
        image_urls: formData.image_urls
      }
    ])
    .select()
    .single()

  if (error) {
    console.error('Error creating listing:', error)
    throw new Error('Failed to create listing')
  }

  return data
}

// Get all listings with optional filtering
export async function getListings(options?: {
  category?: string
  search?: string
  limit?: number
}): Promise<DatabaseListing[]> {
  let query = supabase
    .from('listings')
    .select('*')
    .order('created_at', { ascending: false })

  if (options?.category) {
    query = query.eq('category', options.category)
  }

  if (options?.search) {
    query = query.or(`title.ilike.%${options.search}%, description.ilike.%${options.search}%`)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching listings:', error)
    throw new Error('Failed to fetch listings')
  }

  return data || []
}

// Get a single listing by ID
export async function getListing(id: string): Promise<DatabaseListing | null> {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching listing:', error)
    return null
  }

  return data
}