import { Server, Socket } from "socket.io";
import { PollService } from "../services/poll.service";

export const initPollSocket = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log("Socket connected:", socket.id);

    // Teacher / Student joins
    socket.on("JOIN_POLL", async () => {
      const data = await PollService.getActivePoll();
      socket.emit("ACTIVE_POLL", data);
    });

    // Teacher starts poll
    socket.on("CREATE_POLL", async (data) => {
      try {
        const poll = await PollService.createPoll(data);
        io.emit("POLL_STARTED", {
          poll,
          remainingTime: poll.duration,
        });
      } catch (err: any) {
        socket.emit("ERROR", err.message);
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });
};