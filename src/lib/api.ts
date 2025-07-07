import { supabase, DatabaseListing, ListingFormData, Favorite } from './supabase'
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
  // Get the authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User must be logged in to create a listing')
  }

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
        image_urls: formData.image_urls,
        user_id: user.id  // Add the authenticated user's ID
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

// Favorites functionality
export async function addToFavorites(listingId: string): Promise<Favorite | null> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User must be logged in to add favorites')
  }

  const { data, error } = await supabase
    .from('favorites')
    .insert([{
      user_id: user.id,
      listing_id: listingId
    }])
    .select()
    .single()

  if (error) {
    console.error('Error adding to favorites:', error)
    throw new Error('Failed to add to favorites')
  }

  return data
}

export async function removeFromFavorites(listingId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User must be logged in to remove favorites')
  }

  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('listing_id', listingId)

  if (error) {
    console.error('Error removing from favorites:', error)
    throw new Error('Failed to remove from favorites')
  }
}

export async function getUserFavorites(): Promise<DatabaseListing[]> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  try {
    // First, get the favorite listing IDs for the user
    const { data: favoriteIds, error: favError } = await supabase
      .from('favorites')
      .select('listing_id')
      .eq('user_id', user.id)

    if (favError) {
      console.error('Error fetching favorite IDs:', favError)
      return []
    }

    if (!favoriteIds || favoriteIds.length === 0) {
      return []
    }

    // Then fetch the actual listings
    const listingIds = favoriteIds.map(fav => fav.listing_id)
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('*')
      .in('id', listingIds)

    if (listingsError) {
      console.error('Error fetching favorite listings:', listingsError)
      return []
    }

    return listings || []
  } catch (error) {
    console.error('Error in getUserFavorites:', error)
    return []
  }
}

export async function isListingFavorited(listingId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return false
  }

  const { data, error } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('listing_id', listingId)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
    console.error('Error checking if listing is favorited:', error)
    return false
  }

  return !!data
}

// Get user's listings
export async function getUserListings(): Promise<DatabaseListing[]> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user listings:', error)
    throw new Error('Failed to fetch user listings')
  }

  return data || []
}

// Message-related API functions
export async function getUserMessages(): Promise<any[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        listing:listings(
          id,
          title,
          price,
          image_urls
        )
      `)
      .or(`buyer_email.eq.${user.email},seller_email.eq.${user.email}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting user messages:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting user messages:', error);
    return [];
  }
}

export async function getMessagesForListing(listingId: string): Promise<any[]> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User must be logged in')
  }

  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('listing_id', listingId)
      .or(`buyer_email.eq.${user.email},seller_email.eq.${user.email}`)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching listing messages:', error)
      return []
    }

    return messages || []
  } catch (error) {
    console.error('Error in getMessagesForListing:', error)
    return []
  }
}

export async function markMessagesAsRead(messageIds: string[]): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || messageIds.length === 0) return;

    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .in('id', messageIds)
      .or(`buyer_email.eq.${user.email},seller_email.eq.${user.email}`)

    if (error) {
      console.error('Error marking messages as read:', error)
      throw error
    }
  } catch (error) {
    console.error('Error marking messages as read:', error)
    throw error
  }
}

export async function sendMessage(
  listingId: string, 
  recipientEmail: string, 
  message: string
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get listing details to determine buyer/seller roles
    const { data: listing } = await supabase
      .from('listings')
      .select('seller_email, user_id')
      .eq('id', listingId)
      .single();

    if (!listing) throw new Error('Listing not found');

    // Determine if current user is the seller
    const isCurrentUserSeller = user.email === listing.seller_email || user.id === listing.user_id;
    
    // Set buyer and seller emails based on who is sending the message
    const buyerEmail = isCurrentUserSeller ? recipientEmail : user.email;
    const sellerEmail = isCurrentUserSeller ? user.email : recipientEmail;
    const buyerId = isCurrentUserSeller ? null : user.id;

    const { error } = await supabase
      .from('messages')
      .insert([
        {
          listing_id: listingId,
          buyer_email: buyerEmail,
          seller_email: sellerEmail,
          buyer_id: buyerId,
          message: message.trim(),
          read: false
        }
      ]);

    if (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

export async function getConversationMessages(
  listingId: string, 
  otherPartyEmail: string
): Promise<any[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        listing:listings(
          id,
          title,
          price,
          image_urls,
          seller_email
        )
      `)
      .eq('listing_id', listingId)
      .or(`and(buyer_email.eq.${user.email},seller_email.eq.${otherPartyEmail}),and(buyer_email.eq.${otherPartyEmail},seller_email.eq.${user.email})`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error getting conversation messages:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting conversation messages:', error);
    return [];
  }
}

export async function getUnreadMessageCount(): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(buyer_email.eq.${user.email},seller_email.neq.${user.email}),and(seller_email.eq.${user.email},buyer_email.neq.${user.email})`)
      .eq('read', false);

    if (error) {
      console.error('Error getting unread message count:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error('Error getting unread message count:', error);
    return 0;
  }
}