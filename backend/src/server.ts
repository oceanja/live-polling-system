import dotenv from "dotenv";
dotenv.config();

import http from "http";
import { Server } from "socket.io";
import app from "./app";
import "./config/redis";
import { initPollSocket } from "./sockets/poll.socket";

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);

export const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

initPollSocket(io);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});