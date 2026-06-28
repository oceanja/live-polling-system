import { prisma } from "../config/prisma";

// Unambiguous characters only (no 0/O/1/I) for easy reading on a projector.
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export class SessionService {
  /* ---------------- CREATE ---------------- */
  static async createSession(teacherId: string, title: string) {
    const t = (title ?? "").trim();
    if (!t) throw new Error("Session title is required");
    const joinCode = await this.uniqueJoinCode();
    return prisma.session.create({ data: { title: t, joinCode, teacherId } });
  }

  private static async uniqueJoinCode(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt++) {
      let code = "";
      for (let i = 0; i < 6; i++) {
        code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
      }
      const existing = await prisma.session.findUnique({ where: { joinCode: code } });
      if (!existing) return code;
    }
    throw new Error("Could not generate a unique join code, please retry");
  }

  /* ---------------- TEACHER LISTING ---------------- */
  static async listTeacherSessions(teacherId: string) {
    const sessions = await prisma.session.findMany({
      where: { teacherId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { polls: true, participants: true } } },
    });
    return sessions.map((s) => ({
      id: s.id,
      title: s.title,
      joinCode: s.joinCode,
      status: s.status,
      createdAt: s.createdAt,
      endedAt: s.endedAt,
      questionCount: s._count.polls,
      participantCount: s._count.participants,
    }));
  }

  /* ---------------- JOIN ---------------- */
  static async joinSession(userId: string, joinCode: string) {
    const code = (joinCode ?? "").trim().toUpperCase();
    const session = await prisma.session.findUnique({ where: { joinCode: code } });
    if (!session) throw new Error("No session found with that code");
    if (session.status === "ENDED") throw new Error("That session has already ended");

    await prisma.participant.upsert({
      where: { sessionId_userId: { sessionId: session.id, userId } },
      update: {},
      create: { sessionId: session.id, userId },
    });
    return session;
  }

  /* ---------------- READ ---------------- */
  static async getSession(id: string) {
    return prisma.session.findUnique({ where: { id } });
  }

  static async getParticipants(sessionId: string) {
    const participants = await prisma.participant.findMany({
      where: { sessionId },
      orderBy: { joinedAt: "asc" },
      include: { user: true },
    });
    return participants.map((p) => ({ id: p.userId, name: p.user.name }));
  }

  static async assertParticipantOrTeacher(sessionId: string, userId: string) {
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) throw new Error("Session not found");
    if (session.teacherId === userId) return session;
    const participant = await prisma.participant.findUnique({
      where: { sessionId_userId: { sessionId, userId } },
    });
    if (!participant) throw new Error("You are not part of this session");
    return session;
  }

  /* ---------------- END ---------------- */
  static async endSession(id: string, teacherId: string) {
    const session = await prisma.session.findUnique({ where: { id } });
    if (!session) throw new Error("Session not found");
    if (session.teacherId !== teacherId) throw new Error("Only the owner can end this session");

    // End any still-active question too.
    await prisma.poll.updateMany({
      where: { sessionId: id, status: "ACTIVE" },
      data: { status: "ENDED" },
    });
    return prisma.session.update({
      where: { id },
      data: { status: "ENDED", endedAt: new Date() },
    });
  }

  /* ---------------- REPORT / LEADERBOARD ---------------- */
  static async getReport(sessionId: string) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        participants: { include: { user: true }, orderBy: { joinedAt: "asc" } },
        polls: {
          orderBy: { order: "asc" },
          include: { options: true, votes: true },
        },
      },
    });
    if (!session) throw new Error("Session not found");

    const totalQuestions = session.polls.length;

    // Per-user tally.
    const tally = new Map<string, { name: string; correct: number; answered: number }>();
    for (const p of session.participants) {
      tally.set(p.userId, { name: p.user.name, correct: 0, answered: 0 });
    }

    const questions = session.polls.map((poll, index) => {
      const correctIds = new Set(poll.options.filter((o) => o.isCorrect).map((o) => o.id));
      const totalVotes = poll.votes.length;
      let correctVotes = 0;

      for (const vote of poll.votes) {
        const isCorrect = correctIds.has(vote.optionId);
        if (isCorrect) correctVotes++;
        // Tally per user (participants who answered; create row if a voter isn't in participants).
        const row =
          tally.get(vote.userId) ?? { name: "Unknown", correct: 0, answered: 0 };
        row.answered++;
        if (isCorrect) row.correct++;
        tally.set(vote.userId, row);
      }

      const optionCounts = poll.options.map((o) => {
        const count = poll.votes.filter((v) => v.optionId === o.id).length;
        return {
          optionId: o.id,
          text: o.text,
          isCorrect: o.isCorrect,
          count,
          percentage: totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100),
        };
      });

      return {
        pollId: poll.id,
        order: index + 1,
        question: poll.question,
        totalVotes,
        correctVotes,
        accuracy: totalVotes === 0 ? 0 : Math.round((correctVotes / totalVotes) * 100),
        options: optionCounts,
      };
    });

    const leaderboard = Array.from(tally.entries())
      .map(([userId, row]) => ({
        userId,
        name: row.name,
        correct: row.correct,
        answered: row.answered,
        totalQuestions,
        accuracy: row.answered === 0 ? 0 : Math.round((row.correct / row.answered) * 100),
      }))
      .sort((a, b) => b.correct - a.correct || b.accuracy - a.accuracy);

    return {
      session: {
        id: session.id,
        title: session.title,
        joinCode: session.joinCode,
        status: session.status,
      },
      totalQuestions,
      leaderboard,
      questions,
    };
  }
}
