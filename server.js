import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer, {
    cors: { origin: "*" }, 
  });

  // save io globally
  global.io = io;

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    const { userId } = socket.handshake.auth;
    if (userId) socket.join(userId);

    socket.on("disconnect", () => console.log("Socket disconnected:", socket.id));
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
