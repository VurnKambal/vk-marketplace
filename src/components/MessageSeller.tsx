'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { Listing } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { sendMessage } from "@/lib/api";
import { Send, MessageCircle, User, Lock } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface MessageSellerProps {
  listing: Listing;
}

export function MessageSeller({ listing }: MessageSellerProps) {
  const [message, setMessage] = useState("Hey! I'm interested in your item. Is it still available? 😊");
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Check if current user is the seller
  const isOwnListing = user?.email === listing.seller.email;

  const handleSendMessage = async () => {
    if (!user) {
      alert('Please sign in to send messages');
      return;
    }

    if (isOwnListing) {
      alert("You can't message yourself on your own listing");
      return;
    }

    if (!message.trim()) {
      alert('Please enter a message');
      return;
    }

    try {
      setLoading(true);
      
      await sendMessage(listing.id, listing.seller.email, message.trim());

      alert('Message sent successfully! The seller will be notified.');
      setIsOpen(false);
      setMessage("Hey! I'm interested in your item. Is it still available? 😊");
      
      // Trigger a custom event to update notifications
      window.dispatchEvent(new CustomEvent('messagesChanged'));
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const quickMessages = [
    "Is this still available? 🙋‍♀️",
    "Can you tell me more about the condition? 🔍",
    "Would you consider a lower price? 💰",
    "When would be a good time to meet? ⏰"
  ];

  // Don't show message button if user is the seller
  if (isOwnListing) {
    return null;
  }

  // Get the first image URL safely - now using the correct property
  const listingImage = listing.images && listing.images.length > 0 
    ? listing.images[0] 
    : '/placeholder.jpg';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl font-semibold py-3">
          <MessageCircle className="w-5 h-5 mr-2" />
          Message Seller
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
        <DialogHeader className="bg-gradient-to-r from-blue-50 to-purple-50 -m-6 p-6 rounded-t-lg border-b">
          <DialogTitle className="flex items-center space-x-2 text-gray-900">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">Send Message</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 p-6 -m-6 mt-0">
          <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <img
              src={listingImage}
              alt={listing.title}
              className="w-12 h-12 object-cover rounded-lg shadow-md"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.jpg';
              }}
            />
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-sm">{listing.title}</p>
              <p className="text-blue-600 font-semibold">${listing.price}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
              <User className="w-3 h-3 text-white" />
            </div>
            <span>Messaging: {listing.seller.name}</span>
          </div>
          
          <div>
            {/* Quick message buttons */}
            <div className="grid grid-cols-1 gap-2 mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Quick messages:</p>
              {quickMessages.map((quickMsg, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setMessage(quickMsg)}
                  className="text-left justify-start h-auto py-2 px-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:border-blue-300 transition-all duration-200 text-sm border-gray-200"
                >
                  {quickMsg}
                </Button>
              ))}
            </div>
            
            <Textarea
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[100px] resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg bg-white/80"
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={loading}
              className="border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendMessage} 
              disabled={loading || !message.trim()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Sending...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Send className="w-4 h-4" />
                  <span>Send Message</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}