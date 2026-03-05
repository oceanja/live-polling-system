import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../../socket";

type PollOption = { id: string; label: string; votes: number; percentage: number };

export default function LivePollResults() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"chat" | "participants">("chat");
  const [isMobile, setIsMobile] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [pollEnded, setPollEnded] = useState(false);
  const [pollData, setPollData] = useState<{ question: string; options: PollOption[] } | null>(null);

  const messages = [
    { id: 1, user: "User 1", message: "Hey There, how can I help?", isCurrentUser: false },
    { id: 2, user: "User 2", message: "Nothing bro..just chill!!", isCurrentUser: true },
  ];
  const participants = [
    { id: 1, name: "Rahul Arora" }, { id: 2, name: "Pushpender Rautela" },
    { id: 3, name: "Rijul Zaipuri" }, { id: 4, name: "Nadeem N" }, { id: 5, name: "Ashwin Sharma" },
  ];

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    socket.emit("JOIN_POLL");

    const setPoll = (data: any) => {
      if (!data) return;
      setPollEnded(false);
      setRemainingTime(data.remainingTime);
      setPollData({
        question: data.poll.question,
        options: data.poll.options.map((opt: any) => ({ id: opt.id, label: opt.text, votes: 0, percentage: 0 })),
      });
    };

    socket.on("ACTIVE_POLL", setPoll);
    socket.on("POLL_STARTED", (data: { poll: any; remainingTime: number }) => setPoll(data));
    socket.on("TIMER_UPDATE", (time: number) => setRemainingTime(time));
    socket.on("VOTE_UPDATE", (results: any[]) => {
      setPollData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          options: prev.options.map((opt) => {
            const found = results.find((r: any) => r.optionId === opt.id);
            return found ? { ...opt, votes: found.count, percentage: found.percentage } : opt;
          }),
        };
      });
    });
    socket.on("POLL_ENDED", (finalResults: any[]) => {
      setPollEnded(true);
      setRemainingTime(0);
      setPollData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          options: prev.options.map((opt) => {
            const found = finalResults.find((r: any) => r.optionId === opt.id);
            return found ? { ...opt, votes: found.count, percentage: found.percentage } : opt;
          }),
        };
      });
    });

    return () => {
      socket.off("ACTIVE_POLL");
      socket.off("POLL_STARTED");
      socket.off("TIMER_UPDATE");
      socket.off("VOTE_UPDATE");
      socket.off("POLL_ENDED");
    };
  }, []);

  const totalVotes = pollData?.options.reduce((s, o) => s + o.votes, 0) ?? 0;

  if (!pollData) {
    return <div style={{ padding: "2rem", textAlign: "center", marginTop: "3rem", color: "#6b7280", fontWeight: 600 }}>Waiting for a poll to start...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.questionSection}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={styles.questionTitle}>Question</h2>
            {remainingTime !== null && (
              <div style={{ ...styles.timerBadge, background: pollEnded ? "#22c55e" : remainingTime <= 10 ? "#ef4444" : "#7765DA" }}>
                {pollEnded ? "Poll ended" : `⏱ ${remainingTime}s`}
              </div>
            )}
          </div>

          <div style={styles.questionBox}>{pollData.question}</div>

          <div style={styles.optionsList}>
            {pollData.options.map((option, index) => {
              const pct = totalVotes === 0 ? 0 : (option.votes / totalVotes) * 100;
              return (
                <div key={option.id} style={styles.optionBar}>
                  <div style={{ ...styles.optionBarFill, width: `${pct}%` }}>
                    <div style={styles.optionContent}>
                      <div style={styles.optionNumber}>{index + 1}</div>
                      <span style={styles.optionLabel}>{option.label}</span>
                    </div>
                  </div>
                  <span style={styles.voteCount}>{option.votes} vote{option.votes !== 1 ? "s" : ""}</span>
                </div>
              );
            })}
          </div>

          <div style={styles.buttonGroup}>
            <button style={styles.askNewButton} onClick={() => navigate("/teacher/create")}>+ Ask a new question</button>
            <button style={styles.viewHistoryButton} onClick={() => navigate("/teacher/history")}>View poll history</button>
          </div>
        </div>

        <div className={`chat-section ${isMobile && showChat ? "show" : ""}`} style={styles.chatSection}>
          <div style={styles.chatHeader}>
            {(["chat", "participants"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ ...styles.tabButton, ...(activeTab === tab ? styles.tabButtonActive : {}) }}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === "chat" ? (
            <div style={styles.chatMessages}>
              {messages.map((msg) => (
                <div key={msg.id} style={{ display: "flex", flexDirection: "column", gap: "0.25rem", alignItems: msg.isCurrentUser ? "flex-end" : "flex-start" }}>
                  <div style={{ fontSize: "0.85rem", color: "#7765DA", fontWeight: 600, paddingLeft: "0.5rem" }}>{msg.user}</div>
                  <div style={{ padding: "0.75rem 1rem", borderRadius: "12px", color: "white", fontSize: "0.95rem", maxWidth: "80%", background: msg.isCurrentUser ? "#7765DA" : "#373737" }}>{msg.message}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {participants.map((p) => (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", borderBottom: "1px solid #F2F2F2" }}>
                  <span style={{ fontSize: "0.95rem", color: "#373737" }}>{p.name}</span>
                  <button style={{ background: "transparent", border: "none", color: "#7765DA", fontWeight: 600, cursor: "pointer" }}>Kick out</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isMobile && (
        <button style={styles.floatingChatButton} onClick={() => setShowChat(!showChat)}>💬</button>
      )}
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", background: "#F2F2F2", padding: "1rem", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' } as React.CSSProperties,
  content: { maxWidth: "1400px", margin: "0 auto", display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem" } as React.CSSProperties,
  questionSection: { display: "flex", flexDirection: "column" } as React.CSSProperties,
  questionTitle: { fontSize: "1.5rem", fontWeight: "600", color: "#000", margin: 0 } as React.CSSProperties,
  timerBadge: { color: "white", padding: "0.4rem 1rem", borderRadius: "50px", fontWeight: "700", fontSize: "0.95rem", transition: "background 0.3s ease" } as React.CSSProperties,
  questionBox: { background: "#373737", color: "white", padding: "1.25rem 1.5rem", borderRadius: "12px", fontSize: "1.1rem", marginBottom: "2rem" } as React.CSSProperties,
  optionsList: { display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" } as React.CSSProperties,
  optionBar: { background: "#E5E5E5", borderRadius: "12px", overflow: "hidden", minHeight: "60px", position: "relative", display: "flex", alignItems: "center" } as React.CSSProperties,
  optionBarFill: { background: "linear-gradient(135deg, #7765DA 0%, #5767D0 100%)", height: "100%", minHeight: "60px", display: "flex", alignItems: "center", transition: "width 0.5s ease", borderRadius: "12px" } as React.CSSProperties,
  optionContent: { display: "flex", alignItems: "center", gap: "1rem", padding: "0 1.5rem" } as React.CSSProperties,
  optionNumber: { width: "32px", height: "32px", borderRadius: "50%", background: "white", color: "#7765DA", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", flexShrink: 0 } as React.CSSProperties,
  optionLabel: { color: "white", fontSize: "1rem", fontWeight: "500" } as React.CSSProperties,
  voteCount: { position: "absolute", right: "1rem", fontSize: "0.85rem", fontWeight: "600", color: "#373737" } as React.CSSProperties,
  buttonGroup: { display: "flex", gap: "1rem", alignItems: "center", justifyContent: "center", flexWrap: "wrap" } as React.CSSProperties,
  askNewButton: { padding: "1rem 2rem", background: "linear-gradient(135deg, #7765DA 0%, #5767D0 100%)", color: "white", border: "none", borderRadius: "50px", fontSize: "1rem", fontWeight: "600", cursor: "pointer" } as React.CSSProperties,
  viewHistoryButton: { padding: "1rem 2rem", background: "transparent", color: "#7765DA", border: "2px solid #7765DA", borderRadius: "50px", fontSize: "1rem", fontWeight: "600", cursor: "pointer" } as React.CSSProperties,
  chatSection: { background: "white", borderRadius: "16px", padding: "1.5rem", height: "fit-content", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" } as React.CSSProperties,
  chatHeader: { display: "flex", gap: "1rem", marginBottom: "1.5rem", borderBottom: "2px solid #F2F2F2" } as React.CSSProperties,
  tabButton: { background: "transparent", border: "none", padding: "0.75rem 1.5rem", fontSize: "1rem", fontWeight: "500", color: "#6E6E6E", cursor: "pointer", borderBottom: "2px solid transparent", marginBottom: "-2px" } as React.CSSProperties,
  tabButtonActive: { color: "#7765DA", borderBottomColor: "#7765DA", fontWeight: "600" } as React.CSSProperties,
  chatMessages: { display: "flex", flexDirection: "column", gap: "1rem" } as React.CSSProperties,
  floatingChatButton: { position: "fixed", bottom: "2rem", right: "2rem", width: "60px", height: "60px", borderRadius: "50%", background: "linear-gradient(135deg, #7765DA 0%, #5767D0 100%)", border: "none", color: "white", fontSize: "1.5rem", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 16px rgba(119,101,218,0.4)", zIndex: 1000 } as React.CSSProperties,
};
