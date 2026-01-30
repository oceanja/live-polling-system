import { useEffect } from "react";

export default function StudentWaitingPage() {
  // fake waiting (later socket se connect hoga)
  useEffect(() => {
    console.log("Student waiting for teacher question...");
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.badge}>✨ Intervue Poll</div>

      {/* Loader */}
      <div style={styles.loader} />

      <p style={styles.text}>
        Wait for the teacher to ask questions..
      </p>

      <style>
        {`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "white",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "1.5rem",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  } as React.CSSProperties,

  badge: {
    padding: "0.4rem 1rem",
    borderRadius: "999px",
    background: "linear-gradient(135deg, #7765DA, #5767D0)",
    color: "white",
    fontWeight: 500,
    fontSize: "0.9rem",
  } as React.CSSProperties,

  loader: {
    width: "48px",
    height: "48px",
    border: "5px solid #E5E5E5",
    borderTopColor: "#7765DA",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  } as React.CSSProperties,

  text: {
    fontSize: "1.1rem",
    fontWeight: 600,
    color: "#000",
  } as React.CSSProperties,
};
