import { Server, Socket } from "socket.io";
import { AuthService, TokenPayload } from "../services/auth.service";
import { PollService } from "../services/poll.service";
import { SessionService } from "../services/session.service";

export const initPollSocket = (io: Server) => {
  // ---- Handshake auth: every socket must carry a valid JWT ----
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) return next(new Error("Not authenticated"));
      (socket.data as any).user = AuthService.verify(token);
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const user: TokenPayload = (socket.data as any).user;

    /* ---- Join a session room (teacher or participant) ---- */
    socket.on("JOIN_SESSION", async ({ sessionId }: { sessionId: string }) => {
      try {
        await SessionService.assertParticipantOrTeacher(sessionId, user.id);
        socket.join(PollService.room(sessionId));
        (socket.data as any).sessionId = sessionId;

        const activePoll = await PollService.getActivePoll(sessionId);
        const participants = await SessionService.getParticipants(sessionId);
        socket.emit("SESSION_STATE", { activePoll, participants });

        // Let the teacher's lobby see this student pop in.
        if (user.role === "STUDENT") {
          const me = await AuthService.getById(user.id);
          socket.to(PollService.room(sessionId)).emit("PARTICIPANT_JOINED", {
            id: user.id,
            name: me?.name ?? "Student",
          });
        }
      } catch (e: any) {
        socket.emit("SESSION_ERROR", e.message);
      }
    });

    /* ---- Teacher asks a question ---- */
    socket.on(
      "START_QUESTION",
      async (payload: { sessionId: string; question: string; options: any[]; duration: number }) => {
        try {
          if (user.role !== "TEACHER") throw new Error("Only a teacher can ask questions");
          const session = await SessionService.getSession(payload.sessionId);
          if (!session || session.teacherId !== user.id) throw new Error("Not your session");

          const poll = await PollService.startQuestion(payload.sessionId, {
            question: payload.question,
            options: payload.options,
            duration: payload.duration,
          });
          io.to(PollService.room(payload.sessionId)).emit("POLL_STARTED", {
            poll,
            remainingTime: poll.duration,
          });
        } catch (e: any) {
          socket.emit("SESSION_ERROR", e.message);
        }
      }
    );

    /* ---- Student submits an answer ---- */
    socket.on("SUBMIT_VOTE", async ({ pollId, optionId }: { pollId: string; optionId: string }) => {
      try {
        const { sessionId, results } = await PollService.submitVote({
          pollId,
          optionId,
          userId: user.id,
        });
        io.to(PollService.room(sessionId)).emit("VOTE_UPDATE", { pollId, results });
      } catch (e: any) {
        if (e?.code !== "P2002") socket.emit("SESSION_ERROR", e.message);
      }
    });

    /* ---- Teacher ends the whole session ---- */
    socket.on("END_SESSION", async ({ sessionId }: { sessionId: string }) => {
      try {
        if (user.role !== "TEACHER") throw new Error("Only a teacher can end a session");
        await SessionService.endSession(sessionId, user.id);
        PollService.clearSessionTimer(sessionId);
        const report = await SessionService.getReport(sessionId);
        io.to(PollService.room(sessionId)).emit("SESSION_ENDED", report);
      } catch (e: any) {
        socket.emit("SESSION_ERROR", e.message);
      }
    });

    socket.on("disconnect", () => {});
  });
};
