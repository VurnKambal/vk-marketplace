'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, MessageSquare, ArrowLeft, User } from 'lucide-react';
import { getUserMessages, getConversationMessages, sendMessage, markMessagesAsRead } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/Header';

interface Message {
  id: string;
  listing_id: string;
  buyer_email: string;
  seller_email: string;
  buyer_id: string | null;
  message: string;
  read: boolean;
  created_at: string;
  listing?: {
    id: string;
    title: string;
    price: number;
    image_urls: string[];
    seller_email: string;
  };
}

interface Conversation {
  listingId: string;
  listingTitle: string;
  listingPrice: number;
  listingImage: string;
  otherPartyEmail: string;
  otherPartyName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: Message[];
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageSubscriptionRef = useRef<any>(null);
  // Add ref to track current selected conversation for real-time updates
  const selectedConversationRef = useRef<Conversation | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation?.messages]);

  useEffect(() => {
    initializeUser();
    loadMessages();
    
    // Set up real-time subscription when component mounts
    return () => {
      // Cleanup subscription on unmount
      if (messageSubscriptionRef.current) {
        messageSubscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  // Set up real-time subscription when user is available
  useEffect(() => {
    if (currentUser) {
      setupRealtimeSubscription();
    }
    
    return () => {
      if (messageSubscriptionRef.current) {
        messageSubscriptionRef.current.unsubscribe();
      }
    };
  }, [currentUser]);

  // Update ref whenever selectedConversation changes
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  const initializeUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const messages = await getUserMessages();
      
      // Group messages by conversation (listing + other party)
      const conversationMap = new Map<string, Conversation>();
      
      messages.forEach((message: Message) => {
        if (!message.listing) return;
        
        const isUserBuyer = message.buyer_email === user.email;
        const isUserSeller = message.seller_email === user.email;
        
        // Skip messages where user is neither buyer nor seller
        if (!isUserBuyer && !isUserSeller) return;
        
        const otherPartyEmail = isUserBuyer ? message.seller_email : message.buyer_email;
        const conversationKey = `${message.listing_id}-${otherPartyEmail}`;
        
        if (!conversationMap.has(conversationKey)) {
          conversationMap.set(conversationKey, {
            listingId: message.listing_id,
            listingTitle: message.listing.title,
            listingPrice: message.listing.price,
            listingImage: message.listing.image_urls[0] || '/placeholder.jpg',
            otherPartyEmail,
            otherPartyName: otherPartyEmail.split('@')[0],
            lastMessage: message.message,
            lastMessageTime: message.created_at,
            unreadCount: 0,
            messages: []
          });
        }
        
        const conversation = conversationMap.get(conversationKey)!;
        conversation.messages.push(message);
        
        // Update last message if this message is newer
        if (new Date(message.created_at) > new Date(conversation.lastMessageTime)) {
          conversation.lastMessage = message.message;
          conversation.lastMessageTime = message.created_at;
        }
        
        // Count unread messages (messages sent by other party and not read)
        if (!message.read) {
          const messageFromOtherParty = (isUserBuyer && message.seller_email === otherPartyEmail) ||
                                       (isUserSeller && message.buyer_email === otherPartyEmail);
          if (messageFromOtherParty) {
            conversation.unreadCount++;
          }
        }
      });
      
      // Sort conversations by last message time
      const sortedConversations = Array.from(conversationMap.values())
        .sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
      
      setConversations(sortedConversations);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = async (conversation: Conversation) => {
    try {
      if (!currentUser) return;
      
      // Mark messages as read
      const unreadMessageIds = conversation.messages
        .filter(msg => {
          if (msg.read) return false;
          
          // Mark as read if the message is from the other party
          const isUserBuyer = msg.buyer_email === currentUser.email;
          const isUserSeller = msg.seller_email === currentUser.email;
          
          if (isUserBuyer) {
            return msg.seller_email === conversation.otherPartyEmail;
          } else if (isUserSeller) {
            return msg.buyer_email === conversation.otherPartyEmail;
          }
          
          return false;
        })
        .map(msg => msg.id);
      
      if (unreadMessageIds.length > 0) {
        await markMessagesAsRead(unreadMessageIds);
      }
      
      // Load fresh conversation messages
      const freshMessages = await getConversationMessages(
        conversation.listingId, 
        conversation.otherPartyEmail
      );
      
      const updatedConversation = {
        ...conversation,
        messages: freshMessages,
        unreadCount: 0
      };
      
      setSelectedConversation(updatedConversation);
      
      // Update conversations list
      setConversations(prev => 
        prev.map(conv => 
          conv.listingId === conversation.listingId && 
          conv.otherPartyEmail === conversation.otherPartyEmail
            ? updatedConversation
            : conv
        )
      );
    } catch (error) {
      console.error('Error selecting conversation:', error);
      setSelectedConversation(conversation);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || sending || !currentUser) return;

    const messageToSend = newMessage.trim();
    const tempMessageId = `temp-${Date.now()}`;
    setSending(true);
    setNewMessage(''); // Clear input immediately for better UX
    
    // Add optimistic message immediately for instant UI feedback
    const optimisticMessage = {
      id: tempMessageId,
      listing_id: selectedConversation.listingId,
      buyer_email: currentUser.email,
      seller_email: selectedConversation.otherPartyEmail,
      buyer_id: currentUser.id,
      message: messageToSend,
      read: false,
      created_at: new Date().toISOString(),
      listing: {
        id: selectedConversation.listingId,
        title: selectedConversation.listingTitle,
        price: selectedConversation.listingPrice,
        image_urls: [selectedConversation.listingImage],
        seller_email: selectedConversation.otherPartyEmail
      }
    };

    // Immediately add optimistic message to chat
    setSelectedConversation(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: [...prev.messages, optimisticMessage],
        lastMessage: messageToSend,
        lastMessageTime: optimisticMessage.created_at
      };
    });

    try {
      // Send the actual message
      await sendMessage(
        selectedConversation.listingId,
        selectedConversation.otherPartyEmail,
        messageToSend
      );
      
      // Replace optimistic message with real message from database
      setTimeout(async () => {
        const freshMessages = await getConversationMessages(
          selectedConversation.listingId,
          selectedConversation.otherPartyEmail
        );
        
        const updatedConversation = {
          ...selectedConversation,
          messages: freshMessages,
          lastMessage: messageToSend,
          lastMessageTime: new Date().toISOString()
        };
        
        setSelectedConversation(updatedConversation);
        
        // Update conversations list
        setConversations(prev => 
          prev.map(conv => 
            conv.listingId === selectedConversation.listingId && 
            conv.otherPartyEmail === selectedConversation.otherPartyEmail
              ? updatedConversation
              : conv
          )
        );
      }, 200); // Small delay to ensure database write completes
      
      // Trigger global message update
      window.dispatchEvent(new CustomEvent('messagesChanged'));
      
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error and restore input
      setSelectedConversation(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.filter(msg => msg.id !== tempMessageId)
        };
      });
      setNewMessage(messageToSend); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 168) // 7 days
    {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const isMessageFromCurrentUser = (message: Message) => {
    if (!currentUser) return false;
    
    const currentUserEmail = currentUser.email;
    
    // More reliable logic to determine message sender
    // If the message has a buyer_id, it was sent by the buyer
    if (message.buyer_id) {
      // Message sent by buyer - check if current user is the buyer
      return message.buyer_email === currentUserEmail && message.buyer_id === currentUser.id;
    } else {
      // Message sent by seller (no buyer_id) - check if current user is the seller
      return message.seller_email === currentUserEmail;
    }
  };

  const setupRealtimeSubscription = () => {
    if (!currentUser) return;

    console.log('Setting up real-time subscription for user:', currentUser.email);

    // Clean up existing subscription
    if (messageSubscriptionRef.current) {
      messageSubscriptionRef.current.unsubscribe();
    }

    // Set up new subscription for real-time message updates
    messageSubscriptionRef.current = supabase
      .channel(`messages-${currentUser.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        console.log('New message received via real-time:', payload);
        const newMessage = payload.new as any;
        
        // Check if this message is relevant to current user
        if (newMessage.buyer_email === currentUser.email || newMessage.seller_email === currentUser.email) {
          console.log('Message is relevant to current user, processing...');
          handleRealtimeMessage(newMessage);
        } else {
          console.log('Message not relevant to current user, ignoring');
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        console.log('Message updated via real-time:', payload);
        const updatedMessage = payload.new as any;
        
        // Check if this message is relevant to current user
        if (updatedMessage.buyer_email === currentUser.email || updatedMessage.seller_email === currentUser.email) {
          // Handle read status updates
          if (payload.new.read !== payload.old.read) {
            handleMessageReadUpdate(updatedMessage);
          }
        }
      })
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to real-time messages');
        }
      });
  };

  const handleMessageReadUpdate = (updatedMessage: any) => {
    // Update conversations list to reflect read status
    setConversations(prev => 
      prev.map(conv => ({
        ...conv,
        messages: conv.messages.map(msg => 
          msg.id === updatedMessage.id ? { ...msg, read: updatedMessage.read } : msg
        )
      }))
    );

    // Update selected conversation if it matches
    if (selectedConversation) {
      setSelectedConversation(prev => ({
        ...prev!,
        messages: prev!.messages.map(msg => 
          msg.id === updatedMessage.id ? { ...msg, read: updatedMessage.read } : msg
        )
      }));
    }
  };

  const handleRealtimeMessage = async (newMessage: any) => {
    try {
      console.log('🔔 REAL-TIME MESSAGE RECEIVED:', newMessage);
      
      // Use ref to get current selected conversation (avoids stale state)
      const currentSelectedConversation = selectedConversationRef.current;
      console.log('🔍 CURRENT SELECTED CONVERSATION FROM REF:', currentSelectedConversation);
      
      // Get the listing details for the new message
      const { data: listing } = await supabase
        .from('listings')
        .select('id, title, price, image_urls')
        .eq('id', newMessage.listing_id)
        .single();

      if (!listing) {
        console.log('❌ No listing found');
        return;
      }

      const messageWithListing = {
        ...newMessage,
        listing: {
          id: listing.id,
          title: listing.title,
          price: listing.price,
          image_urls: listing.image_urls
        }
      };

      // Determine user roles and other party with more robust logic
      const isUserBuyer = newMessage.buyer_email === currentUser?.email;
      const isUserSeller = newMessage.seller_email === currentUser?.email;
      
      // Calculate otherPartyEmail based on user role
      let otherPartyEmail = '';
      if (isUserBuyer) {
        otherPartyEmail = newMessage.seller_email;
      } else if (isUserSeller) {
        otherPartyEmail = newMessage.buyer_email;
      } else {
        console.log('❌ User is neither buyer nor seller');
        return;
      }

      console.log('🔍 USER ROLES:', {
        currentUserEmail: currentUser?.email,
        messageBuyer: newMessage.buyer_email,
        messageSeller: newMessage.seller_email,
        isUserBuyer,
        isUserSeller,
        calculatedOtherPartyEmail: otherPartyEmail
      });

      // Enhanced conversation matching logic using ref
      const conversationMatches = currentSelectedConversation && 
        currentSelectedConversation.listingId === newMessage.listing_id &&
        currentSelectedConversation.otherPartyEmail === otherPartyEmail;

      console.log('🎯 CONVERSATION MATCHING:', {
        hasSelectedConversation: !!currentSelectedConversation,
        selectedConversation: currentSelectedConversation ? {
          listingId: currentSelectedConversation.listingId,
          otherPartyEmail: currentSelectedConversation.otherPartyEmail,
          listingTitle: currentSelectedConversation.listingTitle
        } : null,
        messageDetails: {
          listing_id: newMessage.listing_id,
          calculatedOtherPartyEmail: otherPartyEmail,
          listingTitle: listing.title
        },
        listingIdMatches: currentSelectedConversation?.listingId === newMessage.listing_id,
        otherPartyMatches: currentSelectedConversation?.otherPartyEmail === otherPartyEmail,
        FINAL_MATCH: conversationMatches
      });

      // FORCE UPDATE CHATBOX IF CONVERSATION MATCHES
      if (conversationMatches) {
        console.log('🚀 FORCE UPDATING CHATBOX NOW!');
        
        // Use React's state updater with current state
        setSelectedConversation(currentConv => {
          if (!currentConv) {
            console.log('❌ No current conversation in state updater');
            return currentConv;
          }

          // Check for duplicates
          const isDuplicate = currentConv.messages.some(msg => msg.id === newMessage.id);
          if (isDuplicate) {
            console.log('⚠️ Duplicate message, skipping');
            return currentConv;
          }

          console.log('✅ ADDING MESSAGE TO CHATBOX - REAL-TIME UPDATE!');
          const updatedConv = {
            ...currentConv,
            messages: [...currentConv.messages, messageWithListing],
            lastMessage: newMessage.message,
            lastMessageTime: newMessage.created_at
          };

          console.log('📊 CHATBOX STATE UPDATED:', {
            previousMessageCount: currentConv.messages.length,
            newMessageCount: updatedConv.messages.length,
            newMessageId: newMessage.id,
            newMessageText: newMessage.message,
            newMessageFrom: isUserBuyer ? 'seller' : 'buyer'
          });

          // Force scroll after DOM update
          setTimeout(() => {
            console.log('🔄 Scrolling to bottom...');
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);

          return updatedConv;
        });

        // Mark as read if message is from other party
        const messageFromOtherParty = (isUserBuyer && newMessage.seller_email === otherPartyEmail) || 
                                     (isUserSeller && newMessage.buyer_email === otherPartyEmail);
        
        if (!newMessage.read && messageFromOtherParty) {
          console.log('📖 Marking message as read...');
          setTimeout(() => markMessagesAsRead([newMessage.id]), 500);
        }
      } else {
        console.log('❌ NO CONVERSATION MATCH - CHATBOX NOT UPDATED');
        console.log('🔍 DEBUGGING MATCH FAILURE:', {
          selectedConversationExists: !!currentSelectedConversation,
          selectedListingId: currentSelectedConversation?.listingId,
          messageListingId: newMessage.listing_id,
          selectedOtherParty: currentSelectedConversation?.otherPartyEmail,
          calculatedOtherParty: otherPartyEmail,
          listingMatch: currentSelectedConversation?.listingId === newMessage.listing_id,
          partyMatch: currentSelectedConversation?.otherPartyEmail === otherPartyEmail
        });
      }

      // Always update conversations list for sidebar
      setConversations(prevConversations => {
        console.log('📋 Updating conversations list...');
        
        const existingIndex = prevConversations.findIndex(
          conv => conv.listingId === newMessage.listing_id && conv.otherPartyEmail === otherPartyEmail
        );

        if (existingIndex >= 0) {
          console.log('🔄 Updating existing conversation in list');
          const updated = [...prevConversations];
          const existing = updated[existingIndex];
          
          // Check if message already exists
          const messageExists = existing.messages.some(m => m.id === newMessage.id);
          
          updated[existingIndex] = {
            ...existing,
            lastMessage: newMessage.message,
            lastMessageTime: newMessage.created_at,
            messages: messageExists ? existing.messages : [...existing.messages, messageWithListing],
            unreadCount: messageExists ? existing.unreadCount : existing.unreadCount + 1
          };

          // Move to top
          const [moved] = updated.splice(existingIndex, 1);
          return [moved, ...updated];
        } else {
          console.log('➕ Creating new conversation in list');
          // New conversation
          return [{
            listingId: newMessage.listing_id,
            listingTitle: listing.title,
            listingPrice: listing.price,
            listingImage: listing.image_urls[0] || '/placeholder.jpg',
            otherPartyEmail,
            otherPartyName: otherPartyEmail.split('@')[0],
            lastMessage: newMessage.message,
            lastMessageTime: newMessage.created_at,
            unreadCount: 1,
            messages: [messageWithListing]
          }, ...prevConversations];
        }
      });

      // Global update
      window.dispatchEvent(new CustomEvent('messagesChanged'));

    } catch (error) {
      console.error('❌ REAL-TIME ERROR:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
        <div className="container mx-auto p-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
              <p className="text-gray-600 font-medium">Loading messages...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
      <Header />
      <div className="flex flex-col lg:flex-row relative h-[calc(100vh-72px)]">
        {/* Animated background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-20 left-10 w-16 h-16 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full animate-float"></div>
          <div className="absolute top-40 right-10 sm:right-20 w-12 h-12 sm:w-24 sm:h-24 bg-gradient-to-br from-pink-400/10 to-yellow-400/10 rounded-full animate-float-delayed"></div>
          <div className="absolute bottom-32 left-1/4 w-20 h-20 sm:w-40 sm:h-40 bg-gradient-to-br from-green-400/10 to-teal-400/10 rounded-full animate-float-slow"></div>
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row w-full h-full overflow-hidden">
          {/* Messages Sidebar */}
          <div className={`${selectedConversation ? 'hidden lg:block' : 'block'} w-full lg:w-80 bg-white/80 backdrop-blur-sm border-r border-gray-200 h-full overflow-y-auto`}>
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Messages</h1>
                  <p className="text-sm text-gray-600">Stay connected with sellers and buyers</p>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-sm text-gray-600 font-medium">Loading conversations...</p>
                  </div>
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium mb-2">No messages yet</p>
                  <p className="text-sm text-gray-500">
                    Start a conversation by messaging a seller
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {conversations.map((conversation) => (
                    <div
                      key={`${conversation.listingId}-${conversation.otherPartyEmail}`}
                      onClick={() => handleSelectConversation(conversation)}
                      className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:shadow-md ${
                        selectedConversation?.listingId === conversation.listingId &&
                        selectedConversation?.otherPartyEmail === conversation.otherPartyEmail
                          ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 shadow-md' 
                          : 'bg-white/50 border border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <img
                            src={conversation.listingImage}
                            alt={conversation.listingTitle}
                            className="w-12 h-12 object-cover rounded-lg shadow-md"
                          />
                          {conversation.unreadCount > 0 && (
                            <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                              <span className="text-xs text-white font-bold">
                                {conversation.unreadCount}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-sm truncate text-gray-900">
                              {conversation.listingTitle}
                            </h4>
                            <span className="text-xs text-gray-500 flex-shrink-0">
                              {formatTime(conversation.lastMessageTime)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-4 h-4 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                              <User className="w-2 h-2 text-white" />
                            </div>
                            <p className="text-sm text-gray-600">
                              {conversation.otherPartyName}
                            </p>
                          </div>
                          <p className="text-sm text-gray-500 truncate">
                            {conversation.lastMessage}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`${selectedConversation ? 'block' : 'hidden lg:block'} flex-1 bg-gradient-to-br from-gray-50 via-white to-blue-50 h-full flex flex-col overflow-hidden`}>
            {selectedConversation ? (
              <>
                {/* Chat Header - Fixed positioning */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg flex-shrink-0 border-b">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedConversation(null)}
                      className="lg:hidden text-white hover:bg-white/20 p-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <img
                      src={selectedConversation.listingImage}
                      alt={selectedConversation.listingTitle}
                      className="w-10 h-10 object-cover rounded-lg shadow-md"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base truncate">
                        {selectedConversation.listingTitle}
                      </h3>
                      <p className="text-sm text-blue-100 truncate">
                        Chat with {selectedConversation.otherPartyName}
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30 flex-shrink-0">
                      ${selectedConversation.listingPrice}
                    </Badge>
                  </div>
                </div>
                
                {/* Messages Container - Scrollable area */}
                <div className="flex-1 overflow-y-auto bg-white/30 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                  <div className="p-4 space-y-3 min-h-full">
                    {selectedConversation.messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full min-h-[400px]">
                        <div className="text-center text-gray-500">
                          <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                          <p className="font-medium text-lg">No messages yet</p>
                          <p className="text-sm">Start the conversation!</p>
                        </div>
                      </div>
                    ) : (
                      selectedConversation.messages.map((message) => {
                        const isFromCurrentUser = isMessageFromCurrentUser(message);
                        
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'} mb-3`}
                          >
                            <div
                              className={`max-w-[75%] sm:max-w-[60%] px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 ${
                                isFromCurrentUser
                                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-br-md'
                                  : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                              }`}
                            >
                              <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                                {message.message}
                              </p>
                              <p
                                className={`text-xs mt-2 ${
                                  isFromCurrentUser ? 'text-blue-100' : 'text-gray-500'
                                }`}
                              >
                                {formatTime(message.created_at)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Message Input - Fixed at bottom */}
                <div className="border-t bg-white shadow-lg p-4 flex-shrink-0">
                  <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Aa"
                      className="flex-1 bg-gray-100 border-0 focus:ring-2 focus:ring-blue-500 rounded-full px-4 py-3 min-h-[44px] text-base placeholder:text-gray-500"
                      disabled={sending}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                    />
                    <Button 
                      type="submit" 
                      disabled={sending || !newMessage.trim()}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 rounded-full w-11 h-11 p-0 shadow-lg transition-all duration-200 disabled:opacity-50 flex-shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <MessageSquare className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Select a conversation</h2>
                  <p className="text-gray-600 text-lg">
                    Choose from your conversations on the left to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}