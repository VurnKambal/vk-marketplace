'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { Listing } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { Send, MessageCircle, Sparkles, Lock } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface MessageSellerProps {
  listing: Listing;
}

export function MessageSeller({ listing }: MessageSellerProps) {
  const [message, setMessage] = useState("Hey! I'm interested in your item. Is it still available? 😊");
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
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

    try {
      setLoading(true);
      
      // Insert message into database with read: false by default
      const { error } = await supabase
        .from('messages')
        .insert([
          {
            listing_id: listing.id,
            buyer_email: user.email,
            seller_email: listing.seller.email,
            buyer_id: user.id,
            message: message.trim(),
            read: false // Ensure messages start as unread
          }
        ]);

      if (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message. Please try again.');
        return;
      }

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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl font-semibold py-3">
          <MessageCircle className="w-5 h-5 mr-2" />
          Message Seller
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            <span>Send Message</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-3">
              Send a message about: <span className="font-semibold">{listing.title}</span>
            </p>
            
            {/* Quick message buttons */}
            <div className="grid grid-cols-1 gap-2 mb-4">
              {quickMessages.map((quickMsg, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setMessage(quickMsg)}
                  className="text-left justify-start h-auto py-2 px-3 hover:bg-blue-50 hover:border-blue-300 transition-colors text-sm"
                >
                  {quickMsg}
                </Button>
              ))}
            </div>
            
            <Textarea
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[100px] resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendMessage} 
              disabled={loading || !message.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
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