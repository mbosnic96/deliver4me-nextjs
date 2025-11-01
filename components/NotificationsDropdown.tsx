"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Bell, X, CheckCircle, AlertCircle, Info, Truck,
  Package, MessageSquare, Clock, Trash2, ChevronDown
} from "lucide-react";
import { toast } from "react-toastify";

interface Notification {
  _id: string;
  message: string;
  seen: boolean;
  type?: 'info' | 'success' | 'warning' | 'error' | 'shipment' | 'package' | 'message';
  link?: string;
  createdAt: string;
}

export default function NotificationsDropdown({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const isInitializing = useRef(false);

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
  };

  const subscribeToPush = async (registration: ServiceWorkerRegistration) => {
    try {
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.error("VAPID public key not found in environment variables");
        return null;
      }

      const convertedKey = urlBase64ToUint8Array(vapidPublicKey);

      // Check for existing subscription
      let subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
      }

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey
      });


      // Send subscription to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription, userId })
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      return subscription;
    } catch (err) {
      console.error("Push subscription failed:", err);
      toast.error("Neuspješna prijava za notifikacije");
      return null;
    }
  };

  const registerServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) {
      return null;
    }

    try {
      // Check if already registered
      const existingRegistration = await navigator.serviceWorker.getRegistration('/');
      
      if (existingRegistration) {
        if (existingRegistration.installing) {
          await new Promise((resolve) => {
            existingRegistration.installing!.addEventListener('statechange', function() {
              if (this.state === 'activated') {
                resolve(true);
              }
            });
          });
        } else if (existingRegistration.waiting) {
          existingRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        return existingRegistration;
      }

      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
+

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      return registration;
    } catch (err) {
      console.error("Service Worker registration failed:", err);
      toast.error("Neuspješna registracija service worker-a");
      return null;
    }
  };

  const initNotifications = async () => {
    if (isInitializing.current) {
      return;
    }

    isInitializing.current = true;

    try {
      if (!('Notification' in window)) {
        toast.info("Vaš pretraživač ne podržava notifikacije");
        return;
      }

      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission !== "granted") {
        toast.info("Dozvole za notifikacije nisu odobrene");
        return;
      }

      // Register service worker
      const registration = await registerServiceWorker();
      if (!registration) {
        console.error("Failed to register service worker");
        return;
      }

      // Subscribe to push notifications
      await subscribeToPush(registration);

    } catch (err) {
      console.error("Error initializing notifications:", err);
      toast.error("Greška pri inicijalizaciji notifikacija");
    } finally {
      isInitializing.current = false;
    }
  };

  const showBrowserNotification = (notification: Notification) => {
    if (notificationPermission !== "granted") return;

    try {
      const n = new Notification("Nova obavijest!", {
        body: notification.message,
        icon: "/logo.png",
        badge: "/logo.png",
        tag: notification._id,
        data: { url: notification.link || '/notification' }
      });

      n.onclick = () => {
        if (notification.link) {
          router.push(notification.link);
        }
        n.close();
      };

      setTimeout(() => n.close(), 5000);
    } catch (err) {
      console.error("Error showing browser notification:", err);
    }
  };

  const fetchNotifications = async () => {
    if (!userId) return;
    
    try {
      const res = await fetch(`/api/notifications?userId=${userId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsSeen = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/seen`, { method: "PATCH" });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, seen: true } : n));
    } catch (err) {
      console.error("Error marking as seen:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`/api/notifications/read-all`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
      setNotifications(prev => prev.map(n => ({ ...n, seen: true })));
      toast.success("Sve obavijesti označene kao pročitane");
    } catch (err) {
      console.error("Error marking all as read:", err);
      toast.error("Neuspješno označavanje kao pročitano");
    }
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      setNotifications(prev => prev.filter(n => n._id !== id));
      toast.success("Notification deleted");
    } catch (err) {
      console.error("Error deleting notification:", err);
      toast.error("Neuspješno brisanje obavijesti");
    }
  };

  const clearAllNotifications = async () => {
    try {
      await fetch(`/api/notifications/clear`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
      setNotifications([]);
      toast.success("All notifications cleared");
    } catch (err) {
      console.error("Error clearing notifications:", err);
      toast.error("Neuspješno brisanje obavijesti");
    }
  };

  // SSE for real-time notifications
  useEffect(() => {
    if (!userId) return;

    const es = new EventSource(`/api/notifications/stream?userId=${userId}`);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (Array.isArray(data)) {
          setNotifications(data);
        } else {
          setNotifications((prev) => [data, ...prev]);
          showBrowserNotification(data); 
        }
      } catch (err) {
        console.error("Error parsing SSE data:", err);
      }
    };

    es.onerror = () => {
      console.log("SSE connection error, will retry...");
      es.close();
    };

    return () => {
      es.close();
    };
  }, [userId, notificationPermission, router]);

  // Service worker message handler
  useEffect(() => {
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NAVIGATE_TO') {
        router.push(event.data.url);
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, [router]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Initialize notifications when component mounts
  useEffect(() => {
    if (userId && !isInitializing.current) {
      // Small delay to ensure page is fully loaded
      const timer = setTimeout(() => {
        initNotifications();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [userId]);

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.seen)
    : notifications;

  const unreadCount = notifications.filter(n => !n.seen).length;

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="text-green-500" size={20} />;
      case 'warning': return <AlertCircle className="text-yellow-500" size={20} />;
      case 'error': return <X className="text-red-500" size={20} />;
      case 'shipment': return <Truck className="text-blue-500" size={20} />;
      case 'package': return <Package className="text-indigo-500" size={20} />;
      case 'message': return <MessageSquare className="text-purple-500" size={20} />;
      default: return <Info className="text-gray-500" size={20} />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffInHours < 1) return 'Sad';
    if (diffInHours < 24) return `prije ${diffInHours}h`;
    if (diffInHours < 168) return `prije ${Math.floor(diffInHours / 24)}d`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className={`relative md:p-2 rounded-full transition-all duration-200 ${
          open ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'
        }`}
        onClick={() => {
          setOpen(!open);
          if (!open) fetchNotifications(); 
        }}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 text-xs bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute -right-[130px] md:mt-2 md:bottom-auto bottom-full mb-2 w-96 bg-white shadow-xl rounded-xl overflow-hidden z-50 border border-gray-200">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-gray-800">Obavijesti</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setFilter(filter === 'all' ? 'unread' : 'all')}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center"
              >
                {filter === 'all' ? 'Show unread' : 'Show all'}
                <ChevronDown size={14} className="ml-1" />
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Označi sve kao pročitano
                </button>
              )}
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto min-h-[200px]">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <Bell size={48} className="text-gray-300 mb-2" />
                <p className="text-gray-500 font-medium">Nema obavijesti</p>
                <p className="text-gray-400 text-sm mt-1">
                  {filter === 'unread' ? 'You have no unread notifications' : 'Your notification list is empty'}
                </p>
              </div>
            ) : (
              filteredNotifications.map(n => (
                <div
                  key={n._id}
                  onClick={() => {
                    if (!n.seen) markAsSeen(n._id);
                    if (n.link) router.push(n.link);
                    setOpen(false);
                  }}
                  className={`flex items-start p-4 border-b border-gray-100 cursor-pointer transition-colors duration-150 ${
                    !n.seen ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex-shrink-0 mt-1 mr-3">{getNotificationIcon(n.type)}</div>
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
            <div className="flex justify-end items-center p-3 bg-gray-50 border-t border-gray-100">
              <button
                onClick={clearAllNotifications}
                className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center"
              >
                <Trash2 size={14} className="mr-1" />
                Briši sve
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}