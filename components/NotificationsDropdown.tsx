"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation"; 
import { 
  Bell, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Truck,
  Package,
  MessageSquare,
  Calendar,
  Clock,
  Settings,
  Trash2,
  Mail,
  Star,
  ChevronDown
} from "lucide-react";
import { toast } from "react-toastify";

interface Notification {
  _id: string;
  message: string;
  seen: boolean;
  type?: 'info' | 'success' | 'warning' | 'error';
  link?: string;
  createdAt: string;
}

export default function NotificationsDropdown({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);
   const router = useRouter();

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/notifications?userId=${userId}`);
      const data = await res.json();
      setNotifications(data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  };

  const markAsSeen = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/seen`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, seen: true } : n))
      );
    } catch (error) {
      console.error("Failed to mark as seen:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`/api/notifications/read-all`, { 
  method: "PATCH",
  body: JSON.stringify({ userId }),
  headers: { "Content-Type": "application/json" },
});
      setNotifications((prev) => prev.map((n) => ({ ...n, seen: true })));
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      toast.error("Failed to mark all as read");
    }
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      toast.success("Notification deleted");
    } catch (error) {
      console.error("Failed to delete notification:", error);
      toast.error("Failed to delete notification");
    }
  };

  const clearAllNotifications = async () => {
    try {
      await fetch(`/api/notifications/clear`, { 
  method: "DELETE",
  body: JSON.stringify({ userId }),
  headers: { "Content-Type": "application/json" },
});
      setNotifications([]);
      toast.success("All notifications cleared");
    } catch (error) {
      console.error("Failed to clear notifications:", error);
      toast.error("Failed to clear notifications");
    }
  };

  useEffect(() => {
    fetchNotifications();

    
    if (typeof window !== 'undefined') {
      import('socket.io-client').then((module) => {
        const io = module.default;
        
        socketRef.current = io({
          query: { userId },
          transports: ['websocket', 'polling']
        });

        socketRef.current.on("connect", () => {
          console.log("Socket connected");
        });

        socketRef.current.on("new-notification", (notification: Notification) => {
          setNotifications((prev) => [notification, ...prev]);
          
         
          toast(notification.message, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            icon: getNotificationIcon(notification.type),
          });
        });

        socketRef.current.on("disconnect", () => {
          console.log("Socket disconnected");
        });
      }).catch((error) => {
        console.error("Failed to load socket.io-client:", error);
      });
    }

    
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [userId]);

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'warning':
        return <AlertCircle className="text-yellow-500" size={20} />;
      case 'error':
        return <X className="text-red-500" size={20} />;
      case 'shipment':
        return <Truck className="text-blue-500" size={20} />;
      case 'package':
        return <Package className="text-indigo-500" size={20} />;
      case 'message':
        return <MessageSquare className="text-purple-500" size={20} />;
      default:
        return <Info className="text-gray-500" size={20} />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.seen) 
    : notifications;

  const unreadCount = notifications.filter((n) => !n.seen).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        className={`relative p-2 rounded-full transition-all duration-200 ${
          open ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-700'
        }`}
        onClick={() => setOpen(!open)}
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white shadow-xl rounded-xl overflow-hidden z-50 border border-gray-200">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-gray-800">Notifications</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setFilter(filter === 'all' ? 'unread' : 'all')}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center"
              >
                {filter === 'all' ? 'Show unread' : 'Show all'}
                <ChevronDown size={14} className="ml-1" />
              </button>
              <button
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className={`text-xs ${unreadCount === 0 ? 'text-gray-400' : 'text-blue-600 hover:text-blue-800'} font-medium`}
              >
                Mark all as read
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <Bell size={48} className="text-gray-300 mb-2" />
                <p className="text-gray-500 font-medium">No notifications</p>
                <p className="text-gray-400 text-sm mt-1">
                  {filter === 'unread' ? 'You have no unread notifications' : 'Your notification list is empty'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => {
                    markAsSeen(n._id);
                    if (n.link) router.push(n.link); 
                    }}
                  className={`flex items-start p-4 border-b border-gray-100 cursor-pointer transition-colors duration-150 ${
                    !n.seen ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex-shrink-0 mt-1 mr-3">
                    {getNotificationIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.seen ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                      {n.message}
                    </p>
                    <div className="flex items-center mt-1 text-xs text-gray-500">
                      <Clock size={12} className="mr-1" />
                      {formatTime(n.createdAt)}
                    </div>
                  </div>
                  <button
                    onClick={(e) => deleteNotification(n._id, e)}
                    className="ml-2 text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          {filteredNotifications.length > 0 && (
            <div className="flex justify-between items-center p-3 bg-gray-50 border-t border-gray-100">
              <button
                onClick={clearAllNotifications}
                className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center"
              >
                <Trash2 size={14} className="mr-1" />
                Clear all
              </button>
              <button className="text-xs text-gray-600 hover:text-gray-800 font-medium flex items-center">
                <Settings size={14} className="mr-1" />
                Notification settings
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}