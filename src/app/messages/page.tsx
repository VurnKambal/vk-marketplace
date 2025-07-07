'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, MessageSquare, ArrowLeft, User } from 'lucide-react';
import { getUserMessages, getConversationMessages, sendMessage, markMessagesAsRead } from '@/lib/api';
import { supabase } from '@/lib/supabase';

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
    setSending(true);
    setNewMessage(''); // Clear input immediately for better UX
    
    try {
      await sendMessage(
        selectedConversation.listingId,
        selectedConversation.otherPartyEmail,
        messageToSend
      );
      
      // Force immediate refresh of conversation messages to ensure real-time update
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
      }, 100); // Small delay to ensure database write completes
      
      // Trigger global message update
      window.dispatchEvent(new CustomEvent('messagesChanged'));
      
    } catch (error) {
      console.error('Error sending message:', error);
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
    } else if (diffInHours < 168) { // 7 days
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
      .channel('messages-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        console.log('New message received:', payload);
        // Check if this message is relevant to current user
        const newMessage = payload.new as any;
        if (newMessage.buyer_email === currentUser.email || newMessage.seller_email === currentUser.email) {
          handleRealtimeMessage(newMessage);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        console.log('Message updated:', payload);
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
      // Get the listing details for the new message
      const { data: listing } = await supabase
        .from('listings')
        .select('id, title, price, image_urls')
        .eq('id', newMessage.listing_id)
        .single();

      if (!listing) return;

      const messageWithListing = {
        ...newMessage,
        listing: {
          id: listing.id,
          title: listing.title,
          price: listing.price,
          image_urls: listing.image_urls
        }
      };

      // Update selected conversation FIRST for immediate chat update
      if (selectedConversation && 
          selectedConversation.listingId === newMessage.listing_id) {
        
        const isUserBuyer = newMessage.buyer_email === currentUser.email;
        const isUserSeller = newMessage.seller_email === currentUser.email;
        const otherPartyEmail = isUserBuyer ? newMessage.seller_email : newMessage.buyer_email;
        
        if (selectedConversation.otherPartyEmail === otherPartyEmail) {
          // Immediately update the chat with the new message
          setSelectedConversation(prev => ({
            ...prev!,
            messages: [...prev!.messages, messageWithListing],
            lastMessage: newMessage.message,
            lastMessageTime: newMessage.created_at
          }));

          // Auto-mark as read if conversation is open and message is from other party
          const isFromOtherParty = (isUserBuyer && newMessage.seller_email === otherPartyEmail) ||
                                  (isUserSeller && newMessage.buyer_email === otherPartyEmail);
          
          if (!newMessage.read && isFromOtherParty) {
            setTimeout(() => {
              markMessagesAsRead([newMessage.id]);
            }, 1000);
          }
        }
      }

      // Then update conversations list
      setConversations(prevConversations => {
        const isUserBuyer = newMessage.buyer_email === currentUser.email;
        const isUserSeller = newMessage.seller_email === currentUser.email;
        
        if (!isUserBuyer && !isUserSeller) return prevConversations;
        
        const otherPartyEmail = isUserBuyer ? newMessage.seller_email : newMessage.buyer_email;
        
        const existingConvIndex = prevConversations.findIndex(
          conv => conv.listingId === newMessage.listing_id && conv.otherPartyEmail === otherPartyEmail
        );

        if (existingConvIndex >= 0) {
          // Update existing conversation
          const updatedConversations = [...prevConversations];
          const existingConv = updatedConversations[existingConvIndex];
          
          // Check if message is from the other party (increment unread count only if conversation is not open)
          const isFromOtherParty = (isUserBuyer && newMessage.seller_email === otherPartyEmail) ||
                                  (isUserSeller && newMessage.buyer_email === otherPartyEmail);
          
          const isConversationOpen = selectedConversation?.listingId === newMessage.listing_id && 
                                   selectedConversation?.otherPartyEmail === otherPartyEmail;
          
          updatedConversations[existingConvIndex] = {
            ...existingConv,
            lastMessage: newMessage.message,
            lastMessageTime: newMessage.created_at,
            unreadCount: existingConv.unreadCount + (isFromOtherParty && !isConversationOpen ? 1 : 0),
            messages: [...existingConv.messages, messageWithListing]
          };

          // Move updated conversation to top
          const [updated] = updatedConversations.splice(existingConvIndex, 1);
          return [updated, ...updatedConversations];
        } else {
          // Create new conversation
          const isFromOtherParty = (isUserBuyer && newMessage.seller_email === otherPartyEmail) ||
                                  (isUserSeller && newMessage.buyer_email === otherPartyEmail);
          
          const newConversation = {
            listingId: newMessage.listing_id,
            listingTitle: listing.title,
            listingPrice: listing.price,
            listingImage: listing.image_urls[0] || '/placeholder.jpg',
            otherPartyEmail,
            otherPartyName: otherPartyEmail.split('@')[0],
            lastMessage: newMessage.message,
            lastMessageTime: newMessage.created_at,
            unreadCount: isFromOtherParty ? 1 : 0,
            messages: [messageWithListing]
          };

          return [newConversation, ...prevConversations];
        }
      });

      // Trigger global message update for header
      window.dispatchEvent(new CustomEvent('messagesChanged'));
    } catch (error) {
      console.error('Error handling realtime message:', error);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
      <div className="container mx-auto p-4">
        {/* Fixed height container like messenger */}
        <div className="h-[calc(100vh-140px)] max-h-[800px] grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Conversations List */}
          <div className={`${selectedConversation ? 'hidden lg:block' : 'block'} lg:col-span-1`}>
            <Card className="h-full shadow-xl border-0 bg-white/70 backdrop-blur-sm flex flex-col">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg flex-shrink-0">
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  Messages
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-hidden">
                {conversations.length === 0 ? (
                  <div className="p-8 text-center h-full flex flex-col justify-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-medium">No messages yet</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Start a conversation by messaging a seller
                    </p>
                  </div>
                ) : (
                  <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                    {conversations.map((conversation) => (
                      <div
                        key={`${conversation.listingId}-${conversation.otherPartyEmail}`}
                        onClick={() => handleSelectConversation(conversation)}
                        className={`p-4 border-b cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 ${
                          selectedConversation?.listingId === conversation.listingId &&
                          selectedConversation?.otherPartyEmail === conversation.otherPartyEmail
                            ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200' 
                            : 'hover:shadow-md'
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
              </CardContent>
            </Card>
          </div>

          {/* Chat Area - Messenger-style fixed height */}
          <div className={`${selectedConversation ? 'block' : 'hidden lg:block'} lg:col-span-2`}>
            {selectedConversation ? (
              <Card className="h-full shadow-xl border-0 bg-white/70 backdrop-blur-sm flex flex-col">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg flex-shrink-0 py-3">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedConversation(null)}
                      className="lg:hidden text-white hover:bg-white/20"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <img
                      src={selectedConversation.listingImage}
                      alt={selectedConversation.listingTitle}
                      className="w-10 h-10 object-cover rounded-lg shadow-md"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">
                        {selectedConversation.listingTitle}
                      </h3>
                      <p className="text-sm text-blue-100">
                        Chat with {selectedConversation.otherPartyName}
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      ${selectedConversation.listingPrice}
                    </Badge>
                  </div>
                </CardHeader>
                
                {/* Messages Container - Fixed height with scroll like messenger */}
                <div className="flex-1 min-h-0 bg-gradient-to-b from-white/50 to-white/30 relative">
                  <div className="absolute inset-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent p-4">
                    <div className="space-y-3">
                      {selectedConversation.messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full min-h-[200px]">
                          <div className="text-center text-gray-500">
                            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p className="font-medium">No messages yet</p>
                            <p className="text-sm">Start the conversation!</p>
                          </div>
                        </div>
                      ) : (
                        selectedConversation.messages.map((message) => {
                          const isFromCurrentUser = isMessageFromCurrentUser(message);
                          
                          return (
                            <div
                              key={message.id}
                              className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'} mb-2`}
                            >
                              <div
                                className={`max-w-[75%] sm:max-w-[60%] px-4 py-2 rounded-2xl shadow-sm transition-all duration-200 ${
                                  isFromCurrentUser
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-br-md'
                                    : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                                }`}
                              >
                                <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                                  {message.message}
                                </p>
                                <p
                                  className={`text-xs mt-1 ${
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
                </div>

                {/* Message Input - Fixed at bottom like messenger */}
                <div className="border-t bg-white/80 backdrop-blur-sm p-3 flex-shrink-0">
                  <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-full px-4 py-2 min-h-[40px] resize-none"
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
                      className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 rounded-full w-10 h-10 p-0 shadow-lg transition-all duration-200 disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </Card>
            ) : (
              <Card className="h-full hidden lg:block shadow-xl border-0 bg-white/70 backdrop-blur-sm">
                <CardContent className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-gray-600 font-medium">Select a conversation to start messaging</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Choose from your conversations on the left
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}