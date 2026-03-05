import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { joinStudent } from "../../api/student";

export default function StudentLogin() {
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleContinue = async () => {
    if (!name.trim()) return;
    try {
      const res = await joinStudent(name);
      localStorage.setItem("student", JSON.stringify(res.student));
      localStorage.setItem("studentId", String(res.student.id));
      navigate("/student/poll");
    } catch (err) {
      console.error("Join failed", err);
      alert("Failed to join poll");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleContinue();
  };

  return (
    <div style={styles.container}>
      <style>{`
        @media (max-width: 768px) {
          .login-content { padding: 2rem 1.5rem !important; }
          .login-title { font-size: 2rem !important; }
          .login-subtitle { font-size: 0.95rem !important; }
          .form-container { margin-top: 2.5rem !important; }
          .continue-btn { padding: 0.875rem 2.5rem !important; font-size: 1rem !important; }
        }
        @media (max-width: 480px) {
          .login-content { padding: 1.5rem 1rem !important; }
          .logo-badge { font-size: 0.85rem !important; padding: 0.4rem 1rem !important; }
          .login-title { font-size: 1.75rem !important; }
          .name-input { padding: 0.875rem 1rem !important; font-size: 1rem !important; }
          .continue-btn { padding: 0.875rem 2rem !important; font-size: 0.95rem !important; min-width: 200px !important; }
        }
      `}</style>

      <div className="login-content" style={styles.content}>
        <div className="logo-badge" style={styles.logoBadge}>
          <span style={{ fontSize: "1.1rem" }}>✨</span> Intervue Poll
        </div>

        <h1 className="login-title" style={styles.title}>Let's Get Started</h1>
        <p className="login-subtitle" style={styles.subtitle}>
          If you're a student, you'll be able to <strong>submit your answers</strong>, participate in live polls,
          and see how your responses compare with your classmates
        </p>

        <div className="form-container" style={styles.formContainer}>
          <label style={styles.label}>Enter your Name</label>
          <input
            className="name-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your name"
            style={styles.input}
          />
        </div>

        <div style={styles.buttonContainer}>
          <button className="continue-btn" onClick={handleContinue} style={styles.continueButton}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "2rem",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  } as React.CSSProperties,
  content: { maxWidth: "600px", width: "100%", textAlign: "center", padding: "3rem 2rem" } as React.CSSProperties,
  logoBadge: {
    display: "inline-flex", alignItems: "center", gap: "0.5rem",
    background: "linear-gradient(135deg, #7765DA 0%, #5767D0 100%)",
    color: "white", padding: "0.5rem 1.25rem", borderRadius: "50px",
    fontSize: "0.95rem", fontWeight: "500", marginBottom: "2rem",
  } as React.CSSProperties,
  title: { fontSize: "2.5rem", fontWeight: "700", color: "#000", marginBottom: "1rem", lineHeight: "1.2" } as React.CSSProperties,
  subtitle: { fontSize: "1rem", color: "#6E6E6E", marginBottom: "3rem", lineHeight: "1.6" } as React.CSSProperties,
  formContainer: { marginBottom: "2rem", textAlign: "left" } as React.CSSProperties,
  label: { display: "block", fontSize: "1rem", fontWeight: "600", color: "#000", marginBottom: "0.75rem" } as React.CSSProperties,
  input: {
    width: "100%", padding: "1rem 1.25rem", background: "#F2F2F2",
    border: "none", borderRadius: "12px", fontSize: "1.05rem",
    outline: "none", boxSizing: "border-box", color: "#000",
  } as React.CSSProperties,
  buttonContainer: { marginTop: "2.5rem", display: "flex", justifyContent: "center" } as React.CSSProperties,
  continueButton: {
    padding: "1rem 3rem",
    background: "linear-gradient(135deg, #7765DA 0%, #5767D0 100%)",
    color: "white", border: "none", borderRadius: "50px",
    fontSize: "1.1rem", fontWeight: "600", cursor: "pointer", minWidth: "220px",
  } as React.CSSProperties,
};
