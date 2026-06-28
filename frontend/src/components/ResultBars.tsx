import { motion } from "framer-motion";
import { answerColor, popIn, spring, stagger } from "../ui/playful";

export type ResultOption = {
  optionId: string;
  text: string;
  count: number;
  percentage: number;
  isCorrect?: boolean;
};

export function ResultBars({
  results,
  selectedOptionId,
  reveal,
  showCounts = true,
}: {
  results: ResultOption[];
  selectedOptionId?: string | null;
  reveal?: boolean;
  showCounts?: boolean;
}) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-3">
      {results.map((opt, index) => {
        const c = answerColor(index);
        const isYourPick = opt.optionId === selectedOptionId;
        const correct = reveal && opt.isCorrect;
        return (
          <motion.div key={opt.optionId} variants={popIn}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-2.5 font-nunito font-bold text-charcoal">
                <span
                  className="w-8 h-8 rounded-lg text-white font-fredoka font-bold text-sm flex items-center justify-center"
                  style={{ background: c.bg }}
                >
                  {c.letter}
                </span>
                {opt.text}
                {correct && (
                  <span className="text-mint font-bold text-xs uppercase tracking-wide bg-mint/15 rounded-md px-2 py-0.5">
                    Correct
                  </span>
                )}
                {isYourPick && !correct && <span className="text-coral font-semibold text-xs">Your pick</span>}
              </span>
              <span className="font-fredoka font-bold text-charcoal">
                {showCounts ? `${opt.count} · ` : ""}
                {opt.percentage}%
              </span>
            </div>
            <div className="h-8 w-full rounded-full bg-softgray overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${opt.percentage}%` }}
                transition={{ ...spring, delay: 0.1 }}
                className="h-full rounded-full"
                style={{ background: correct ? "#4ECDC4" : c.bg }}
              />
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
