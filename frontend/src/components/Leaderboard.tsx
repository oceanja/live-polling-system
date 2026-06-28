import { motion } from "framer-motion";
import { popIn, spring, stagger } from "../ui/playful";

export type LeaderRow = {
  userId: string;
  name: string;
  correct: number;
  answered: number;
  totalQuestions: number;
  accuracy: number;
};

const RANK_COLOR = ["#45B7D1", "#4ECDC4", "#FF6B6B"];

export function Leaderboard({
  rows,
  highlightUserId,
}: {
  rows: LeaderRow[];
  highlightUserId?: string;
}) {
  if (rows.length === 0) {
    return <p className="font-nunito text-charcoal/50 text-center py-6">No participants yet.</p>;
  }
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-2.5">
      {rows.map((row, i) => {
        const me = row.userId === highlightUserId;
        return (
          <motion.div
            key={row.userId}
            variants={popIn}
            transition={spring}
            className="flex items-center gap-3 rounded-2xl px-4 py-3"
            style={{
              background: me ? "#45B7D122" : "#fff",
              boxShadow: me ? "0 4px 0 0 #45B7D1" : "0 4px 0 0 #E2E8F0",
            }}
          >
            <span
              className="w-8 h-8 flex-shrink-0 rounded-lg text-white font-fredoka font-bold flex items-center justify-center"
              style={{ background: RANK_COLOR[i] ?? "#94A3B8" }}
            >
              {i + 1}
            </span>
            <span className="flex-1 font-nunito font-bold text-charcoal truncate">
              {row.name}
              {me && <span className="text-sky font-semibold text-xs ml-2">you</span>}
            </span>
            <span className="font-fredoka font-bold text-mint text-lg">{row.correct}</span>
            <span className="font-nunito text-charcoal/50 text-sm">
              /{row.totalQuestions} · {row.accuracy}%
            </span>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
