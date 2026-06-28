import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { api, apiError } from "../../api/client";
import { ChunkyButton, popIn, spring, stagger } from "../../ui/playful";
import { TopBar } from "../../components/common";

type SessionRow = {
  id: string;
  title: string;
  joinCode: string;
  status: "LOBBY" | "LIVE" | "ENDED";
  questionCount: number;
  participantCount: number;
};

const STATUS_STYLE: Record<string, { bg: string; label: string }> = {
  LOBBY: { bg: "#FFE66D", label: "Lobby" },
  LIVE: { bg: "#4ECDC4", label: "Live" },
  ENDED: { bg: "#E2E8F0", label: "Ended" },
};

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api.get("/sessions").then((r) => setSessions(r.data)).catch(() => {});
  }, []);

  const create = async () => {
    if (!title.trim()) return setError("Give your session a title");
    setCreating(true);
    setError("");
    try {
      const r = await api.post("/sessions", { title: title.trim() });
      navigate(`/teacher/session/${r.data.id}`);
    } catch (err) {
      setError(apiError(err, "Could not create session"));
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-cream p-6">
      <div className="max-w-3xl mx-auto">
        <TopBar subtitle="Teacher" />

        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="font-fredoka font-bold text-charcoal text-4xl mb-2">
          Your sessions
        </motion.h1>
        <p className="font-nunito text-charcoal/60 mb-8">Spin up a session per chapter, then ask questions live.</p>

        {/* Create */}
        <div className="bg-white rounded-3xl p-6 mb-8" style={{ boxShadow: "0 8px 0 0 #E2E8F0" }}>
          {error && <div className="bg-coral/10 text-coral font-nunito font-semibold rounded-xl px-4 py-2.5 text-sm mb-4">{error}</div>}
          <label className="font-fredoka font-bold text-charcoal text-lg">New session</label>
          <div className="flex gap-3 mt-3 flex-wrap">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && create()}
              placeholder="e.g. Chapter 5: Photosynthesis"
              className="flex-1 min-w-[220px] font-nunito font-semibold text-charcoal bg-cream rounded-xl px-4 py-3 outline-none border-[3px] border-transparent focus:border-sky transition-colors placeholder:text-charcoal/30"
            />
            <ChunkyButton onClick={create} disabled={creating} bg="#7C5CFC" shadow="#5b3fd6">
              {creating ? "Creating…" : "+ Create"}
            </ChunkyButton>
          </div>
        </div>

        {/* List */}
        {sessions.length === 0 ? (
          <div className="text-center mt-12">
            <p className="font-nunito text-charcoal/60">No sessions yet — create your first one above.</p>
          </div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-3">
            {sessions.map((s) => {
              const st = STATUS_STYLE[s.status];
              return (
                <motion.button
                  key={s.id}
                  variants={popIn}
                  onClick={() => navigate(`/teacher/session/${s.id}`)}
                  whileHover={{ scale: 1.01, y: -2 }}
                  whileTap={{ scale: 0.99 }}
                  transition={spring}
                  className="text-left bg-white rounded-2xl p-5 cursor-pointer border-0 flex items-center justify-between gap-4"
                  style={{ boxShadow: "0 6px 0 0 #E2E8F0" }}
                >
                  <div className="min-w-0">
                    <div className="font-fredoka font-bold text-charcoal text-lg truncate">{s.title}</div>
                    <div className="font-nunito text-charcoal/50 text-sm mt-0.5">
                      {s.questionCount} question{s.questionCount !== 1 ? "s" : ""} · {s.participantCount} joined
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-fredoka font-bold tracking-widest text-charcoal bg-cream rounded-lg px-3 py-1.5">
                      {s.joinCode}
                    </span>
                    <span className="font-fredoka font-bold text-sm rounded-full px-3 py-1 text-charcoal" style={{ background: st.bg }}>
                      {st.label}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
