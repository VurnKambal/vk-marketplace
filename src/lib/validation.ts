import { z } from 'zod'

export const listingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title too long'),
  price: z.number().min(0.01, 'Price must be greater than 0').max(999999, 'Price too high'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description too long'),
  location: z.string().min(2, 'Location is required').max(100, 'Location too long'),
  seller_name: z.string().min(2, 'Name is required').max(50, 'Name too long'),
  seller_email: z.string().email('Invalid email address'),
  category: z.string().min(1, 'Category is required'),
  images: z.any().optional()
})