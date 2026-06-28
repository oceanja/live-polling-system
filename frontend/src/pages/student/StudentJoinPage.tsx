import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { api, apiError } from "../../api/client";
import { ChunkyButton, popIn } from "../../ui/playful";
import { TopBar } from "../../components/common";

export default function StudentJoinPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const join = async () => {
    if (!code.trim()) return setError("Enter the join code from your teacher");
    setLoading(true);
    setError("");
    try {
      const r = await api.post("/sessions/join", { joinCode: code.trim().toUpperCase() });
      navigate(`/student/session/${r.data.id}`);
    } catch (err) {
      setError(apiError(err, "Could not join session"));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-cream p-6">
      <div className="max-w-md mx-auto">
        <TopBar subtitle="Student" />

        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          className="text-center mt-8"
        >
          <motion.h1 variants={popIn} className="font-fredoka font-bold text-charcoal text-4xl mb-2">
            Join a session
          </motion.h1>
          <motion.p variants={popIn} className="font-nunito text-charcoal/60 mb-8">
            Enter the 6-character code your teacher is showing on screen.
          </motion.p>

          <motion.div variants={popIn} className="bg-white rounded-3xl p-7" style={{ boxShadow: "0 8px 0 0 #E2E8F0" }}>
            {error && <div className="bg-coral/10 text-coral font-nunito font-semibold rounded-xl px-4 py-2.5 text-sm mb-4">{error}</div>}
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && join()}
              placeholder="ABC123"
              maxLength={6}
              autoFocus
              className="w-full font-fredoka font-bold text-3xl text-center tracking-[0.4em] text-charcoal bg-cream rounded-2xl px-4 py-4 outline-none border-4 border-transparent focus:border-mint transition-colors placeholder:text-charcoal/20 uppercase"
            />
            <ChunkyButton onClick={join} disabled={loading} bg="#4ECDC4" shadow="#3BB3AA" textColor="#13403C" className="w-full mt-4">
              {loading ? "Joining…" : "Join"}
            </ChunkyButton>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
