import React, { useEffect, useState } from "react";
import { submitAnswer } from "../../api/answer";
import { socket } from "../../socket";

type PollState = "ACTIVE" | "RESULT";

const StudentPollPage = () => {
  const [pollState, setPollState] = useState<PollState>("ACTIVE");
  const [activePoll, setActivePoll] = useState<any>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);

  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  /* ---------------- SOCKET LISTENERS ---------------- */

  useEffect(() => {
    // ask server for current state (refresh-safe)
    socket.emit("JOIN_POLL");

    socket.on("ACTIVE_POLL", (data) => {
      if (!data) {
        setActivePoll(null);
        setPollState("RESULT");
        return;
      }

      setActivePoll(data.poll);
      setRemainingTime(data.remainingTime);
      setPollState(data.remainingTime > 0 ? "ACTIVE" : "RESULT");
      setSubmitted(false);
      setSelectedOptionId(null);
      setResults([]);
    });

    socket.on("TIMER_UPDATE", (time: number) => {
      setRemainingTime(time);
    });

    socket.on("VOTE_UPDATE", (updatedResults) => {
      setResults(updatedResults);
    });

    socket.on("POLL_ENDED", (finalResults) => {
      setResults(finalResults);
      setPollState("RESULT");
    });

    return () => {
      socket.off("ACTIVE_POLL");
      socket.off("TIMER_UPDATE");
      socket.off("VOTE_UPDATE");
      socket.off("POLL_ENDED");
    };
  }, []);

  /* ---------------- ANSWER ---------------- */

  const handleOptionClick = async (optionId: string) => {
    if (submitted || pollState !== "ACTIVE" || !activePoll) return;

    try {
      await submitAnswer({
        pollId: activePoll.id,
        optionId,
        studentId: localStorage.getItem("studentId") || "temp",
      });

      setSelectedOptionId(optionId);
      setSubmitted(true);
    } catch (err) {
      console.error("Answer submit failed", err);
    }
  };

  /* ---------------- UI ---------------- */

  if (!activePoll) {
    return (
      <div style={styles.waitMessage}>
        Waiting for teacher to start poll...
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.contentWrapper}>
        <div style={styles.header}>
          <div style={styles.questionNumber}>Question</div>
          <div style={styles.timer}>⏱ {remainingTime}s</div>
        </div>

        <div style={styles.questionBox}>{activePoll.question}</div>

        {/* ACTIVE OPTIONS */}
        {pollState === "ACTIVE" && (
          <div style={styles.resultsContainer}>
            {activePoll.options.map((option: any, index: number) => (
              <div
                key={option.id}
                onClick={() => handleOptionClick(option.id)}
                style={{
                  ...styles.resultItem,
                  cursor: submitted ? "not-allowed" : "pointer",
                  border:
                    selectedOptionId === option.id
                      ? "2px solid #6366f1"
                      : "2px solid transparent",
                  background:
                    selectedOptionId === option.id ? "#eef2ff" : "#fff",
                }}
              >
                <div style={styles.optionInfo}>
                  <div style={styles.optionIcon}>{index + 1}</div>
                  <span style={styles.optionName}>{option.text}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* RESULTS */}
        {pollState === "RESULT" && results.length > 0 && (
          <div style={styles.resultsContainer}>
            {results.map((opt, index) => (
              <div key={opt.optionId} style={styles.resultItem}>
                <div style={styles.optionInfo}>
                  <div style={styles.optionIcon}>{index + 1}</div>
                  <span style={styles.optionName}>{opt.text}</span>
                </div>

                <div style={styles.barContainer}>
                  <div
                    style={{
                      ...styles.bar,
                      width: `${opt.percentage}%`,
                    }}
                  />
                </div>

                <span style={styles.percentage}>{opt.percentage}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentPollPage;

/* ---------------- STYLES ---------------- */

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    backgroundColor: "#fafafa",
    minHeight: "100vh",
    padding: "2rem",
    display: "flex",
    justifyContent: "center",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  contentWrapper: { maxWidth: "600px", width: "100%" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "1.5rem",
  },
  questionNumber: { fontWeight: 700 },
  timer: { color: "#ef4444", fontWeight: 600 },
  questionBox: {
    background: "#4a5568",
    color: "#fff",
    padding: "1.5rem",
    borderRadius: "12px",
    marginBottom: "1.5rem",
  },
  resultsContainer: {
    background: "#fff",
    padding: "1.5rem",
    borderRadius: "16px",
    marginBottom: "2rem",
  },
  resultItem: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    marginBottom: "1rem",
  },
  optionInfo: { display: "flex", gap: "0.75rem", minWidth: "110px" },
  optionIcon: {
    background: "#6366f1",
    color: "#fff",
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  optionName: { fontWeight: 500 },
  barContainer: { flex: 1, background: "#f1f5f9", borderRadius: "8px" },
  bar: {
    height: "36px",
    borderRadius: "8px",
    background: "linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)",
  },
  percentage: { fontWeight: 600 },
  waitMessage: {
    textAlign: "center",
    marginTop: "3rem",
    fontWeight: 600,
  },
};