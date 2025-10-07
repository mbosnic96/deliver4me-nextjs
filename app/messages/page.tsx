"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Send, User, ArrowLeft, Plus, MessageCircle } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
    userName: string;
    photoUrl?: string;
    subject?: string;
  };
  receiver: {
    _id: string;
    name: string;
    userName: string;
    photoUrl?: string;
  };
  content: string;
  isRead: boolean;
  createdAt: string;
  subject?: string;
}

interface Conversation {
  conversationId: string;
  lastMessage: Message;
  unreadCount: number;
  otherUser: {
    _id: string;
    name: string;
    userName: string;
    photoUrl?: string;
  };
}

interface UserInfo {
  _id: string;
  name: string;
  userName: string;
  photoUrl?: string;
}

export default function MessagesPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const withUserId = searchParams.get('with');
  const subject = searchParams.get('subject'); 
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [selectedUserInfo, setSelectedUserInfo] = useState<UserInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [startingNewConversation, setStartingNewConversation] = useState(false);
  const [conversationsLoaded, setConversationsLoaded] = useState(false);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const conversationsContainerRef = useRef<HTMLDivElement>(null);

  const setupEventSource = useCallback((userId: string): EventSource | null => {
    if (!session?.user?.id || !userId) return null;

    if (eventSource) {
      eventSource.close();
    }

    const newEventSource = new EventSource(
      `/api/messages/stream?with=${userId}`
    );

    newEventSource.onopen = () => {
      console.log('SSE connection opened for user:', userId);
    };

    newEventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'connected':
            console.log('SSE connected:', data.clientId);
            break;
            
          case 'recent_messages':
            setMessages(data.messages || []);
            break;
            
          case 'new_message':
            setMessages(prev => {
              if (prev.some(msg => msg._id === data.message._id)) {
                return prev;
              }
              return [...prev, data.message];
            });
            fetchConversations();
            break;
            
          case 'messages_read':
            setMessages(prev => 
              prev.map(msg => 
                data.messageIds.includes(msg._id) 
                  ? { ...msg, isRead: true }
                  : msg
              )
            );
            break;
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    newEventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      newEventSource.close();
      setTimeout(() => {
        if (selectedConversation) {
          setupEventSource(selectedConversation);
        }
      }, 3000);
    };

    setEventSource(newEventSource);

    return newEventSource;
  }, [session?.user?.id, selectedConversation]);


  const markMessagesAsRead = useCallback(async (conversationId: string) => {
    if (!session?.user?.id || !conversationId) return;

    try {
      const res = await fetch('/api/messages/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId
        })
      });

      if (res.ok) {
        setMessages(prev => prev.map(msg => ({ ...msg, isRead: true })));
        fetchConversations();
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchConversations();
  }, [session]);

  useEffect(() => {
    if (withUserId && conversationsLoaded) {
      handleUserSelection(withUserId);
    }
  }, [withUserId, conversationsLoaded]);

  useEffect(() => {
    let currentEventSource: EventSource | null = null;
    
    if (selectedConversation) {
      currentEventSource = setupEventSource(selectedConversation);
      
      const conversationId = `${[session?.user?.id, selectedConversation].sort().join('-')}`;
      markMessagesAsRead(conversationId);
    }

    return () => {
      if (currentEventSource) {
        currentEventSource.close();
      }
    };
  }, [selectedConversation, setupEventSource, session?.user?.id, markMessagesAsRead]);

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      const scrollContainer = messagesContainerRef.current;
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      scrollToBottom();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [messages, selectedConversation, scrollToBottom]);

  const handleUserSelection = async (userId: string) => {
    const existingConversation = conversations.find(
      conv => getOtherUser(conv)._id === userId
    );
    
    if (existingConversation) {
      setSelectedConversation(userId);
      setStartingNewConversation(false);
      setSelectedUserInfo(getOtherUser(existingConversation));
      setMessages([]); 
    } else {
      setStartingNewConversation(true);
      setSelectedConversation(userId);
      setMessages([]); 
      await fetchUserInfo(userId);
    }
  };

  const fetchUserInfo = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`);
      if (res.ok) {
        const userData = await res.json();
        setSelectedUserInfo({
          _id: userData.id || userData._id,
          name: userData.name,
          userName: userData.userName,
          photoUrl: userData.photoUrl
        });
        
        const tempConversation: Conversation = {
          conversationId: `${[session?.user?.id, userId].sort().join('-')}`,
          lastMessage: {
            _id: 'temp',
            sender: { _id: session?.user?.id!, name: session?.user?.name || '', userName: '' },
            receiver: { _id: userId, name: userData.name, userName: userData.userName },
            content: 'Start a new conversation...',
            isRead: true,
            createdAt: new Date().toISOString()
          },
          unreadCount: 0,
          otherUser: {
            _id: userId,
            name: userData.name,
            userName: userData.userName,
            photoUrl: userData.photoUrl
          }
        };
        setConversations(prev => [tempConversation, ...prev]);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/messages');
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
        setConversationsLoaded(true);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: selectedConversation,
          content: newMessage,
          subject: subject || 'Privatna poruka' 
        })
      });

      if (res.ok) {
        setNewMessage("");
        setStartingNewConversation(false);
         if (subject) {
          window.history.replaceState({}, '', '/messages');
        }
      } else {
        const errorData = await res.json();
        console.error('Error sending message:', errorData);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const getOtherUser = (conversation: Conversation) => {
    return conversation.otherUser;
  };

  const handleConversationSelect = (userId: string) => {
    setSelectedConversation(userId);
    setStartingNewConversation(false);
    const conversation = conversations.find(conv => getOtherUser(conv)._id === userId);
    if (conversation) {
      setSelectedUserInfo(getOtherUser(conversation));
      setMessages([]); 
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ height: 'calc(100vh - 8rem)' }}>
          
          <div className="lg:col-span-1 content-bg rounded-xl shadow-sm border flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-xl font-semibold  text-blue-600">Poruke</h2>
            </div>
            <div 
              ref={conversationsContainerRef}
              className="flex-1 overflow-y-auto min-h-0" 
            >
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <MessageCircle size={48} className="mx-auto mb-4 text-gray-400" />
                  <p>Nema poruka</p>
                </div>
              ) : (
                conversations.map((conversation) => {
                  const user = getOtherUser(conversation);
                  return (
                    <button
                      key={conversation.conversationId}
                      onClick={() => handleConversationSelect(user._id)}
                      className={`w-full p-4 border-b border-gray-100 hover:bg-gray-50 transition text-left ${
                        selectedConversation === user._id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {user.photoUrl ? (
                            <Image
                              src={user.photoUrl}
                              alt={user.name}
                              width={40}
                              height={40}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <User size={20} className="text-gray-400" />
                            </div>
                          )}
                          {conversation.unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-blue-600 truncate">
                            {user.name}
                          </h3>
                          <p className="text-sm text-gray-600 truncate">
                            {conversation.lastMessage.content}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="lg:col-span-2 content-bg rounded-xl shadow-sm border flex flex-col h-full overflow-hidden">
            {selectedConversation ? (
              <>
                <div className="p-4 border-b border-gray-200 content-bg flex-shrink-0">
  <div className="flex items-center gap-3">
    <button
      onClick={() => {
        setSelectedConversation(null);
        setSelectedUserInfo(null);
        setStartingNewConversation(false);
        if (eventSource) {
          eventSource.close();
          setEventSource(null);
        }
      }}
      className="lg:hidden text-gray-600 hover:text-blue-600"
    >
      <ArrowLeft size={20} />
    </button>
    
    {selectedUserInfo?.photoUrl ? (
      <Image
        src={selectedUserInfo.photoUrl}
        alt={selectedUserInfo.name}
        width={40}
        height={40}
        className="rounded-full"
      />
    ) : (
      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
        <User size={20} className="text-gray-400" />
      </div>
    )}
    
    <div className="flex-1">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-blue-600">
            {selectedUserInfo?.name || "Korisnik"}
          </h3>
          <p className="text-sm text-blue-600">
            @{selectedUserInfo?.userName || "korisnik"}
          </p>
        </div>
        
        {startingNewConversation && (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
            Nova konverzacija
          </span>
        )}
      </div>
      
      {messages.length > 0 && messages[0]?.subject && messages[0].subject !== 'Privatna poruka' && (
        <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm font-medium text-blue-800">
            Predmet: {messages[0].subject}
          </div>
        </div>
      )}
    </div>
  </div>
</div>

                <div 
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4 content-bg"
                >
                  {messages.length === 0 && (
                    <div className="text-center py-8">
                      <Plus size={48} className="mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600">
                        {startingNewConversation ? "Započnite novu konverzaciju" : "Nema poruka"}
                      </p>
                    </div>
                  )}
                  
                  {messages.map((message) => (
                    <div
                      key={message._id}
                      className={`flex ${message.sender._id === session?.user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender._id === session?.user?.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-blue-600 border border-gray-200'
                        }`}
                      >
                        <p className="break-words">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender._id === session?.user?.id
                            ? 'text-blue-100'
                            : 'text-gray-500'
                        }`}>
                          {new Date(message.createdAt).toLocaleTimeString('bs-BA', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-gray-200 content-bg flex-shrink-0">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder={
                        startingNewConversation 
                          ? "Započnite novu konverzaciju..." 
                          : "Napišite poruku..."
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center conent-bg min-h-0">
                <div className="text-center">
                  <MessageCircle size={64} className="mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Dobrodošli u poruke</h3>
                  <p className="text-gray-600 max-w-sm">
                    {conversations.length === 0 
                      ? "Pošaljite prvu poruku nekome!"
                      : "Odaberite razgovor sa liste da biste vidjeli poruke"
                    }
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