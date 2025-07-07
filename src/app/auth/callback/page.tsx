'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error during auth callback:', error);
        router.push('/');
        return;
      }

      if (data.session) {
        // Create or update user profile
        const { user } = data.session;
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata.full_name || user.email?.split('@')[0],
            avatar_url: user.user_metadata.avatar_url,
            updated_at: new Date().toISOString()
          });

        if (profileError) {
          console.error('Error creating/updating profile:', profileError);
        }
        
        router.push('/');
      } else {
        router.push('/');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Completing sign in...</p>
      </div>
    </div>
  );
}