import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../../socket";

type Option = {
  id: number;
  text: string;
  correct: boolean;
};

export default function CreatePoll() {
  const [question, setQuestion] = useState("");
  const [duration, setDuration] = useState(60);
  const [options, setOptions] = useState<Option[]>([
    { id: 1, text: "", correct: false },
    { id: 2, text: "", correct: false },
  ]);

  const navigate = useNavigate();

  const addOption = () => {
    const newId = Math.max(...options.map(o => o.id)) + 1;
    setOptions([...options, { id: newId, text: "", correct: false }]);
  };

  const updateOption = (id: number, text: string) => {
    setOptions(options.map(o => (o.id === id ? { ...o, text } : o)));
  };

  const setCorrect = (id: number, value: boolean) => {
    setOptions(options.map(o => (o.id === id ? { ...o, correct: value } : o)));
  };

  const handleAskQuestion = () => {
    if (!question.trim()) return alert("Enter question");
    if (options.some(o => !o.text.trim())) return alert("Fill all options");

    socket.emit("CREATE_POLL", {
      question,
      duration,
      options: options.map(o => o.text),
    });

    navigate("/teacher/live");
  };

  return (
    <div style={styles.container}>
      <style>{MEDIA_QUERIES}</style>

      <div className="poll-content" style={styles.content}>
        <LogoBadge />
        <Header />
        <QuestionSection
          question={question}
          setQuestion={setQuestion}
          duration={duration}
          setDuration={setDuration}
        />
        <OptionsSection
          options={options}
          updateOption={updateOption}
          setCorrect={setCorrect}
          addOption={addOption}
        />
        <AskQuestionButton onClick={handleAskQuestion} />
      </div>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function LogoBadge() {
  return (
    <div className="logo-badge" style={styles.logoBadge}>
      <span style={styles.logoIcon}>✦</span>
      Intervue Poll
    </div>
  );
}

function Header() {
  return (
    <>
      <h1 className="poll-title" style={styles.title}>Let's Get Started</h1>
      <p className="poll-subtitle" style={styles.subtitle}>
        you'll have the ability to create and manage polls, ask questions, and
        monitor <br /> your students' responses in real-time.
      </p>
    </>
  );
}

function QuestionSection({ question, setQuestion, duration, setDuration }: any) {
  return (
    <div className="question-section" style={styles.questionSection}>
      <div className="question-header" style={styles.questionHeader}>
        <label style={styles.questionLabel}>Enter your question</label>
        <div style={styles.durationWrapper}>
          <span style={styles.durationDisplay}>{duration} seconds</span>
          <select
            value={duration}
            onChange={e => setDuration(Number(e.target.value))}
            style={styles.select}
          >
            <option value={30}>30 sec</option>
            <option value={60}>60 sec</option>
            <option value={90}>90 sec</option>
          </select>
          <span style={styles.dropdownIcon}>▼</span>
        </div>
      </div>

      <div style={styles.textareaWrapper}>
        <textarea
          className="textarea"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          style={styles.textarea}
        />
        <span style={styles.charCount}>0/100</span>
      </div>
    </div>
  );
}

function OptionsSection({ options, updateOption, setCorrect, addOption }: any) {
  return (
    <div className="options-grid" style={styles.optionsGrid}>
      <div>
        <h3 style={styles.columnTitle}>Edit Options</h3>
        {options.map(o => (
          <div key={o.id} style={styles.optionRow}>
            <div style={styles.optionNumber}>{o.id}</div>
            <input
              value={o.text}
              onChange={e => updateOption(o.id, e.target.value)}
              style={styles.optionInput}
            />
          </div>
        ))}
        <button onClick={addOption} style={styles.addButton}>+ Add More option</button>
      </div>

      <div>
        <h3 style={styles.columnTitle}>Is it Correct?</h3>
        {options.map(o => (
          <div key={o.id} style={styles.correctRow}>
            <label onClick={() => setCorrect(o.id, true)} style={styles.radioWrapper}>
              <div style={{
                ...styles.radioOuter,
                ...(o.correct ? styles.radioOuterActive : {})
              }}>
                {o.correct && <div style={styles.radioInner}></div>}
              </div>
              <span style={styles.radioLabel}>Yes</span>
            </label>
            <label onClick={() => setCorrect(o.id, false)} style={styles.radioWrapper}>
              <div style={{
                ...styles.radioOuter,
                ...(!o.correct ? styles.radioOuterActive : {})
              }}>
                {!o.correct && <div style={styles.radioInner}></div>}
              </div>
              <span style={styles.radioLabel}>No</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

function AskQuestionButton({ onClick }: any) {
  return (
    <div className="button-container" style={styles.buttonContainer}>
      <button className="ask-button" onClick={onClick} style={styles.askButton}>
        Ask Question
      </button>
    </div>
  );
}

/* ================= MEDIA QUERIES ================= */

const MEDIA_QUERIES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

* {
  font-family: 'Inter', sans-serif;
}

@media (max-width: 768px) {
  .options-grid { grid-template-columns: 1fr !important; }
  .ask-button { width: 100% !important; }
}
`;

/* ================= STYLES ================= */

const styles: any = {
  container: { 
    minHeight: "100vh", 
    background: "#FAFAFA",
    paddingBottom: "120px",
  },
  content: { 
    maxWidth: "900px", 
    margin: "0 auto", 
    padding: "2.5rem 2rem" 
  },
  logoBadge: { 
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
    background: "#7C3AED", 
    color: "white", 
    padding: "0.5rem 1rem", 
    borderRadius: "18px",
    fontSize: "0.875rem",
    fontWeight: 600,
    marginBottom: "2rem",
  },
  logoIcon: { 
    fontWeight: 700,
    fontSize: "0.875rem",
  },
  title: { 
    fontSize: "2.25rem", 
    fontWeight: 700,
    marginBottom: "0.5rem",
    color: "#000",
  },
  subtitle: { 
    color: "#737373", 
    marginBottom: "2.5rem",
    fontSize: "0.938rem",
    lineHeight: "1.5",
  },
  questionSection: { 
    marginBottom: "2.5rem",
  },
  questionHeader: { 
    display: "flex", 
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.75rem",
  },
  questionLabel: { 
    fontWeight: 600,
    fontSize: "0.938rem",
    color: "#000",
  },
  durationWrapper: {
    position: "relative" as const,
    display: "inline-block",
  },
  durationDisplay: {
    display: "inline-block",
    padding: "0.5rem 2.5rem 0.5rem 1rem",
    background: "#F5F5F5",
    borderRadius: "8px",
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "#000",
    cursor: "pointer",
  },
  select: { 
    position: "absolute" as const,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    opacity: 0,
    cursor: "pointer",
  },
  dropdownIcon: {
    position: "absolute" as const,
    right: "0.875rem",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "0.625rem",
    color: "#7C3AED",
    pointerEvents: "none" as const,
  },
  textareaWrapper: {
    position: "relative" as const,
  },
  textarea: { 
    width: "100%", 
    minHeight: 140, 
    padding: "1rem",
    borderRadius: "8px",
    border: "1px solid #E5E5E5",
    fontSize: "0.938rem",
    lineHeight: "1.5",
    resize: "none" as const,
    background: "#F9FAFB",
  },
  charCount: {
    position: "absolute" as const,
    bottom: "1rem",
    right: "1rem",
    fontSize: "0.75rem",
    color: "#A3A3A3",
  },
  optionsGrid: { 
    display: "grid", 
    gridTemplateColumns: "1.5fr 1fr", 
    gap: "2rem",
    marginBottom: "2rem",
  },
  columnTitle: { 
    fontWeight: 600,
    fontSize: "0.938rem",
    marginBottom: "1.25rem",
    color: "#000",
  },
  optionRow: { 
    display: "flex", 
    gap: 12, 
    marginBottom: 12,
    alignItems: "center",
  },
  optionNumber: { 
    background: "#7C3AED", 
    color: "white", 
    borderRadius: "50%", 
    width: 32, 
    height: 32, 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center",
    fontWeight: 600,
    fontSize: "0.875rem",
    flexShrink: 0,
  },
  optionInput: { 
    flex: 1, 
    padding: "0.75rem 1rem",
    borderRadius: "6px",
    border: "1px solid #E5E5E5",
    fontSize: "0.875rem",
    background: "#F9FAFB",
  },
  addButton: { 
    marginTop: 12,
    padding: "0.625rem 1.125rem",
    borderRadius: "8px",
    border: "1px solid #7C3AED",
    background: "white",
    color: "#7C3AED",
    fontSize: "0.875rem",
    fontWeight: 500,
    cursor: "pointer",
  },
  correctRow: { 
    display: "flex", 
    gap: 16, 
    marginBottom: 12,
    alignItems: "center",
    height: "48px",
  },
  radioWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    cursor: "pointer",
  },
  radioOuter: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    border: "2px solid #D1D5DB",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterActive: {
    borderColor: "#7C3AED",
  },
  radioInner: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#7C3AED",
  },
  radioLabel: {
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "#000",
  },
  buttonContainer: { 
    position: "fixed", 
    bottom: 30, 
    right: 30,
  },
  askButton: { 
    padding: "1rem 2.5rem", 
    background: "#7C3AED", 
    color: "white", 
    borderRadius: "50px",
    border: "none",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(124, 58, 237, 0.25)",
  },
};