import { motion } from "framer-motion";
import type { ReactNode, CSSProperties } from "react";

/* ===== Motion presets ===== */
export const spring = { type: "spring", stiffness: 420, damping: 18 } as const;
export const softSpring = { type: "spring", stiffness: 260, damping: 22 } as const;

// Bouncy entrance for elements appearing on screen.
export const popIn = {
  hidden: { opacity: 0, scale: 0.8, y: 24 },
  show: { opacity: 1, scale: 1, y: 0, transition: softSpring },
};

// Stagger container for lists (answer grids, participant lists, etc.).
export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

/* ===== Answer color system (A=coral, B=mint, C=sunny, D=sky, then cycle) ===== */
type AnswerColor = {
  bg: string;
  shadow: string;
  text: string;
  letter: string;
};

const ANSWER_COLORS: AnswerColor[] = [
  { bg: "#FF6B6B", shadow: "#E85555", text: "#fff", letter: "A" },
  { bg: "#4ECDC4", shadow: "#3BB3AA", text: "#13403C", letter: "B" },
  { bg: "#FFE66D", shadow: "#E6CC4D", text: "#5C5223", letter: "C" },
  { bg: "#45B7D1", shadow: "#379FB8", text: "#fff", letter: "D" },
];

export function answerColor(index: number): AnswerColor {
  const base = ANSWER_COLORS[index % ANSWER_COLORS.length];
  return { ...base, letter: String.fromCharCode(65 + index) };
}

/* ===== Chunky tactile button ===== */
type ChunkyButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  bg?: string;
  shadow?: string;
  textColor?: string;
  className?: string;
  style?: CSSProperties;
  type?: "button" | "submit";
};

export function ChunkyButton({
  children,
  onClick,
  disabled,
  bg = "#7C5CFC",
  shadow = "#5b3fd6",
  textColor = "#fff",
  className = "",
  style,
}: ChunkyButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.03, y: -2 }}
      whileTap={
        disabled
          ? undefined
          : { scale: 0.96, y: 4, boxShadow: `0 2px 0 0 ${shadow}` }
      }
      transition={spring}
      className={`btn-chunky font-fredoka font-semibold rounded-2xl px-7 py-3.5 text-lg cursor-pointer border-0 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={
        {
          background: bg,
          color: textColor,
          "--shadow-color": shadow,
          ...style,
        } as CSSProperties
      }
    >
      {children}
    </motion.button>
  );
}
