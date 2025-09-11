import { Server } from "socket.io";

export const emitNotification = (io: Server | null, userId: string, notification: any) => {
  if (io) {
    io.to(userId).emit("new-notification", notification);
  }
};

export const createNotification = async (userId: string, message: string, link?: string) => {
  try {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, message, link })
    });
    
    if (!response.ok) throw new Error('Failed to create notification');
    return await response.json();
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};