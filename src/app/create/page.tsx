'use client';

import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CATEGORIES } from "@/lib/types";
import { createListing, uploadImages } from "@/lib/api";
import { listingSchema } from "@/lib/validation";
import { supabase, signInWithGoogle } from "@/lib/supabase";
import { ArrowLeft, Camera, X, Loader2, LogIn } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

type FormData = z.infer<typeof listingSchema>;

// Google Logo SVG Component following Google's brand guidelines
const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" width="20" height="20">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

export default function CreateListingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      price: 0
    }
  });

  // Check authentication and pre-fill user data
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      // Pre-fill form with user data if available
      if (session?.user) {
        const userData = session.user.user_metadata;
        if (userData?.full_name) {
          setValue('seller_name', userData.full_name);
        }
        if (session.user.email) {
          setValue('seller_email', session.user.email);
        }
      }
      
      setAuthLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const userData = session.user.user_metadata;
          if (userData?.full_name) {
            setValue('seller_name', userData.full_name);
          }
          if (session.user.email) {
            setValue('seller_email', session.user.email);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [setValue]);

  const handleSignIn = async () => {
    try {
      setAuthLoading(true);
      await signInWithGoogle();
    } catch (error) {
      console.error('Error signing in:', error);
      setSubmitError('Failed to sign in. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedImages.length > 10) {
      alert('You can only upload up to 10 images');
      return;
    }
    setSelectedImages(prev => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    if (!user) {
      setSubmitError('You must be signed in to create a listing.');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Upload images first
      let imageUrls: string[] = [];
      if (selectedImages.length > 0) {
        const fileList = new DataTransfer();
        selectedImages.forEach(file => fileList.items.add(file));
        imageUrls = await uploadImages(fileList.files);
      }

      // Create listing
      const listing = await createListing({
        title: data.title,
        price: data.price,
        description: data.description,
        location: data.location,
        seller_name: data.seller_name,
        seller_email: data.seller_email,
        category: data.category,
        image_urls: imageUrls
      });

      // Redirect to the new listing
      router.push(`/item/${listing.id}`);
    } catch (error) {
      console.error('Error creating listing:', error);
      setSubmitError('Failed to create listing. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show sign-in prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header />
        
        <div className="max-w-4xl mx-auto p-8">
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-200 to-purple-300 rounded-full flex items-center justify-center mx-auto mb-6">
              <LogIn className="w-12 h-12 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Sign in to create a listing</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              You need to sign in with your Google account to create and manage listings on the marketplace.
            </p>
            <div className="space-y-4">
              <div className="flex justify-center">
                <Button 
                  onClick={handleSignIn}
                  disabled={authLoading}
                  className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg px-6 py-3 font-medium text-base transition-all duration-200 hover:shadow-md shadow-sm flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed btn-ripple hover:scale-105 btn-bounce"
                >
                  {authLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <GoogleIcon className="shrink-0" />
                      <span>Sign in with Google</span>
                    </>
                  )}
                </Button>
              </div>
              <div className="text-center">
                <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
                  ← Back to Marketplace
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      
      <div className="max-w-4xl mx-auto p-8 relative">
        {/* Floating background elements */}
        <div className="absolute top-10 right-10 w-20 h-20 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-full animate-float"></div>
        <div className="absolute bottom-20 left-10 w-16 h-16 bg-gradient-to-br from-green-400/20 to-teal-500/20 rounded-full animate-float-delayed"></div>

        {/* Back Button */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 group transition-all duration-300">
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
            <span className="font-medium">Back to Marketplace</span>
          </Link>
        </div>

        <Card className="border-0 shadow-2xl rounded-3xl bg-white/80 backdrop-blur-sm relative overflow-hidden">
          {/* Decorative header gradient */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
          
          <CardHeader className="text-center py-8">
            <CardTitle className="text-3xl font-bold gradient-text">Create Your Listing</CardTitle>
            <p className="text-gray-600 text-lg">Turn your items into cash! 💰</p>
          </CardHeader>
          
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Photos Section */}
              <div className="space-y-4">
                <label className="block text-lg font-semibold text-gray-800">
                  📸 Add Photos
                </label>
                <div className="border-2 border-dashed border-blue-300 rounded-3xl p-8 text-center hover:border-purple-400 transition-all duration-300 bg-gradient-to-br from-blue-50/50 to-purple-50/50 group hover:shadow-lg">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer block">
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <Camera className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <p className="text-gray-700 mb-2 text-lg font-medium">Click to add photos</p>
                    <p className="text-gray-500 text-sm">Up to 10 images • JPG, PNG</p>
                  </label>
                </div>

                {/* Selected Images Preview */}
                {selectedImages.length > 0 && (
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                    {selectedImages.map((file, index) => (
                      <div key={index} className="relative group">
                        <Image
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          width={100}
                          height={100}
                          className="w-full h-24 object-cover rounded-xl shadow-md"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Title */}
                <div className="space-y-3">
                  <label htmlFor="title" className="block text-lg font-semibold text-gray-800">
                    📝 What are you selling? *
                  </label>
                  <Input
                    {...register('title')}
                    placeholder="e.g., iPhone 14, Textbook, Bike..."
                    className="rounded-2xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 py-4 text-lg transition-all duration-300 hover:shadow-md focus:shadow-lg"
                  />
                  {errors.title && (
                    <p className="text-red-500 text-sm font-medium">{errors.title.message}</p>
                  )}
                </div>

                {/* Price */}
                <div className="space-y-3">
                  <label htmlFor="price" className="block text-lg font-semibold text-gray-800">
                    💰 Price *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-xl font-bold">$</span>
                    <Input
                      {...register('price', { valueAsNumber: true })}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="pl-10 rounded-2xl border-gray-200 focus:border-green-500 focus:ring-green-500 py-4 text-lg font-semibold transition-all duration-300 hover:shadow-md focus:shadow-lg"
                    />
                  </div>
                  {errors.price && (
                    <p className="text-red-500 text-sm font-medium">{errors.price.message}</p>
                  )}
                </div>
              </div>

              {/* Category */}
              <div className="space-y-3">
                <label htmlFor="category" className="block text-lg font-semibold text-gray-800">
                  🏷️ Category *
                </label>
                <select
                  {...register('category')}
                  className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg transition-all duration-300 hover:shadow-md focus:shadow-lg bg-white"
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-red-500 text-sm font-medium">{errors.category.message}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-3">
                <label htmlFor="description" className="block text-lg font-semibold text-gray-800">
                  📋 Description *
                </label>
                <Textarea
                  {...register('description')}
                  placeholder="Describe your item's condition, features, and why someone should buy it..."
                  className="min-h-[140px] resize-none rounded-2xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-lg transition-all duration-300 hover:shadow-md focus:shadow-lg"
                />
                {errors.description && (
                  <p className="text-red-500 text-sm font-medium">{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Seller Name */}
                <div className="space-y-3">
                  <label htmlFor="seller_name" className="block text-lg font-semibold text-gray-800">
                    👤 Your Name *
                  </label>
                  <Input
                    {...register('seller_name')}
                    placeholder="Your full name"
                    className="rounded-2xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 py-4 text-lg transition-all duration-300 hover:shadow-md focus:shadow-lg"
                  />
                  {errors.seller_name && (
                    <p className="text-red-500 text-sm font-medium">{errors.seller_name.message}</p>
                  )}
                </div>

                {/* Contact Email */}
                <div className="space-y-3">
                  <label htmlFor="seller_email" className="block text-lg font-semibold text-gray-800">
                    📧 Contact Email *
                  </label>
                  <Input
                    {...register('seller_email')}
                    type="email"
                    placeholder="your.email@university.edu"
                    className="rounded-2xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 py-4 text-lg transition-all duration-300 hover:shadow-md focus:shadow-lg"
                  />
                  {errors.seller_email && (
                    <p className="text-red-500 text-sm font-medium">{errors.seller_email.message}</p>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="space-y-3">
                <label htmlFor="location" className="block text-lg font-semibold text-gray-800">
                  📍 Location *
                </label>
                <Input
                  {...register('location')}
                  placeholder="City, State"
                  className="rounded-2xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 py-4 text-lg transition-all duration-300 hover:shadow-md focus:shadow-lg"
                />
                {errors.location && (
                  <p className="text-red-500 text-sm font-medium">{errors.location.message}</p>
                )}
              </div>

              {/* Error Message */}
              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                  <p className="text-red-600 font-medium">{submitError}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-8">
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !user}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-2xl py-6 text-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                      Creating Listing...
                    </>
                  ) : (
                    '🚀 Publish Listing'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}