"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";

export default function MessagesIcon({ userId }: { userId: string }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!userId) return;

    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      if (eventSourceRef.current && eventSourceRef.current.readyState !== EventSource.CLOSED) {
        return;
      }

      const es = new EventSource("/api/messages/global-unread-stream");
      eventSourceRef.current = es;

      es.onopen = () => {
        console.log("Global Unread SSE connected");
        setIsConnected(true);
      };

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "unread_count") {
            setUnreadCount(data.unreadCount);
          }
        } catch (e) {}
      };

      es.onerror = () => {
        console.warn("⚠️ Global Unread SSE error, reconnecting in 5s...");
        setIsConnected(false);
        es.close();
        clearTimeout(reconnectTimeout);
        reconnectTimeout = setTimeout(connect, 5000);
      };
    };

    fetch("/api/messages/unread")
      .then(res => res.json())
      .then(data => setUnreadCount(data.unreadCount || 0))
      .catch(err => console.error("Initial unread fetch failed:", err));
    
    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        console.log("Global Unread SSE disconnected on cleanup");
      }
    };
  }, [userId]);

  return (
    <button
      onClick={() => router.push("/messages")}
      className="relative p-2 rounded-full transition-all duration-200 hover:bg-gray-100 text-gray-700 dark:text-gray-300"
      title="Poruke"
    >
      <MessageCircle size={22} />

      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
      
      {!isConnected && (
        <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full" title="Reconnecting..."></span>
      )}
    </button>
  );
}
