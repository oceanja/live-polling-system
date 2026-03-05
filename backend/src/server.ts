import dotenv from "dotenv";
dotenv.config();

import http from "http";
import { Server } from "socket.io";
import app from "./app";
import { initPollSocket } from "./sockets/poll.socket";
import { initSocket } from "../socket";

const PORT = process.env.PORT || 5001;

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: { origin: "*" },
});

initSocket(io);
initPollSocket(io);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
