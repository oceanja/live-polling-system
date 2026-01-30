import { useState, useEffect } from "react";
import { socket } from "../../socket";

type PollOption = {
  id: number;
  label: string;
  votes: number;
};

type ChatMessage = {
  id: number;
  user: string;
  message: string;
  isCurrentUser: boolean;
};

type Participant = {
  id: number;
  name: string;
};

export default function LivePollResults() {
  const [activeTab, setActiveTab] = useState<"chat" | "participants">("chat");
  const [isMobile, setIsMobile] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const [pollData, setPollData] = useState<{
    question: string;
    options: PollOption[];
  } | null>(null);

  const [messages] = useState<ChatMessage[]>([
    { id: 1, user: "User 1", message: "Hey There, how can I help?", isCurrentUser: false },
    { id: 2, user: "User 2", message: "Nothing bro..just chill!!", isCurrentUser: true },
  ]);

  const [participants] = useState<Participant[]>([
    { id: 1, name: "Rahul Arora" },
    { id: 2, name: "Pushpender Rautela" },
    { id: 3, name: "Rijul Zaipuri" },
    { id: 4, name: "Nadeem N" },
    { id: 5, name: "Ashwin Sharma" },
  ]);

  /* ---------------- MOBILE CHECK ---------------- */

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  /* ---------------- SOCKET LOGIC ---------------- */

  useEffect(() => {
    socket.emit("JOIN_POLL");

    socket.on("ACTIVE_POLL", (data) => {
      if (!data) return;

      setPollData({
        question: data.poll.question,
        options: data.poll.options.map((opt: any) => ({
          id: opt.id,
          label: opt.text,
          votes: 0,
        })),
      });
    });

    socket.on("VOTE_UPDATE", (results) => {
      setPollData((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          options: prev.options.map((opt) => {
            const found = results.find((r: any) => r.optionId === opt.id);
            return {
              ...opt,
              votes: found ? found.count : 0,
            };
          }),
        };
      });
    });

    return () => {
      socket.off("ACTIVE_POLL");
      socket.off("VOTE_UPDATE");
    };
  }, []);

  if (!pollData) {
    return <div style={{ padding: "2rem" }}>Waiting for poll to start…</div>;
  }

  const totalVotes = pollData.options.reduce((sum, opt) => sum + opt.votes, 0);

  const handleKickOut = (participantId: number) => {
    console.log(`Kick out participant ${participantId}`);
  };

  const handleViewPollHistory = () => {
    console.log("View poll history");
  };

  return (
    <div className="container" style={styles.container}>
      <style>
        {`
          @media (max-width: 1024px) {
            .poll-content {
              grid-template-columns: 1fr !important;
              gap: 1.5rem !important;
            }
            .chat-section {
              max-width: 100% !important;
            }
          }

          @media (max-width: 768px) {
            .poll-content {
              grid-template-columns: 1fr !important;
              padding: 0 !important;
            }
            .chat-section {
              position: fixed !important;
              top: 0 !important;
              right: 0 !important;
              bottom: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              border-radius: 0 !important;
              z-index: 999 !important;
              transform: translateX(100%);
              transition: transform 0.3s ease;
              padding: 1.5rem 1rem !important;
            }
            .chat-section.show {
              transform: translateX(0) !important;
            }
            .question-title {
              font-size: 1.25rem !important;
            }
            .question-box {
              font-size: 1rem !important;
              padding: 1rem 1.25rem !important;
            }
            .option-label {
              font-size: 0.9rem !important;
            }
            .button-group {
              flex-direction: column !important;
              width: 100% !important;
            }
            .ask-new-button, .view-history-button {
              width: 100% !important;
              padding: 0.875rem 1.5rem !important;
              font-size: 0.95rem !important;
            }
            .participants-list {
              max-height: calc(100vh - 150px) !important;
              overflow-y: auto !important;
            }
            .chat-messages {
              max-height: calc(100vh - 150px) !important;
              overflow-y: auto !important;
            }
          }

          @media (max-width: 480px) {
            .floating-chat-button {
              width: 50px !important;
              height: 50px !important;
              bottom: 1rem !important;
              right: 1rem !important;
            }
            .option-number {
              width: 28px !important;
              height: 28px !important;
              font-size: 0.8rem !important;
            }
            .option-content {
              padding: 0 1rem !important;
            }
            .question-title {
              font-size: 1.1rem !important;
            }
            .question-box {
              font-size: 0.95rem !important;
              padding: 0.875rem 1rem !important;
            }
            .ask-new-button, .view-history-button {
              padding: 0.75rem 1.25rem !important;
              font-size: 0.9rem !important;
            }
            .tab-button {
              padding: 0.625rem 1rem !important;
              font-size: 0.9rem !important;
            }
            .participant-row {
              padding: 0.625rem 0.75rem !important;
            }
            .participant-name {
              font-size: 0.875rem !important;
            }
            .kick-out-button {
              font-size: 0.85rem !important;
              padding: 0.375rem 0.625rem !important;
            }
            .chat-user {
              font-size: 0.8rem !important;
            }
            .chat-bubble {
              font-size: 0.875rem !important;
              padding: 0.625rem 0.875rem !important;
            }
          }

          @media (max-width: 360px) {
            .container {
              padding: 0.5rem !important;
            }
            .option-content {
              padding: 0 0.75rem !important;
              gap: 0.75rem !important;
            }
            .option-label {
              font-size: 0.85rem !important;
            }
          }
        `}
      </style>

      <div className="poll-content" style={styles.content}>
        <div style={styles.questionSection}>
          <h2 className="question-title" style={styles.questionTitle}>Question</h2>
          <div className="question-box" style={styles.questionBox}>
            {pollData.question}
          </div>

          <div style={styles.optionsList}>
            {pollData.options.map((option, index) => {
              const percentage = totalVotes === 0 ? 0 : (option.votes / totalVotes) * 100;
              return (
                <PollOptionBar
                  key={option.id}
                  number={index + 1}
                  label={option.label}
                  percentage={percentage}
                />
              );
            })}
          </div>

          <div className="button-group" style={styles.buttonGroup}>
            <button className="ask-new-button" style={styles.askNewButton}>
              + Ask a new question
            </button>
            <button className="view-history-button" style={styles.viewHistoryButton} onClick={handleViewPollHistory}>
              View poll history
            </button>
          </div>
        </div>

        <div className={`chat-section ${isMobile && showChat ? "show" : ""}`} style={styles.chatSection}>
          <div style={styles.chatHeader}>
            <button
              className="tab-button"
              onClick={() => setActiveTab("chat")}
              style={{ ...styles.tabButton, ...(activeTab === "chat" ? styles.tabButtonActive : {}) }}
            >
              Chat
            </button>
            <button
              className="tab-button"
              onClick={() => setActiveTab("participants")}
              style={{ ...styles.tabButton, ...(activeTab === "participants" ? styles.tabButtonActive : {}) }}
            >
              Participants
            </button>
          </div>

          {activeTab === "chat" ? (
            <div className="chat-messages" style={styles.chatMessages}>
              {messages.map((msg) => (
                <ChatBubble key={msg.id} {...msg} />
              ))}
            </div>
          ) : (
            <div className="participants-list" style={styles.participantsList}>
              {participants.map((p) => (
                <ParticipantRow key={p.id} name={p.name} onKickOut={() => handleKickOut(p.id)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function PollOptionBar({ number, label, percentage }: any) {
  return (
    <div style={styles.optionBar}>
      <div style={{ ...styles.optionBarFill, width: `${percentage}%` }}>
        <div className="option-content" style={styles.optionContent}>
          <div className="option-number" style={styles.optionNumber}>{number}</div>
          <span className="option-label" style={styles.optionLabel}>{label}</span>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ user, message, isCurrentUser }: any) {
  return (
    <div style={{ ...styles.chatBubbleContainer, alignItems: isCurrentUser ? "flex-end" : "flex-start" }}>
      <div style={styles.chatUser}>{user}</div>
      <div style={{ ...styles.chatBubble, background: isCurrentUser ? "#7765DA" : "#373737" }}>
        {message}
      </div>
    </div>
  );
}

function ParticipantRow({ name, onKickOut }: any) {
  return (
    <div className="participant-row" style={styles.participantRow}>
      <span style={styles.participantName}>{name}</span>
      <button className="kick-out-button" style={styles.kickOutButton} onClick={onKickOut}>
        Kick out
      </button>
    </div>
  );
}

// ========== STYLES ==========

const styles = {
  container: {
    minHeight: "100vh",
    background: "#F2F2F2",
    padding: "1rem",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  } as React.CSSProperties,

  content: {
    maxWidth: "1400px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "2rem",
    position: "relative",
  } as React.CSSProperties,

  questionSection: {
    display: "flex",
    flexDirection: "column",
  } as React.CSSProperties,

  questionTitle: {
    fontSize: "1.5rem",
    fontWeight: "600",
    color: "#000",
    marginBottom: "1rem",
  } as React.CSSProperties,

  questionBox: {
    background: "#373737",
    color: "white",
    padding: "1.25rem 1.5rem",
    borderRadius: "12px",
    fontSize: "1.1rem",
    marginBottom: "2rem",
  } as React.CSSProperties,

  optionsList: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    marginBottom: "2rem",
  } as React.CSSProperties,

  optionBar: {
    background: "#E5E5E5",
    borderRadius: "12px",
    overflow: "hidden",
    minHeight: "60px",
    position: "relative",
  } as React.CSSProperties,

  optionBarFill: {
    background: "linear-gradient(135deg, #7765DA 0%, #5767D0 100%)",
    height: "100%",
    minHeight: "60px",
    display: "flex",
    alignItems: "center",
    transition: "width 0.5s ease",
    borderRadius: "12px",
  } as React.CSSProperties,

  optionContent: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "0 1.5rem",
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
    fontSize: "0.9rem",
    fontWeight: "700",
    flexShrink: 0,
  } as React.CSSProperties,

  optionLabel: {
    color: "white",
    fontSize: "1rem",
    fontWeight: "500",
  } as React.CSSProperties,

  buttonGroup: {
    display: "flex",
    gap: "1rem",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
  } as React.CSSProperties,

  askNewButton: {
    padding: "1rem 2rem",
    background: "linear-gradient(135deg, #7765DA 0%, #5767D0 100%)",
    color: "white",
    border: "none",
    borderRadius: "50px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(119, 101, 218, 0.3)",
    transition: "all 0.3s ease",
  } as React.CSSProperties,

  viewHistoryButton: {
    padding: "1rem 2rem",
    background: "transparent",
    color: "#7765DA",
    border: "2px solid #7765DA",
    borderRadius: "50px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
  } as React.CSSProperties,

  chatSection: {
    background: "white",
    borderRadius: "16px",
    padding: "1.5rem",
    height: "fit-content",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
  } as React.CSSProperties,

  chatHeader: {
    display: "flex",
    gap: "1rem",
    marginBottom: "1.5rem",
    borderBottom: "2px solid #F2F2F2",
  } as React.CSSProperties,

  tabButton: {
    background: "transparent",
    border: "none",
    padding: "0.75rem 1.5rem",
    fontSize: "1rem",
    fontWeight: "500",
    color: "#6E6E6E",
    cursor: "pointer",
    borderBottom: "2px solid transparent",
    marginBottom: "-2px",
    transition: "all 0.2s ease",
  } as React.CSSProperties,

  tabButtonActive: {
    color: "#7765DA",
    borderBottomColor: "#7765DA",
    fontWeight: "600",
  } as React.CSSProperties,

  chatMessages: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  } as React.CSSProperties,

  chatBubbleContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  } as React.CSSProperties,

  chatUser: {
    fontSize: "0.85rem",
    color: "#7765DA",
    fontWeight: "600",
    paddingLeft: "0.5rem",
  } as React.CSSProperties,

  chatBubble: {
    padding: "0.75rem 1rem",
    borderRadius: "12px",
    color: "white",
    fontSize: "0.95rem",
    maxWidth: "80%",
    wordWrap: "break-word",
  } as React.CSSProperties,

  participantsList: {
    display: "flex",
    flexDirection: "column",
  } as React.CSSProperties,

  participantsHeader: {
    display: "flex",
    justifyContent: "space-between",
    padding: "0.75rem 1rem",
    borderBottom: "1px solid #E5E5E5",
    marginBottom: "0.5rem",
  } as React.CSSProperties,

  participantsHeaderText: {
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "#6E6E6E",
  } as React.CSSProperties,

  participantRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.75rem 1rem",
    borderBottom: "1px solid #F2F2F2",
  } as React.CSSProperties,

  participantName: {
    fontSize: "0.95rem",
    color: "#373737",
  } as React.CSSProperties,

  kickOutButton: {
    background: "transparent",
    border: "none",
    color: "#7765DA",
    fontSize: "0.9rem",
    fontWeight: "600",
    cursor: "pointer",
    padding: "0.5rem 0.75rem",
    transition: "all 0.2s ease",
  } as React.CSSProperties,

  floatingChatButton: {
    position: "fixed",
    bottom: "2rem",
    right: "2rem",
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #7765DA 0%, #5767D0 100%)",
    border: "none",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 4px 16px rgba(119, 101, 218, 0.4)",
    transition: "all 0.3s ease",
    zIndex: 1000,
  } as React.CSSProperties,

  closeChatButton: {
    position: "absolute",
    top: "1rem",
    right: "1rem",
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "#F2F2F2",
    border: "none",
    color: "#373737",
    fontSize: "1.25rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: 10,
  } as React.CSSProperties,
};