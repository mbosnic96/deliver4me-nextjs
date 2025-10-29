'use client';

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { useSocket } from "@/lib/SocketProvider";

interface MessagesIconProps {
  userId: string;
}

export default function MessagesIcon({ userId }: MessagesIconProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const { socket, isConnected } = useSocket();
  const router = useRouter();

  const fetchUnreadCount = useCallback(() => {
    if (!socket || !userId) return;

    socket.emit('get_unread_count', (response: { unreadCount: number }) => {
      setUnreadCount(response.unreadCount || 0);
    });
  }, [socket, userId]);

  useEffect(() => {
    if (!socket || !userId) return;

    const handleGlobalUpdate = (data?: { unreadCount?: number }) => {
      if (data?.unreadCount !== undefined) {
        setUnreadCount(data.unreadCount);
      } else {
        fetchUnreadCount();
      }
    };

    const handleSendMessage = (msg: { receiver: { _id: string } }) => {
      if (msg.receiver._id === userId) {
        setUnreadCount(prev => prev + 1);
      }
    };

    const handleConnect = () => {
      fetchUnreadCount();
    };

    socket.on('global_unread_update', handleGlobalUpdate);
    socket.on('send_message', handleSendMessage);
    socket.on('connect', handleConnect);

    // Initial fetch if already connected
    if (isConnected) fetchUnreadCount();

    return () => {
      socket.off('global_unread_update', handleGlobalUpdate);
      socket.off('send_message', handleSendMessage);
      socket.off('connect', handleConnect);
    };
  }, [socket, userId, isConnected, fetchUnreadCount]);

  return (
     <div className="relative">
    <button
      onClick={() => router.push("/messages")}
      className="relative rounded-full transition-all duration-200 hover:bg-gray-100 md:p-2"
      aria-label={`Poruke ${unreadCount > 0 ? `(${unreadCount} nepročitanih)` : ''}`}
    >
      <MessageCircle 
        size={16} 
        className={unreadCount > 0 ? "text-blue-600" : "text-gray-600"} 
      />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center border-2 border-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
      {!isConnected && (
        <span
          className="absolute -bottom-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full border border-white"
          title="Povezivanje..."
        />
      )}
    </button>
    </div>
  );
}
