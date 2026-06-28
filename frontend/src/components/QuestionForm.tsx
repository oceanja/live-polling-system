import { useState } from "react";
import { motion } from "framer-motion";
import { ChunkyButton, answerColor, spring } from "../ui/playful";

type Opt = { id: number; text: string; correct: boolean };
const DURATIONS = [30, 45, 60];

export type QuestionPayload = {
  question: string;
  duration: number;
  options: { text: string; isCorrect: boolean }[];
};

export function QuestionForm({
  onSubmit,
  submitLabel = "Ask Question",
}: {
  onSubmit: (payload: QuestionPayload) => void;
  submitLabel?: string;
}) {
  const [question, setQuestion] = useState("");
  const [duration, setDuration] = useState(60);
  const [options, setOptions] = useState<Opt[]>([
    { id: 1, text: "", correct: false },
    { id: 2, text: "", correct: false },
  ]);
  const [error, setError] = useState("");

  const addOption = () => {
    if (options.length >= 6) return;
    setOptions([...options, { id: Math.max(...options.map((o) => o.id)) + 1, text: "", correct: false }]);
  };
  const removeOption = (id: number) =>
    options.length > 2 && setOptions(options.filter((o) => o.id !== id));
  const update = (id: number, text: string) =>
    setOptions(options.map((o) => (o.id === id ? { ...o, text } : o)));
  const toggle = (id: number) =>
    setOptions(options.map((o) => (o.id === id ? { ...o, correct: !o.correct } : o)));

  const submit = () => {
    if (!question.trim()) return setError("Enter a question");
    if (options.some((o) => !o.text.trim())) return setError("Fill in all options");
    if (!options.some((o) => o.correct)) return setError("Mark at least one correct answer");
    setError("");
    onSubmit({
      question: question.trim(),
      duration,
      options: options.map((o) => ({ text: o.text.trim(), isCorrect: o.correct })),
    });
    // reset for the next question
    setQuestion("");
    setOptions([
      { id: 1, text: "", correct: false },
      { id: 2, text: "", correct: false },
    ]);
  };

  return (
    <div className="bg-white rounded-3xl p-6" style={{ boxShadow: "0 8px 0 0 #E2E8F0" }}>
      {error && (
        <div className="bg-coral/10 text-coral font-nunito font-semibold rounded-xl px-4 py-2.5 text-sm mb-4 text-center">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <label className="font-fredoka font-bold text-charcoal text-lg">Your question</label>
        <span className="font-nunito text-sm text-charcoal/40">{question.length}/100</span>
      </div>
      <textarea
        value={question}
        maxLength={100}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="e.g. Which planet is known as the Red Planet?"
        className="w-full min-h-24 font-nunito font-semibold text-lg text-charcoal bg-cream rounded-2xl p-4 outline-none border-4 border-transparent focus:border-sky transition-colors resize-none placeholder:text-charcoal/30"
      />

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <span className="font-fredoka font-bold text-charcoal mr-1">Timer</span>
        {DURATIONS.map((d) => (
          <motion.button
            key={d}
            onClick={() => setDuration(d)}
            whileTap={{ scale: 0.92 }}
            transition={spring}
            className="font-fredoka font-bold rounded-full px-5 py-2 border-0 cursor-pointer"
            style={{ background: duration === d ? "#45B7D1" : "#E2E8F0", color: duration === d ? "#fff" : "#2D3436" }}
          >
            {d}s
          </motion.button>
        ))}
      </div>

      <div className="flex items-center justify-between mt-5 mb-3">
        <label className="font-fredoka font-bold text-charcoal text-lg">Options</label>
        <span className="font-nunito text-sm text-charcoal/40">tap the check to mark the correct answer</span>
      </div>
      <div className="flex flex-col gap-3">
        {options.map((o, index) => {
          const c = answerColor(index);
          return (
            <div key={o.id} className="flex items-center gap-3">
              <span
                className="flex-shrink-0 w-10 h-10 rounded-xl text-white font-fredoka font-bold flex items-center justify-center"
                style={{ background: c.bg }}
              >
                {c.letter}
              </span>
              <input
                value={o.text}
                onChange={(e) => update(o.id, e.target.value)}
                placeholder={`Option ${c.letter}`}
                className="flex-1 font-nunito font-semibold text-charcoal bg-cream rounded-xl px-4 py-3 outline-none border-[3px] border-transparent focus:border-sky transition-colors placeholder:text-charcoal/30"
              />
              <motion.button
                type="button"
                onClick={() => toggle(o.id)}
                whileTap={{ scale: 0.85 }}
                whileHover={{ scale: 1.1 }}
                transition={spring}
                title={o.correct ? "Correct answer" : "Mark as correct"}
                className="flex-shrink-0 w-11 h-11 rounded-xl border-0 cursor-pointer flex items-center justify-center"
                style={{ background: o.correct ? "#4ECDC4" : "#E2E8F0" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={o.correct ? "#fff" : "#94A3B8"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </motion.button>
              {options.length > 2 && (
                <button
                  onClick={() => removeOption(o.id)}
                  title="Remove"
                  className="flex-shrink-0 w-9 h-9 rounded-xl border-0 cursor-pointer text-charcoal/40 hover:text-coral hover:bg-coral/10 transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-5 flex-wrap gap-3">
        {options.length < 6 ? (
          <button
            onClick={addOption}
            className="font-fredoka font-semibold text-sky border-[3px] border-sky bg-white rounded-xl px-5 py-2.5 cursor-pointer hover:bg-sky/10 transition-colors"
          >
            + Add option
          </button>
        ) : (
          <span />
        )}
        <ChunkyButton onClick={submit} bg="#FF6B6B" shadow="#E85555" className="px-10">
          {submitLabel}
        </ChunkyButton>
      </div>
    </div>
  );
}
