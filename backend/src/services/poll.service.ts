import { prisma } from "../config/prisma";
import { io } from "../socket";

const MIN_DURATION = 5;
const MAX_DURATION = 60;

export class PollService {
  // One countdown per LIVE session. sessionId -> interval handle.
  private static timers = new Map<string, NodeJS.Timeout>();

  static room(sessionId: string) {
    return `session:${sessionId}`;
  }

  /* ---------------- START A QUESTION (teacher, live) ---------------- */
  static async startQuestion(
    sessionId: string,
    data: { question: string; options: Array<{ text: string; isCorrect?: boolean }>; duration: number }
  ) {
    const question = (data.question ?? "").trim();
    const options = (data.options ?? [])
      .map((o) => ({ text: (o?.text ?? "").trim(), isCorrect: Boolean(o?.isCorrect) }))
      .filter((o) => o.text.length > 0);

    if (!question) throw new Error("Question is required");
    if (options.length < 2) throw new Error("At least two options are required");
    const duration = this.clampDuration(data.duration);

    // Close any question still open in this session, then clear its timer.
    this.clearTimer(sessionId);
    await prisma.poll.updateMany({
      where: { sessionId, status: "ACTIVE" },
      data: { status: "ENDED" },
    });

    const order = await prisma.poll.count({ where: { sessionId } });
    const poll = await prisma.poll.create({
      data: {
        question,
        duration,
        order,
        startedAt: new Date(),
        status: "ACTIVE",
        sessionId,
        options: { create: options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })) },
      },
      include: { options: true },
    });

    // First question flips the session from LOBBY to LIVE.
    await prisma.session.update({ where: { id: sessionId }, data: { status: "LIVE" } });

    this.startTimer(sessionId, poll.id, poll.duration);
    return this.sanitizePoll(poll);
  }

  /* ---------------- TIMER (per session) ---------------- */
  static startTimer(sessionId: string, pollId: string, remainingSeconds: number) {
    this.clearTimer(sessionId);
    if (remainingSeconds <= 0) {
      void this.finishPoll(sessionId, pollId);
      return;
    }
    let remaining = remainingSeconds;
    const interval = setInterval(async () => {
      remaining -= 1;
      io.to(this.room(sessionId)).emit("TIMER_UPDATE", remaining);
      if (remaining <= 0) {
        this.clearTimer(sessionId);
        await this.finishPoll(sessionId, pollId);
      }
    }, 1000);
    this.timers.set(sessionId, interval);
  }

  private static async finishPoll(sessionId: string, pollId: string) {
    try {
      await prisma.poll.update({ where: { id: pollId }, data: { status: "ENDED" } });
      const results = await this.getPollResults(pollId, true); // reveal correctness
      io.to(this.room(sessionId)).emit("POLL_ENDED", { pollId, results });
    } catch (e) {
      console.error("finishPoll error", e);
    }
  }

  private static clearTimer(sessionId: string) {
    const t = this.timers.get(sessionId);
    if (t) {
      clearInterval(t);
      this.timers.delete(sessionId);
    }
  }

  static clearSessionTimer(sessionId: string) {
    this.clearTimer(sessionId);
  }

  /** Re-arm timers for any ACTIVE polls after a server restart. */
  static async resumeActivePolls() {
    const active = await prisma.poll.findMany({ where: { status: "ACTIVE" } });
    for (const poll of active) {
      const elapsed = Math.floor((Date.now() - poll.startedAt.getTime()) / 1000);
      const remaining = Math.max(poll.duration - elapsed, 0);
      if (remaining <= 0) await this.finishPoll(poll.sessionId, poll.id);
      else this.startTimer(poll.sessionId, poll.id, remaining);
    }
    if (active.length) console.log(`Resumed ${active.length} active poll(s)`);
  }

  /* ---------------- CURRENT ACTIVE POLL (join/refresh) ---------------- */
  static async getActivePoll(sessionId: string) {
    const poll = await prisma.poll.findFirst({
      where: { sessionId, status: "ACTIVE" },
      include: { options: true },
    });
    if (!poll) return null;
    const elapsed = Math.floor((Date.now() - poll.startedAt.getTime()) / 1000);
    const remainingTime = Math.max(poll.duration - elapsed, 0);
    return { poll: this.sanitizePoll(poll), remainingTime };
  }

  /* ---------------- VOTE (student) ---------------- */
  static async submitVote(data: { pollId: string; optionId: string; userId: string }) {
    const poll = await prisma.poll.findUnique({ where: { id: data.pollId } });
    if (!poll || poll.status !== "ACTIVE") throw new Error("This question is not active");

    const existing = await prisma.vote.findUnique({
      where: { pollId_userId: { pollId: data.pollId, userId: data.userId } },
    });
    if (existing) throw Object.assign(new Error("Already voted"), { code: "P2002" });

    await prisma.vote.create({
      data: { pollId: data.pollId, optionId: data.optionId, userId: data.userId },
    });
    return { sessionId: poll.sessionId, results: await this.getPollResults(data.pollId, false) };
  }

  /* ---------------- RESULTS ---------------- */
  static async getPollResults(pollId: string, reveal = false) {
    const [grouped, options] = await Promise.all([
      prisma.vote.groupBy({ by: ["optionId"], where: { pollId }, _count: { optionId: true } }),
      prisma.option.findMany({ where: { pollId } }),
    ]);
    const totalVotes = grouped.reduce((s, g) => s + g._count.optionId, 0);

    return options.map((opt) => {
      const count = grouped.find((g) => g.optionId === opt.id)?._count.optionId || 0;
      return {
        optionId: opt.id,
        text: opt.text,
        count,
        percentage: totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100),
        ...(reveal ? { isCorrect: opt.isCorrect } : {}),
      };
    });
  }

  /* ---------------- HELPERS ---------------- */
  private static sanitizePoll(poll: any) {
    return {
      id: poll.id,
      question: poll.question,
      duration: poll.duration,
      order: poll.order,
      options: poll.options.map((o: any) => ({ id: o.id, text: o.text })),
    };
  }

  private static clampDuration(duration: number) {
    const d = Number(duration);
    if (!Number.isFinite(d)) return MAX_DURATION;
    return Math.min(Math.max(Math.floor(d), MIN_DURATION), MAX_DURATION);
  }
}
