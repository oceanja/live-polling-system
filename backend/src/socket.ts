import { Server } from "socket.io";

export let io: Server;

export const initSocket = (server: Server) => {
  io = server;
};