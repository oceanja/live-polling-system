import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../api/client";
import { socket } from "../../socket";
import { useAuth } from "../../auth/AuthContext";
import { answerColor, ChunkyButton, popIn, spring, stagger } from "../../ui/playful";
import { TopBar } from "../../components/common";
import { ResultBars, type ResultOption } from "../../components/ResultBars";
import { Leaderboard, type LeaderRow } from "../../components/Leaderboard";

type ActivePoll = { id: string; question: string; duration: number; options: { id: string; text: string }[] };
type Report = {
  session: { title: string };
  totalQuestions: number;
  leaderboard: LeaderRow[];
};

export default function StudentSessionPage() {
  const { id: sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [activePoll, setActivePoll] = useState<ActivePoll | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<ResultOption[]>([]);
  const [pollEnded, setPollEnded] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [score, setScore] = useState({ correct: 0, answered: 0 });
  const pollRef = useRef<ActivePoll | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    api.get(`/sessions/${sessionId}`).then((r) => setTitle(r.data.session.title)).catch(() => {});

    if (!socket.connected) socket.connect();
    socket.emit("JOIN_SESSION", { sessionId });

    const newQuestion = (poll: ActivePoll, remaining: number) => {
      pollRef.current = poll;
      setActivePoll(poll);
      setRemainingTime(remaining);
      setSubmitted(false);
      setSelectedOptionId(null);
      setResults([]);
      setPollEnded(false);
    };

    socket.on("SESSION_STATE", ({ activePoll }: any) => {
      if (activePoll && activePoll.remainingTime > 0) newQuestion(activePoll.poll, activePoll.remainingTime);
    });
    socket.on("POLL_STARTED", ({ poll, remainingTime }: any) => newQuestion(poll, remainingTime));
    socket.on("TIMER_UPDATE", (t: number) => setRemainingTime(t));
    socket.on("VOTE_UPDATE", ({ results }: any) => setResults(results));
    socket.on("POLL_ENDED", ({ results }: any) => {
      setResults(results);
      setPollEnded(true);
      setRemainingTime(0);
      // Update running score using the freshest selection.
      setSelectedOptionId((sel) => {
        const correct = results.find((o: ResultOption) => o.isCorrect);
        setScore((prev) => ({
          correct: prev.correct + (sel && correct?.optionId === sel ? 1 : 0),
          answered: prev.answered + (sel ? 1 : 0),
        }));
        return sel;
      });
    });
    socket.on("SESSION_ENDED", (rep: Report) => setReport(rep));
    socket.on("SESSION_ERROR", (msg: string) => alert(msg));

    return () => {
      ["SESSION_STATE", "POLL_STARTED", "TIMER_UPDATE", "VOTE_UPDATE", "POLL_ENDED", "SESSION_ENDED", "SESSION_ERROR"].forEach((e) =>
        socket.off(e)
      );
    };
  }, [sessionId]);

  const answer = (optionId: string) => {
    if (submitted || pollEnded || !pollRef.current) return;
    setSelectedOptionId(optionId);
    setSubmitted(true);
    socket.emit("SUBMIT_VOTE", { pollId: pollRef.current.id, optionId });
  };

  /* ---------- SESSION ENDED: scorecard ---------- */
  if (report) {
    const myRow = report.leaderboard.find((r) => r.userId === user?.id);
    const rank = report.leaderboard.findIndex((r) => r.userId === user?.id) + 1;
    return (
      <div className="min-h-screen w-full bg-cream p-6">
        <div className="max-w-md mx-auto">
          <TopBar subtitle="Student" />
          <div className="text-center mb-6">
            <h1 className="font-fredoka font-bold text-charcoal text-4xl">Your scorecard</h1>
            <p className="font-nunito text-charcoal/60 mt-1">{report.session.title}</p>
          </div>

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={spring}
            className="bg-white rounded-3xl p-7 text-center mb-8"
            style={{ boxShadow: "0 8px 0 0 #4ECDC4" }}
          >
            <div className="font-fredoka font-bold text-6xl text-mint">
              {myRow?.correct ?? 0}
              <span className="text-charcoal/30 text-3xl">/{report.totalQuestions}</span>
            </div>
            <div className="font-nunito font-bold text-charcoal/60 mt-2">
              correct{rank > 0 && <> · ranked <span className="text-sky">#{rank}</span></>}
            </div>
          </motion.div>

          <h2 className="font-fredoka font-bold text-charcoal text-xl mb-3">Leaderboard</h2>
          <Leaderboard rows={report.leaderboard} highlightUserId={user?.id} />

          <div className="flex justify-center mt-8">
            <ChunkyButton onClick={() => navigate("/student")} bg="#45B7D1" shadow="#379FB8">
              ← Join another session
            </ChunkyButton>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- LOBBY ---------- */
  if (!activePoll) {
    return (
      <div className="min-h-screen w-full bg-cream flex flex-col items-center justify-center p-6 text-center">
        <TopBar subtitle="Student" />
        <div className="flex gap-2 mb-6">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut", delay: i * 0.15 }}
              className="w-3.5 h-3.5 rounded-full bg-mint"
            />
          ))}
        </div>
        <h1 className="font-fredoka font-bold text-charcoal text-3xl mb-2">You're in!</h1>
        <p className="font-nunito text-charcoal/60 text-lg">
          {title ? <>"{title}" · </> : null}waiting for the first question…
        </p>
      </div>
    );
  }

  const correctOption = results.find((o) => o.isCorrect);
  const gotItRight = selectedOptionId != null && correctOption?.optionId === selectedOptionId;
  const low = remainingTime <= 10 && !pollEnded;

  return (
    <div className="min-h-screen w-full bg-cream p-6">
      <div className="max-w-xl mx-auto">
        <TopBar subtitle="Student" />

        <div className="flex items-center justify-between mb-4">
          <span className="font-fredoka font-bold text-charcoal">
            Score: <span className="text-mint">{score.correct}</span>
            <span className="text-charcoal/40">/{score.answered}</span>
          </span>
          {!pollEnded ? (
            <motion.span
              animate={low ? { scale: [1, 1.15, 1] } : {}}
              transition={{ duration: 0.8, repeat: low ? Infinity : 0 }}
              className="font-fredoka font-bold text-white rounded-full px-4 py-1.5"
              style={{ background: low ? "#FF6B6B" : "#45B7D1" }}
            >
              {remainingTime}s
            </motion.span>
          ) : (
            <span className="font-fredoka font-bold text-mint">Time's up</span>
          )}
        </div>

        <div className="bg-charcoal text-white font-fredoka font-medium text-xl rounded-2xl px-5 py-4 mb-5">
          {activePoll.question}
        </div>

        <AnimatePresence mode="wait">
          {pollEnded ? (
            <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {correctOption && (
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={spring}
                  className="rounded-2xl px-5 py-4 mb-5 text-white font-fredoka font-bold text-center text-lg"
                  style={{ background: !selectedOptionId ? "#94A3B8" : gotItRight ? "#4ECDC4" : "#FF6B6B" }}
                >
                  {!selectedOptionId ? "You didn't answer" : gotItRight ? "Correct!" : "Not quite"}
                </motion.div>
              )}
              <div className="bg-white rounded-3xl p-6" style={{ boxShadow: "0 8px 0 0 #E2E8F0" }}>
                <ResultBars results={results} selectedOptionId={selectedOptionId} reveal />
              </div>
            </motion.div>
          ) : submitted ? (
            <motion.div
              key="locked"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={spring}
              className="bg-white rounded-3xl p-8 text-center"
              style={{ boxShadow: "0 8px 0 0 #E2E8F0" }}
            >
              <h3 className="font-fredoka font-bold text-2xl text-charcoal mb-1">Answer locked in</h3>
              <p className="font-nunito text-charcoal/60">Results appear when the timer ends.</p>
            </motion.div>
          ) : (
            <motion.div key="options" variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activePoll.options.map((option, index) => {
                const c = answerColor(index);
                return (
                  <motion.button
                    key={option.id}
                    variants={popIn}
                    onClick={() => answer(option.id)}
                    whileHover={{ scale: 1.03, y: -3 }}
                    whileTap={{ scale: 0.96, y: 3 }}
                    transition={spring}
                    className="flex items-center gap-4 rounded-2xl p-5 text-left cursor-pointer border-0 min-h-[88px]"
                    style={{ background: c.bg, color: c.text, boxShadow: `0 6px 0 0 ${c.shadow}` }}
                  >
                    <span className="flex-shrink-0 w-11 h-11 rounded-xl bg-white/35 font-fredoka font-bold text-xl flex items-center justify-center">
                      {c.letter}
                    </span>
                    <span className="font-nunito font-bold text-lg">{option.text}</span>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
