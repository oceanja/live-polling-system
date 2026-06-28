import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

// autoConnect is off — pages call socket.connect() once the user is authenticated.
// The auth callback re-reads the token on every (re)connect.
export const socket: Socket = io(SOCKET_URL, {
  transports: ["websocket"],
  autoConnect: false,
  auth: (cb) => cb({ token: localStorage.getItem("token") || "" }),
});
