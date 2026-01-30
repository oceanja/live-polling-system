import { useEffect } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket;

export const usePollSocket = (
  onPollUpdate: (data: any) => void,
  onResults: (data: any) => void
) => {
  useEffect(() => {
    socket = io("http://localhost:5001");

    socket.emit("JOIN_POLL");

    socket.on("ACTIVE_POLL", onPollUpdate);
    socket.on("POLL_RESULTS", onResults);

    return () => {
      socket.disconnect();
    };
  }, []);
};