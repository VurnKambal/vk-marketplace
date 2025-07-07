'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Listing } from "@/lib/types";
import { Send, MessageCircle, Sparkles } from "lucide-react";

interface MessageSellerProps {
  listing: Listing;
}

export function MessageSeller({ listing }: MessageSellerProps) {
  const [message, setMessage] = useState("Hey! I'm interested in your item. Is it still available? 😊");
  const [isOpen, setIsOpen] = useState(false);

  const handleSendMessage = () => {
    // Handle message sending logic here
    console.log(`Sending message to ${listing.seller.name}: ${message}`);
    setIsOpen(false);
  };

  const quickMessages = [
    "Is this still available? 🙋‍♀️",
    "Can you tell me more about the condition? 🔍",
    "Would you consider a lower price? 💰",
    "When would be a good time to meet? ⏰"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 py-4 text-lg font-semibold group">
          <MessageCircle className="w-5 h-5 mr-2 group-hover:animate-bounce" />
          Send seller a message
          <Sparkles className="w-4 h-4 ml-2 group-hover:animate-spin" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-gradient-to-br from-white to-blue-50 border-0 shadow-2xl rounded-3xl">
        <DialogHeader className="text-center pb-4">
          <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center justify-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <span>Message {listing.seller.name}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Seller info card */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-100">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">
                  {listing.seller.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-semibold text-gray-800">{listing.seller.name}</p>
                <p className="text-sm text-gray-600">Usually responds within 1 hour</p>
              </div>
            </div>
          </div>

          {/* Quick message suggestions */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Quick messages:</p>
            <div className="grid grid-cols-1 gap-2">
              {quickMessages.map((quickMsg, index) => (
                <button
                  key={index}
                  onClick={() => setMessage(quickMsg)}
                  className="text-left p-3 bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 border border-gray-200 hover:border-blue-300 rounded-xl transition-all duration-200 text-sm hover:shadow-md transform hover:scale-[1.02]"
                >
                  {quickMsg}
                </button>
              ))}
            </div>
          </div>

          {/* Message input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Your message:</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              className="min-h-[120px] resize-none border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-2xl bg-white/80 backdrop-blur-sm transition-all duration-300 focus:shadow-lg"
            />
          </div>

          {/* Send button */}
          <Button 
            onClick={handleSendMessage} 
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-2xl py-4 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 group"
          >
            <Send className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform duration-200" />
            Send Message
          </Button>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-4 right-4 opacity-20">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full animate-pulse"></div>
        </div>
        <div className="absolute bottom-4 left-4 opacity-10">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-yellow-500 rounded-full animate-bounce"></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}