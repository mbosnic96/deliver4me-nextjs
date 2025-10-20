"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Send, ArrowLeft, MessageCircle, Clock, Check } from "lucide-react";
import Image from "next/image";
import { useSocket } from "@/lib/SocketProvider";

interface ClientMessage {
  _id: string;
  sender: any;
  receiver: any;
  subject?: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  conversationId: string;
  status?: "sending" | "sent";
}

interface Conversation {
  conversationId: string;
  lastMessage: ClientMessage;
  unreadCount: number;
  otherUser: any;
}

export default function MessagesPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { socket } = useSocket();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ClientMessage[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [subject, setSubject] = useState("Privatna poruka");
  const [newMessage, setNewMessage] = useState("");
  const [otherUsers, setOtherUsers] = useState<Map<string, any>>(new Map());
  const [loadingUser, setLoadingUser] = useState<string | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Fetch user data for a specific user ID
  const fetchUserData = useCallback(async (userId: string) => {
    try {
      setLoadingUser(userId);
      const res = await fetch(`/api/users/${userId}`);
      if (res.ok) {
        const userData = await res.json();
        setOtherUsers(prev => new Map(prev).set(userId, userData));
        return userData;
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoadingUser(null);
    }
    return null;
  }, []);

  // Load conversations
  const loadConversations = useCallback(() => {
    if (!socket) return;
    socket.emit("get_conversations", null, (convList: Conversation[]) => {
      setConversations(convList);
      const usersMap = new Map();
      convList.forEach(c => usersMap.set(c.otherUser._id, c.otherUser));
      setOtherUsers(prev => {
        const newMap = new Map(prev);
        usersMap.forEach((value, key) => newMap.set(key, value));
        return newMap;
      });
    });
  }, [socket]);

  // Get subject from messages
  const getConversationSubject = useCallback((msgs: ClientMessage[]) => {
    if (msgs.length === 0) return "Privatna poruka";
    const messageWithSubject = msgs
      .slice()
      .reverse()
      .find(msg => msg.subject);
    
    return messageWithSubject?.subject || msgs[0]?.subject || "Privatna poruka";
  }, []);

  // Join a conversation
  const joinConversation = useCallback(async (userId: string, urlSubject?: string) => {
    if (!socket || !session?.user?.id) return;
    

    if (window.location.search) {
      router.replace("/messages", { scroll: false });
    }
    
    setSelectedUserId(userId);
    
    if (!otherUsers.has(userId)) {
      await fetchUserData(userId);
    }
    
    const conversationId = [session.user.id, userId].sort().join("-");
    socket.emit("join_conversation", conversationId);

    socket.emit("mark_read", { conversationId });
    
    // Clear current messages while loading new ones
    setMessages([]);
    
    if (urlSubject && !conversations.some(c => c.otherUser._id === userId)) {
      setSubject(urlSubject);
    }
  }, [socket, session?.user?.id, router, otherUsers, fetchUserData, conversations]);

  useEffect(() => {
    if (!session?.user?.id || !socket) return;

    const withUserId = searchParams.get("with");
    const subjectParam = searchParams.get("subject");


    if (withUserId && withUserId !== selectedUserId) {
      const decodedSubject = subjectParam ? decodeURIComponent(subjectParam) : undefined;
      
      // Join the conversation from URL
      joinConversation(withUserId, decodedSubject);
    }
  }, [searchParams, session?.user?.id, socket, joinConversation]);

  // Send message
  const sendMessage = useCallback(() => {
    if (!newMessage.trim() || !selectedUserId || !session?.user?.id || !socket) return;

    const tempId = `temp_${Date.now()}`;
    const conversationId = [session.user.id, selectedUserId].sort().join("-");

    const optimistic: ClientMessage = {
      _id: tempId,
      sender: { _id: session.user.id, name: session.user.name },
      receiver: { 
        _id: selectedUserId, 
        name: otherUsers.get(selectedUserId)?.name || "Korisnik" 
      },
      content: newMessage.trim(),
      subject: subject, 
      createdAt: new Date().toISOString(),
      isRead: false,
      conversationId,
      status: "sending",
    };

    setMessages(prev => [...prev, optimistic]);
    setNewMessage("");

    socket.emit("send_message", {
      receiverId: selectedUserId,
      content: optimistic.content,
      subject: optimistic.subject, 
      conversationId,
    });
  }, [newMessage, selectedUserId, session, subject, otherUsers, socket]);

  const handleUserClick = useCallback((userId: string) => {
    joinConversation(userId);
  }, [joinConversation]);


  useEffect(() => {
    if (!socket || !session?.user?.id) return;

    loadConversations();

    const handleRecentMessages = (msgs: ClientMessage[]) => {
      setMessages(msgs.map(m => ({ ...m, status: "sent" })));
      
      if (msgs.length > 0) {
        const conversationSubject = getConversationSubject(msgs);
        setSubject(conversationSubject);
      }
    };

    const handleNewMessage = (msg: ClientMessage) => {
      if (!selectedUserId) return;
      
      const currentConversationId = [session.user.id, selectedUserId].sort().join("-");
      if (msg.conversationId !== currentConversationId) {
        return;
      }

      setMessages(prev => {
        const idx = prev.findIndex(m => m.status === "sending" && m.content === msg.content);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = { ...msg, status: "sent" };
          return updated;
        }
        if (!prev.some(m => m._id === msg._id)) return [...prev, { ...msg, status: "sent" }];
        return prev;
      });

      if (msg.subject && msg.subject !== "Privatna poruka") {
        setSubject(msg.subject);
      }

      if (msg.sender._id !== session.user.id) {
        socket.emit("mark_read", { conversationId: currentConversationId });
      }
      
      loadConversations();
    };

    const handleGlobalUnread = () => {
      loadConversations();
    };

    socket.on("recent_messages", handleRecentMessages);
    socket.on("new_message", handleNewMessage);
    socket.on("global_unread_update", handleGlobalUnread);

    return () => {
      socket.off("recent_messages", handleRecentMessages);
      socket.off("new_message", handleNewMessage);
      socket.off("global_unread_update", handleGlobalUnread);
    };
  }, [socket, session?.user?.id, selectedUserId, loadConversations, getConversationSubject]);

  useEffect(() => {
    messagesContainerRef.current?.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  // Get all conversations 
  const getAllConversations = useCallback(() => {
    const allConversations = [...conversations];
    
    const urlUserId = searchParams.get("with");
    if (urlUserId && selectedUserId === urlUserId && !allConversations.some(c => c.otherUser._id === urlUserId)) {
      const existingUser = otherUsers.get(urlUserId);
      if (existingUser) {
        const urlSubject = searchParams.get("subject");
        const decodedSubject = urlSubject ? decodeURIComponent(urlSubject) : "Privatna poruka";
        
        allConversations.unshift({
          conversationId: [session?.user?.id, urlUserId].sort().join('-'),
          lastMessage: {
            _id: '',
            content: 'Započnite razgovor...',
            createdAt: new Date().toISOString(),
            sender: session?.user?.id || '',
            receiver: urlUserId,
            isRead: true,
            subject: decodedSubject,
            conversationId: [session?.user?.id, urlUserId].sort().join('-')
          },
          unreadCount: 0,
          otherUser: existingUser
        });
      }
    }
    
    return allConversations;
  }, [conversations, searchParams, selectedUserId, otherUsers, session?.user?.id]);

  const allConversations = getAllConversations();
  const selectedConversation = allConversations.find(c => c.otherUser._id === selectedUserId);

  const getSelectedUserName = () => {
    if (selectedConversation) {
      return selectedConversation.otherUser.name;
    }
    const userFromMap = otherUsers.get(selectedUserId || '');
    if (userFromMap) {
      return userFromMap.name;
    }
    
    if (loadingUser === selectedUserId) {
      return "Učitavanje...";
    }
    
    return "Korisnik";
  };

  const getSelectedUserPhoto = () => {
    if (selectedConversation) {
      return selectedConversation.otherUser.photoUrl || "/user.png";
    }
    
    const userFromMap = otherUsers.get(selectedUserId || '');
    if (userFromMap) {
      return userFromMap.photoUrl || "/user.png";
    }
    
    return "/user.png";
  };

  const isNewConversation = selectedUserId && 
    !conversations.some(c => c.otherUser._id === selectedUserId) && 
    messages.length === 0;

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ height: "calc(100vh - 8rem)" }}>
          <div className="lg:col-span-1 content-bg rounded-xl shadow-sm border flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold text-blue-600">Poruke</h2>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              {allConversations.map(conv => (
                <button
                  key={conv.conversationId}
                  onClick={() => handleUserClick(conv.otherUser._id)}
                  className={`w-full p-4 border-b hover:bg-gray-50 transition text-left ${
                    selectedUserId === conv.otherUser._id ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Image
                        src={conv.otherUser.photoUrl || "/user.png"}
                        alt={conv.otherUser.name}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-blue-600 truncate">
                        {conv.otherUser.name}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">
                        {conv.lastMessage?.content || "Započnite razgovor..."}
                      </p>
                      {conv.lastMessage?.subject && conv.lastMessage.subject !== "Privatna poruka" && (
                        <p className="text-xs text-gray-500 truncate mt-1">
                          {conv.lastMessage.subject}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
              
              {allConversations.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
                  <p>Nema razgovora</p>
                  <p className="text-sm">Pošaljite prvu poruku!</p>
                </div>
              )}
            </div>
          </div>

         
          <div className="lg:col-span-2 content-bg rounded-xl shadow-sm border flex flex-col h-full overflow-hidden">
            {selectedUserId ? (
              <>
                <div className="p-4 border-b flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => {
                        setSelectedUserId(null);
                        router.replace("/messages", { scroll: false });
                      }} 
                      className="lg:hidden text-gray-600"
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <Image
                      src={getSelectedUserPhoto()}
                      alt={getSelectedUserName()}
                      width={40} 
                      height={40} 
                      className="rounded-full"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-blue-600">
                        {getSelectedUserName()}
                        {loadingUser === selectedUserId && (
                          <span className="ml-2 text-sm text-gray-500">(učitavanje...)</span>
                        )}
                      </h3>
                    </div>
                  </div>
                  <div className="pt-1 text-center">
                    <span className="font-semibold text-white bg-blue-600 px-3 py-1 rounded-full text-sm">
                      {subject}
                      {isNewConversation && " (Novi razgovor)"}
                    </span>
                  </div>
                </div>

                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
                        <p>{isNewConversation ? "Započnite novi razgovor!" : "Nema poruka još."}</p>
                        <p className="text-sm mt-2">
                          {isNewConversation 
                            ? `Ovo je početak vaše konverzacije s ${getSelectedUserName()}` 
                            : `Ovo je početak vaše konverzacije s ${getSelectedUserName()}`
                          }
                        </p>
                      </div>
                    </div>
                  ) : messages.map(msg => (
                    <div key={msg._id} className={`flex ${msg.sender._id === session?.user?.id ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${msg.sender._id === session?.user?.id ? "bg-blue-600 text-white" : "bg-white text-blue-600 border"}`}>
                        <p className="break-words">{msg.content}</p>
                        <div className="flex items-center justify-end gap-2 text-xs mt-1">
                          <span className={msg.sender._id === session?.user?.id ? "text-blue-100" : "text-gray-500"}>
                            {new Date(msg.createdAt).toLocaleTimeString("bs-BA", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {msg.sender._id === session?.user?.id && (
                            msg.status === "sending" ? <Clock size={14} className="text-blue-200" /> :
                            msg.isRead ? <Check size={14} className="text-green-400" /> :
                            <Check size={14} className="text-blue-100" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyPress={e => e.key === "Enter" && sendMessage()}
                    placeholder="Napišite poruku..."
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button 
                    onClick={sendMessage} 
                    disabled={!newMessage.trim()} 
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-blue-300"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 text-center">
                <MessageCircle size={64} className="mx-auto mb-4" />
                <p>Odaberite korisnika da započnete razgovor</p>
                <p className="text-sm mt-2">Ili otvorite već postojeći razgovor sa liste</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}