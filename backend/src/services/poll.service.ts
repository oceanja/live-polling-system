import { prisma } from "../config/prisma";
import { io } from "../../socket";

export class PollService {
  /* ---------------- CREATE POLL ---------------- */
  static async createPoll(data: {
    question: string;
    options: string[];
    duration: number;
  }) {
    // End any existing active poll
    await prisma.poll.updateMany({
      where: { status: "ACTIVE" },
      data: { status: "ENDED" },
    });

    const poll = await prisma.poll.create({
      data: {
        question: data.question,
        duration: data.duration,
        startedAt: new Date(),
        status: "ACTIVE",
        options: { create: data.options.map((text) => ({ text })) },
      },
      include: { options: true },
    });

    this.startPollTimer(poll.id, poll.duration);

    return poll;
  }

  /* ---------------- TIMER (SERVER ONLY) ---------------- */
  static startPollTimer(pollId: string, duration: number) {
    let remaining = duration;

    const interval = setInterval(async () => {
      remaining -= 1;
      io.emit("TIMER_UPDATE", remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        try {
          await prisma.poll.update({
            where: { id: pollId },
            data: { status: "ENDED" },
          });
          const results = await this.getPollResults(pollId);
          io.emit("POLL_ENDED", results);
        } catch (e) {
          console.error("Auto end poll error", e);
        }
      }
    }, 1000);
  }

  /* ---------------- GET ACTIVE POLL ---------------- */
  static async getActivePoll() {
    const poll = await prisma.poll.findFirst({
      where: { status: "ACTIVE" },
      include: { options: true },
    });

    if (!poll) return null;

    const elapsedSeconds = Math.floor(
      (Date.now() - poll.startedAt.getTime()) / 1000
    );
    const remainingTime = Math.max(poll.duration - elapsedSeconds, 0);

    return { poll, remainingTime };
  }

  /* ---------------- END POLL ---------------- */
  static async endPoll(pollId: string) {
    await prisma.poll.update({
      where: { id: pollId },
      data: { status: "ENDED" },
    });
  }

  /* ---------------- SUBMIT VOTE ---------------- */
  static async submitVote(data: {
    pollId: string;
    optionId: string;
    studentId: string;
  }) {
    const existing = await prisma.vote.findFirst({
      where: { pollId: data.pollId, studentId: data.studentId },
    });
    if (existing) {
      throw Object.assign(new Error("Already voted"), { code: "P2002" });
    }

    await prisma.vote.create({ data });
    return this.getPollResults(data.pollId);
  }

  /* ---------------- GET RESULTS ---------------- */
  static async getPollResults(pollId: string) {
    const totalVotes = await prisma.vote.count({ where: { pollId } });

    const grouped = await prisma.vote.groupBy({
      by: ["optionId"],
      where: { pollId },
      _count: { optionId: true },
    });

    const options = await prisma.option.findMany({ where: { pollId } });

    return options.map((opt) => {
      const found = grouped.find((g) => g.optionId === opt.id);
      const count = found?._count.optionId || 0;
      return {
        optionId: opt.id,
        text: opt.text,
        count,
        percentage:
          totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100),
      };
    });
  }

  /* ---------------- POLL HISTORY ---------------- */
  static async getPollHistory() {
    const polls = await prisma.poll.findMany({
      where: { status: "ENDED" },
      orderBy: { startedAt: "desc" },
    });

    const history = [];
    for (const poll of polls) {
      const results = await this.getPollResults(poll.id);
      history.push({ id: poll.id, question: poll.question, options: results });
    }
    return history;
  }
}
