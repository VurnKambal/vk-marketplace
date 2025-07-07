'use client';

import { Header } from "@/components/Header";
import { useState, useEffect } from "react";
import { getUserMessages, markMessagesAsRead } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { MessageCircle, Clock, User, Package, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface Message {
  id: string;
  listing_id: string;
  buyer_email: string;
  seller_email: string;
  buyer_id: string;
  message: string;
  read: boolean;
  created_at: string;
  listing?: {
    id: string;
    title: string;
    price: number;
    image_urls?: string[];
  };
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await loadMessages();
      } else {
        setLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          loadMessages();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const userMessages = await getUserMessages();
      setMessages(userMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (messageIds: string[]) => {
    try {
      await markMessagesAsRead(messageIds);
      // Update local state
      setMessages(prev => prev.map(msg => 
        messageIds.includes(msg.id) ? { ...msg, read: true } : msg
      ));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Group messages by listing and conversation
  const groupedMessages = messages.reduce((acc, message) => {
    const key = `${message.listing_id}-${message.buyer_email}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(message);
    return acc;
  }, {} as Record<string, Message[]>);

  const conversations = Object.entries(groupedMessages).map(([key, msgs]) => {
    const latestMessage = msgs[0]; // Messages are sorted by created_at desc
    const unreadCount = msgs.filter(m => !m.read && m.seller_email === user?.email).length;
    return {
      key,
      messages: msgs,
      latestMessage,
      unreadCount,
      listing: latestMessage.listing,
      otherParty: latestMessage.buyer_email === user?.email 
        ? latestMessage.seller_email 
        : latestMessage.buyer_email
    };
  });

  if (!user && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header />
        <div className="max-w-4xl mx-auto p-4 sm:p-8">
          <div className="text-center py-16">
            <MessageCircle className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-6 text-gray-400" />
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Sign in to view messages</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Access your conversations with buyers and sellers by signing in to your account.
            </p>
            <Button onClick={() => window.location.reload()}>
              Sign In with Google
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      
      <div className="max-w-7xl mx-auto p-4 sm:p-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Messages</h1>
              <p className="text-gray-600 text-sm sm:text-base">
                {loading ? 'Loading...' : `${conversations.length} conversation${conversations.length === 1 ? '' : 's'}`}
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 sm:w-12 sm:h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading your messages...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-16">
            <MessageCircle className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-6 text-gray-400" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">No messages yet</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              When you receive messages from buyers or send messages to sellers, they'll appear here.
            </p>
            <Button asChild>
              <Link href="/" className="flex items-center space-x-2">
                <Package className="w-4 h-4" />
                <span>Browse Marketplace</span>
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Conversations List */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversations</h2>
              {conversations.map((conversation) => (
                <Card 
                  key={conversation.key}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    selectedConversation === conversation.key 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    setSelectedConversation(conversation.key);
                    // Mark unread messages as read when conversation is opened
                    const unreadIds = conversation.messages
                      .filter(m => !m.read && m.seller_email === user?.email)
                      .map(m => m.id);
                    if (unreadIds.length > 0) {
                      handleMarkAsRead(unreadIds);
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      {/* Listing Image */}
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        {conversation.listing?.image_urls?.[0] ? (
                          <Image
                            src={conversation.listing.image_urls[0]}
                            alt={conversation.listing.title || 'Listing'}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-500" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-gray-900 truncate text-sm sm:text-base">
                              {conversation.listing?.title || 'Unknown Listing'}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600 flex items-center mt-1">
                              <User className="w-3 h-3 mr-1" />
                              {conversation.otherParty}
                            </p>
                          </div>
                          {conversation.unreadCount > 0 && (
                            <div className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                              {conversation.unreadCount}
                            </div>
                          )}
                        </div>
                        
                        <p className="text-xs sm:text-sm text-gray-700 mt-2 line-clamp-2">
                          {conversation.latestMessage.message}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(conversation.latestMessage.created_at).toLocaleDateString()}
                          </span>
                          {conversation.listing?.price && (
                            <span className="text-xs font-semibold text-green-600">
                              ${conversation.listing.price.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Selected Conversation */}
            <div className="lg:sticky lg:top-8 lg:h-fit">
              {selectedConversation ? (
                <Card className="h-96 lg:h-[600px] flex flex-col">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">
                        {conversations.find(c => c.key === selectedConversation)?.listing?.title}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedConversation(null)}
                        className="lg:hidden"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    {conversations
                      .find(c => c.key === selectedConversation)
                      ?.messages
                      .reverse()
                      .map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.buyer_email === user?.email ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-xs sm:max-w-sm px-4 py-2 rounded-2xl ${
                              message.buyer_email === user?.email
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{message.message}</p>
                            <p className={`text-xs mt-1 ${
                              message.buyer_email === user?.email ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {new Date(message.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </Card>
              ) : (
                <Card className="h-96 lg:h-[600px] flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>Select a conversation to view messages</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}