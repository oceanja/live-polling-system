import { useEffect, useState } from "react";
import axios from "axios";

/* ================= TYPES ================= */

type PollOption = {
  id: number;
  label: string;
  votes: number;
  percentage: number;
};

type PollQuestion = {
  id: number;
  question: string;
  options: PollOption[];
};

/* ================= COMPONENT ================= */

export default function TeacherPolllHistoryPage() {
  const [pollHistory, setPollHistory] = useState<PollQuestion[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  /* ---------------- FETCH POLL HISTORY ---------------- */

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get("http://localhost:5001/api/polls/history");

        const formatted: PollQuestion[] = res.data.map((poll: any) => ({
          id: poll.id,
          question: poll.question,
          options: poll.options.map((opt: any) => ({
            id: opt.optionId,
            label: opt.text,
            votes: opt.count,
            percentage: opt.percentage,
          })),
        }));

        setPollHistory(formatted);
      } catch (err) {
        console.error("Failed to fetch poll history", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return <div style={{ padding: "2rem" }}>Loading poll history…</div>;
  }

  return (
    <div style={styles.container}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Work+Sans:wght@400;500;600;700&display=swap');

          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { overflow-x: hidden; }
          html { scroll-behavior: smooth; }

          ::-webkit-scrollbar { width: 10px; }
          ::-webkit-scrollbar-track { background: #f1f1f1; }
          ::-webkit-scrollbar-thumb { background: #7765DA; border-radius: 5px; }
          ::-webkit-scrollbar-thumb:hover { background: #5543b8; }

          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .poll-card { animation: fadeInUp 0.6s ease-out backwards; }

          @media (max-width: 1200px) {
            .container { padding: 2rem 1.5rem !important; }
            .content-wrapper { max-width: 900px !important; }
          }

          @media (max-width: 768px) {
            .container { padding: 1.5rem 1rem !important; }
            .page-title { font-size: 2rem !important; }
            .poll-card { padding: 1.5rem !important; }
          }

          @media (max-width: 480px) {
            .page-title { font-size: 1.75rem !important; }
            .poll-card { padding: 1.25rem !important; }
          }
        `}
      </style>

      <div className="content-wrapper" style={styles.contentWrapper}>
        <h1 className="page-title" style={styles.pageTitle}>
          View <span style={styles.titleAccent}>Poll History</span>
        </h1>

        <div style={styles.pollList}>
          {pollHistory.map((poll, index) => (
            <PollCard
              key={poll.id}
              poll={poll}
              questionNumber={index + 1}
            />
          ))}
        </div>

        <button
          className="chat-button"
          style={styles.chatButton}
          onClick={() => setIsChatOpen(!isChatOpen)}
        >
          💬
        </button>

        {isChatOpen && (
          <>
            <div style={styles.overlay} onClick={() => setIsChatOpen(false)} />
            <div style={styles.chatPanel}>
              <div style={styles.chatHeader}>
                <h3 style={styles.chatTitle}>Chat</h3>
                <button style={styles.closeButton} onClick={() => setIsChatOpen(false)}>
                  ✕
                </button>
              </div>
              <div style={styles.chatContent}>
                <p style={styles.chatPlaceholder}>No messages yet</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ================= SUB COMPONENTS ================= */

function PollCard({
  poll,
  questionNumber,
}: {
  poll: PollQuestion;
  questionNumber: number;
}) {
  return (
    <div className="poll-card" style={styles.pollCard}>
      <h2 style={styles.questionTitle}>Question {questionNumber}</h2>
      <div style={styles.questionText}>{poll.question}</div>

      <div style={styles.optionsList}>
        {poll.options.map((option, index) => (
          <OptionBar
            key={option.id}
            number={index + 1}
            label={option.label}
            percentage={option.percentage}
          />
        ))}
      </div>
    </div>
  );
}

function OptionBar({
  number,
  label,
  percentage,
}: {
  number: number;
  label: string;
  percentage: number;
}) {
  return (
    <div style={styles.optionBar}>
      <div
        style={{
          ...styles.optionBarFill,
          width: `${percentage}%`,
        }}
      >
        <div style={styles.optionContent}>
          <div style={styles.optionNumber}>{number}</div>
          <span style={styles.optionLabel}>{label}</span>
        </div>
      </div>
      <div style={styles.percentageBadge}>{percentage}%</div>
    </div>
  );
}


// ========== STYLES ==========

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)",
    padding: "3rem 2rem",
    fontFamily: "'Work Sans', -apple-system, sans-serif",
    position: "relative",
  } as React.CSSProperties,

  contentWrapper: {
    maxWidth: "1000px",
    margin: "0 auto",
    position: "relative",
  } as React.CSSProperties,

  pageTitle: {
    fontSize: "2.75rem",
    fontWeight: "700",
    color: "#1a1a2e",
    marginBottom: "3rem",
    fontFamily: "'Space Mono', monospace",
    letterSpacing: "-0.02em",
    lineHeight: "1.2",
  } as React.CSSProperties,

  titleAccent: {
    background: "linear-gradient(135deg, #7765DA 0%, #5543b8 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  } as React.CSSProperties,

  pollList: {
    display: "flex",
    flexDirection: "column",
    gap: "2rem",
  } as React.CSSProperties,

  pollCard: {
    background: "white",
    borderRadius: "20px",
    padding: "2rem",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)",
    border: "1px solid rgba(119, 101, 218, 0.1)",
    marginBottom: "2rem",
  } as React.CSSProperties,

  questionTitle: {
    fontSize: "1.125rem",
    fontWeight: "700",
    color: "#7765DA",
    marginBottom: "1rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    fontFamily: "'Space Mono', monospace",
  } as React.CSSProperties,

  questionText: {
    background: "#373737",
    color: "white",
    padding: "1.25rem 1.5rem",
    borderRadius: "12px",
    fontSize: "1.1rem",
    marginBottom: "1.5rem",
    fontWeight: "500",
    lineHeight: "1.6",
  } as React.CSSProperties,

  optionsList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  } as React.CSSProperties,

  optionBar: {
    background: "#f0f0f5",
    borderRadius: "12px",
    overflow: "visible",
    minHeight: "60px",
    position: "relative",
    display: "flex",
    alignItems: "center",
  } as React.CSSProperties,

  optionBarFill: {
    background: "linear-gradient(135deg, #7765DA 0%, #9b8ce8 100%)",
    height: "100%",
    minHeight: "60px",
    display: "flex",
    alignItems: "center",
    borderRadius: "12px",
    position: "absolute",
    left: 0,
    top: 0,
  } as React.CSSProperties,

  optionContent: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "0 1.5rem",
    position: "relative",
    zIndex: 2,
  } as React.CSSProperties,

  optionNumber: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "white",
    color: "#7765DA",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.95rem",
    fontWeight: "700",
    flexShrink: 0,
    boxShadow: "0 2px 8px rgba(119, 101, 218, 0.2)",
  } as React.CSSProperties,

  optionLabel: {
    color: "white",
    fontSize: "1rem",
    fontWeight: "600",
    position: "relative",
    zIndex: 2,
  } as React.CSSProperties,

  percentageBadge: {
    position: "absolute",
    right: "1.25rem",
    background: "#373737",
    color: "white",
    padding: "0.35rem 1rem",
    borderRadius: "20px",
    fontSize: "0.9rem",
    fontWeight: "700",
    zIndex: 3,
    fontFamily: "'Space Mono', monospace",
  } as React.CSSProperties,

  chatButton: {
    position: "fixed",
    bottom: "2rem",
    right: "2rem",
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #7765DA 0%, #5543b8 100%)",
    border: "none",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 6px 20px rgba(119, 101, 218, 0.4)",
    zIndex: 999,
  } as React.CSSProperties,

  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.5)",
    zIndex: 998,
    backdropFilter: "blur(4px)",
  } as React.CSSProperties,

  chatPanel: {
    position: "fixed",
    top: 0,
    right: 0,
    bottom: 0,
    width: "400px",
    maxWidth: "90vw",
    background: "white",
    boxShadow: "-4px 0 30px rgba(0, 0, 0, 0.15)",
    zIndex: 999,
    display: "flex",
    flexDirection: "column",
  } as React.CSSProperties,

  chatHeader: {
    padding: "1.5rem",
    borderBottom: "2px solid #f0f0f5",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "linear-gradient(135deg, #7765DA 0%, #5543b8 100%)",
  } as React.CSSProperties,

  chatTitle: {
    fontSize: "1.25rem",
    fontWeight: "700",
    color: "white",
    fontFamily: "'Space Mono', monospace",
  } as React.CSSProperties,

  closeButton: {
    background: "rgba(255, 255, 255, 0.2)",
    border: "none",
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    color: "white",
    fontSize: "1.25rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
  } as React.CSSProperties,

  chatContent: {
    flex: 1,
    padding: "2rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  } as React.CSSProperties,

  chatPlaceholder: {
    color: "#999",
    fontSize: "1rem",
    fontStyle: "italic",
  } as React.CSSProperties,
};