import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../api/client";
import { socket } from "../../socket";
import { ChunkyButton, popIn, spring, stagger } from "../../ui/playful";
import { TopBar } from "../../components/common";
import { QuestionForm, type QuestionPayload } from "../../components/QuestionForm";
import { ResultBars, type ResultOption } from "../../components/ResultBars";
import { Leaderboard, type LeaderRow } from "../../components/Leaderboard";

type Participant = { id: string; name: string };
type ActivePoll = { id: string; question: string; duration: number; options: { id: string; text: string }[] };
type Report = {
  session: { id: string; title: string; joinCode: string };
  totalQuestions: number;
  leaderboard: LeaderRow[];
  questions: { pollId: string; order: number; question: string; accuracy: number; totalVotes: number }[];
};

export default function TeacherSessionPage() {
  const { id: sessionId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activePoll, setActivePoll] = useState<ActivePoll | null>(null);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [results, setResults] = useState<ResultOption[]>([]);
  const [pollEnded, setPollEnded] = useState(false);
  const [report, setReport] = useState<Report | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    api.get(`/sessions/${sessionId}`).then((r) => {
      setTitle(r.data.session.title);
      setJoinCode(r.data.session.joinCode);
      setParticipants(r.data.participants);
      if (r.data.session.status === "ENDED") {
        api.get(`/sessions/${sessionId}/report`).then((rep) => setReport(rep.data));
      }
    });

    if (!socket.connected) socket.connect();
    socket.emit("JOIN_SESSION", { sessionId });

    socket.on("SESSION_STATE", ({ activePoll, participants }: any) => {
      setParticipants(participants);
      if (activePoll) {
        setActivePoll(activePoll.poll);
        setRemainingTime(activePoll.remainingTime);
        setPollEnded(false);
        setResults([]);
      }
    });
    socket.on("PARTICIPANT_JOINED", (p: Participant) =>
      setParticipants((prev) => (prev.some((x) => x.id === p.id) ? prev : [...prev, p]))
    );
    socket.on("POLL_STARTED", ({ poll, remainingTime }: any) => {
      setActivePoll(poll);
      setRemainingTime(remainingTime);
      setPollEnded(false);
      setResults([]);
    });
    socket.on("TIMER_UPDATE", (t: number) => setRemainingTime(t));
    socket.on("VOTE_UPDATE", ({ results }: any) => setResults(results));
    socket.on("POLL_ENDED", ({ results }: any) => {
      setResults(results);
      setPollEnded(true);
      setRemainingTime(0);
    });
    socket.on("SESSION_ENDED", (rep: Report) => setReport(rep));
    socket.on("SESSION_ERROR", (msg: string) => alert(msg));

    return () => {
      ["SESSION_STATE", "PARTICIPANT_JOINED", "POLL_STARTED", "TIMER_UPDATE", "VOTE_UPDATE", "POLL_ENDED", "SESSION_ENDED", "SESSION_ERROR"].forEach(
        (e) => socket.off(e)
      );
    };
  }, [sessionId]);

  const askQuestion = (payload: QuestionPayload) =>
    socket.emit("START_QUESTION", { sessionId, ...payload });

  const endSession = () => {
    if (confirm("End this session for everyone and show the final report?")) {
      socket.emit("END_SESSION", { sessionId });
    }
  };

  // Bars: use live results, or zero-filled from the active poll's options.
  const displayResults: ResultOption[] =
    results.length > 0
      ? results
      : activePoll
      ? activePoll.options.map((o) => ({ optionId: o.id, text: o.text, count: 0, percentage: 0 }))
      : [];
  const totalVotes = displayResults.reduce((s, o) => s + o.count, 0);
  const low = (remainingTime ?? 0) <= 10 && !pollEnded;

  /* ---------- REPORT ---------- */
  if (report) {
    return (
      <div className="min-h-screen w-full bg-cream p-6">
        <div className="max-w-2xl mx-auto">
          <TopBar subtitle="Teacher" />
          <div className="text-center mb-8">
            <h1 className="font-fredoka font-bold text-charcoal text-4xl">Session report</h1>
            <p className="font-nunito text-charcoal/60 mt-1">
              {report.session.title} · {report.totalQuestions} question{report.totalQuestions !== 1 ? "s" : ""}
            </p>
          </div>

          <h2 className="font-fredoka font-bold text-charcoal text-xl mb-3">Leaderboard</h2>
          <Leaderboard rows={report.leaderboard} />

          {report.questions.length > 0 && (
            <>
              <h2 className="font-fredoka font-bold text-charcoal text-xl mt-8 mb-3">Question breakdown</h2>
              <div className="flex flex-col gap-2.5">
                {report.questions.map((q) => (
                  <div key={q.pollId} className="bg-white rounded-2xl px-4 py-3 flex items-center justify-between" style={{ boxShadow: "0 4px 0 0 #E2E8F0" }}>
                    <span className="font-nunito font-bold text-charcoal truncate mr-3">
                      <span className="text-charcoal/40 mr-2">Q{q.order}</span>{q.question}
                    </span>
                    <span className="font-fredoka font-bold flex-shrink-0" style={{ color: q.accuracy >= 50 ? "#3BB3AA" : "#E85555" }}>
                      {q.accuracy}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="flex justify-center mt-8">
            <ChunkyButton onClick={() => navigate("/teacher")} bg="#45B7D1" shadow="#379FB8">
              ← Back to dashboard
            </ChunkyButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-cream p-6">
      <div className="max-w-2xl mx-auto">
        <TopBar subtitle="Teacher" />

        {/* Session header */}
        <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
          <div>
            <h1 className="font-fredoka font-bold text-charcoal text-2xl">{title}</h1>
            <div className="font-nunito text-charcoal/50 text-sm">{participants.length} student{participants.length !== 1 ? "s" : ""} joined</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center bg-white rounded-2xl px-4 py-2" style={{ boxShadow: "0 4px 0 0 #E2E8F0" }}>
              <div className="font-nunito text-charcoal/40 text-[10px] uppercase tracking-wide">Join code</div>
              <div className="font-fredoka font-bold text-charcoal text-xl tracking-widest">{joinCode}</div>
            </div>
            <button
              onClick={endSession}
              className="font-fredoka font-semibold text-coral border-2 border-coral bg-white rounded-full px-4 py-2 cursor-pointer hover:bg-coral/10 transition-colors text-sm"
            >
              End session
            </button>
          </div>
        </div>

        {/* Participants chips */}
        <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-wrap gap-2 mb-6">
          <AnimatePresence>
            {participants.map((p) => (
              <motion.span
                key={p.id}
                variants={popIn}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={spring}
                className="font-nunito font-bold text-charcoal bg-white rounded-full px-3.5 py-1.5 text-sm"
                style={{ boxShadow: "0 3px 0 0 #E2E8F0" }}
              >
                {p.name}
              </motion.span>
            ))}
          </AnimatePresence>
          {participants.length === 0 && (
            <span className="font-nunito text-charcoal/50">Waiting for students to join with code <b>{joinCode}</b>…</span>
          )}
        </motion.div>

        {/* Live question / results */}
        {activePoll && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="font-fredoka font-bold text-charcoal">Live question</span>
              {remainingTime !== null && (
                <motion.span
                  animate={low ? { scale: [1, 1.12, 1] } : {}}
                  transition={{ duration: 0.8, repeat: low ? Infinity : 0 }}
                  className="font-fredoka font-bold text-white rounded-full px-4 py-1.5"
                  style={{ background: pollEnded ? "#4ECDC4" : low ? "#FF6B6B" : "#45B7D1" }}
                >
                  {pollEnded ? "Ended" : `${remainingTime}s`}
                </motion.span>
              )}
            </div>
            <div className="bg-charcoal text-white font-fredoka font-medium text-xl rounded-2xl px-5 py-4 mb-3">
              {activePoll.question}
            </div>
            <div className="font-nunito font-semibold text-charcoal/60 mb-3">
              <span className="text-mint font-fredoka font-bold text-lg">{totalVotes}</span> response{totalVotes !== 1 ? "s" : ""}
            </div>
            <ResultBars results={displayResults} reveal={pollEnded} />
          </div>
        )}

        {/* Ask form: shown in lobby (no poll) or after a poll ends */}
        {(!activePoll || pollEnded) && (
          <div>
            <h2 className="font-fredoka font-bold text-charcoal text-xl mb-3">
              {activePoll ? "Ask the next question" : "Ask your first question"}
            </h2>
            <QuestionForm onSubmit={askQuestion} submitLabel={activePoll ? "Ask next" : "Ask Question"} />
          </div>
        )}
      </div>
    </div>
  );
}
