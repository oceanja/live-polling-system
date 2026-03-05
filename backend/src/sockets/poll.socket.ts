import { Server, Socket } from "socket.io";
import { PollService } from "../services/poll.service";

export const initPollSocket = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("JOIN_POLL", async () => {
      try {
        const data = await PollService.getActivePoll();
        socket.emit("ACTIVE_POLL", data);
      } catch (e) {
        console.error("JOIN_POLL error", e);
      }
    });

    socket.on("CREATE_POLL", async (data) => {
      try {
        const poll = await PollService.createPoll(data);
        io.emit("POLL_STARTED", { poll, remainingTime: poll.duration });
      } catch (err: any) {
        socket.emit("ERROR", err.message);
      }
    });

    socket.on("SUBMIT_VOTE", async (data) => {
      try {
        const results = await PollService.submitVote(data);
        io.emit("VOTE_UPDATE", results);
      } catch (e: any) {
        if (e?.code !== "P2002") console.error("SUBMIT_VOTE error", e);
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });
};
