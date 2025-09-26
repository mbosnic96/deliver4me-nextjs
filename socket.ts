"use client";

import { io, Socket } from "socket.io-client";

export let socket: Socket;

export const initSocket = (userId: string) => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      auth: { userId },
    });

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));
  }

  return socket;
};
