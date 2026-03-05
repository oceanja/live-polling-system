import React, { useEffect, useRef, useState } from "react";
import { submitAnswer } from "../../api/answer";
import { socket } from "../../socket";

type PollState = "WAITING" | "ACTIVE" | "RESULT";

const StudentPollPage = () => {
  const [pollState, setPollState] = useState<PollState>("WAITING");
  const [activePoll, setActivePoll] = useState<any>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const activePollRef = useRef<any>(null);

  const loadPoll = (data: { poll: any; remainingTime: number } | null) => {
    if (!data || data.remainingTime <= 0) {
      setPollState("WAITING");
      return;
    }
    activePollRef.current = data.poll;
    setActivePoll(data.poll);
    setRemainingTime(data.remainingTime);
    setPollState("ACTIVE");
    setSubmitted(false);
    setSelectedOptionId(null);
    setResults([]);
  };

  useEffect(() => {
    socket.emit("JOIN_POLL");

    socket.on("ACTIVE_POLL", loadPoll);
    socket.on("POLL_STARTED", (data: { poll: any; remainingTime: number }) => loadPoll(data));
    socket.on("TIMER_UPDATE", (time: number) => setRemainingTime(time));
    socket.on("VOTE_UPDATE", (updatedResults: any[]) => setResults(updatedResults));
    socket.on("POLL_ENDED", (finalResults: any[]) => {
      setResults(finalResults);
      setPollState("RESULT");
    });

    return () => {
      socket.off("ACTIVE_POLL");
      socket.off("POLL_STARTED");
      socket.off("TIMER_UPDATE");
      socket.off("VOTE_UPDATE");
      socket.off("POLL_ENDED");
    };
  }, []);

  const handleOptionClick = async (optionId: string) => {
    if (submitted || pollState !== "ACTIVE" || !activePollRef.current) return;

    const studentId = localStorage.getItem("studentId") || "";
    if (!studentId) { alert("Session expired. Please re-enter your name."); return; }

    try {
      await submitAnswer({ pollId: activePollRef.current.id, optionId, studentId });
      setSelectedOptionId(optionId);
      setSubmitted(true);
    } catch (err) {
      console.error("Answer submit failed", err);
    }
  };

  if (pollState === "WAITING") {
    return <div style={styles.waitMessage}>Waiting for teacher to start a poll...</div>;
  }

  if (pollState === "RESULT") {
    return (
      <div style={styles.container}>
        <div style={styles.contentWrapper}>
          <div style={styles.header}>
            <div style={styles.questionNumber}>Question</div>
            <div style={{ ...styles.timer, color: "#22c55e" }}>Poll ended</div>
          </div>
          {activePoll && <div style={styles.questionBox}>{activePoll.question}</div>}
          {results.length > 0 && (
            <div style={styles.resultsContainer}>
              {results.map((opt, index) => (
                <div key={opt.optionId} style={styles.resultItem}>
                  <div style={styles.optionInfo}>
                    <div style={styles.optionIcon}>{index + 1}</div>
                    <span style={styles.optionName}>{opt.text}</span>
                  </div>
                  <div style={styles.barContainer}>
                    <div style={{ ...styles.bar, width: `${opt.percentage}%` }} />
                  </div>
                  <span style={styles.percentage}>{opt.percentage}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
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
        <div style={styles.questionBox}>{activePoll?.question}</div>

        {submitted ? (
          <div style={styles.resultsContainer}>
            <p style={{ textAlign: "center", color: "#6b7280", fontWeight: 500 }}>
              ✅ Answer submitted! Waiting for poll to end...
            </p>
            {results.length > 0 && results.map((opt, index) => (
              <div key={opt.optionId} style={styles.resultItem}>
                <div style={styles.optionInfo}>
                  <div style={styles.optionIcon}>{index + 1}</div>
                  <span style={styles.optionName}>{opt.text}</span>
                </div>
                <div style={styles.barContainer}>
                  <div style={{ ...styles.bar, width: `${opt.percentage}%` }} />
                </div>
                <span style={styles.percentage}>{opt.percentage}%</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.resultsContainer}>
            {activePoll?.options.map((option: any, index: number) => (
              <div
                key={option.id}
                onClick={() => handleOptionClick(option.id)}
                style={{
                  ...styles.resultItem,
                  cursor: "pointer",
                  border: selectedOptionId === option.id ? "2px solid #6366f1" : "2px solid transparent",
                  background: selectedOptionId === option.id ? "#eef2ff" : "#fff",
                  borderRadius: "12px", padding: "0.5rem",
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
      </div>
    </div>
  );
};

export default StudentPollPage;

const styles: { [key: string]: React.CSSProperties } = {
  container: { backgroundColor: "#fafafa", minHeight: "100vh", padding: "2rem", display: "flex", justifyContent: "center" },
  contentWrapper: { maxWidth: "600px", width: "100%" },
  header: { display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" },
  questionNumber: { fontWeight: 700 },
  timer: { color: "#ef4444", fontWeight: 600 },
  questionBox: { background: "#4a5568", color: "#fff", padding: "1.5rem", borderRadius: "12px", marginBottom: "1.5rem" },
  resultsContainer: { background: "#fff", padding: "1.5rem", borderRadius: "16px", marginBottom: "2rem" },
  resultItem: { display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem", transition: "all 0.2s ease" },
  optionInfo: { display: "flex", gap: "0.75rem", minWidth: "110px" },
  optionIcon: { background: "#6366f1", color: "#fff", width: "32px", height: "32px", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", flexShrink: 0 },
  optionName: { fontWeight: 500 },
  barContainer: { flex: 1, background: "#f1f5f9", borderRadius: "8px" },
  bar: { height: "36px", borderRadius: "8px", background: "linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)", transition: "width 0.5s ease" },
  percentage: { fontWeight: 600, minWidth: "40px", textAlign: "right" },
  waitMessage: { textAlign: "center", marginTop: "3rem", fontWeight: 600, fontSize: "1.1rem", color: "#6b7280" },
};
