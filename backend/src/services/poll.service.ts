import { prisma } from "../config/prisma";
import redis from "../config/redis";
import { io } from "../../socket";

const ACTIVE_POLL_KEY = "active_poll";

export class PollService {
  /* ---------------- CREATE POLL ---------------- */

  static async createPoll(data: {
    question: string;
    options: string[];
    duration: number;
  }) {
    const activePollId = await redis.get(ACTIVE_POLL_KEY);
    if (activePollId) {
      throw new Error("A poll is already active");
    }

    const poll = await prisma.poll.create({
      data: {
        question: data.question,
        duration: data.duration,
        startedAt: new Date(),
        options: {
          create: data.options.map((text) => ({ text })),
        },
      },
      include: { options: true },
    });

    await redis.set(ACTIVE_POLL_KEY, poll.id);
    await redis.set(`poll:${poll.id}:startedAt`, poll.startedAt.getTime().toString());
    await redis.set(`poll:${poll.id}:duration`, poll.duration.toString());

    // 🔥 start server-side timer
    this.startPollTimer(poll.id, poll.duration);

    return poll;
  }

  /* ---------------- TIMER (SERVER ONLY) ---------------- */

  static startPollTimer(pollId: string, duration: number) {
    let remaining = duration;

    const interval = setInterval(async () => {
      remaining -= 1;

      // emit timer tick
      io.emit("TIMER_UPDATE", remaining);

      if (remaining <= 0) {
        clearInterval(interval);

        await this.endPoll(pollId);

        const results = await this.getPollResults(pollId);
        io.emit("POLL_ENDED", results);
      }
    }, 1000);
  }

  /* ---------------- GET ACTIVE POLL ---------------- */

  static async getActivePoll() {
    const pollId = await redis.get(ACTIVE_POLL_KEY);
    if (!pollId) return null;

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: { options: true },
    });

    if (!poll) return null;

    const startedAt = Number(await redis.get(`poll:${pollId}:startedAt`));
    const duration = Number(await redis.get(`poll:${pollId}:duration`));

    const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
    const remainingTime = Math.max(duration - elapsedSeconds, 0);

    return {
      poll,
      remainingTime,
    };
  }

  /* ---------------- END POLL ---------------- */

  static async endPoll(pollId: string) {
    await prisma.poll.update({
      where: { id: pollId },
      data: { status: "ENDED" },
    });

    await redis.del(ACTIVE_POLL_KEY);
    await redis.del(`poll:${pollId}:startedAt`);
    await redis.del(`poll:${pollId}:duration`);
  }

  /* ---------------- SUBMIT VOTE ---------------- */

  static async submitVote(data: {
    pollId: string;
    optionId: string;
    studentId: string;
  }) {
    // DB-level protection (unique constraint)
    await prisma.vote.create({
      data,
    });

    const results = await this.getPollResults(data.pollId);

    // 🔥 real-time update
    io.emit("VOTE_UPDATE", results);

    return results;
  }

  /* ---------------- GET RESULTS ---------------- */

  static async getPollResults(pollId: string) {
    const totalVotes = await prisma.vote.count({
      where: { pollId },
    });

    const grouped = await prisma.vote.groupBy({
      by: ["optionId"],
      where: { pollId },
      _count: { optionId: true },
    });

    const options = await prisma.option.findMany({
      where: { pollId },
    });

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
}