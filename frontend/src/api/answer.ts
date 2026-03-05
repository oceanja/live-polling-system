const API_BASE = `${import.meta.env.VITE_API_URL || "http://localhost:5001"}/api`;

export async function submitAnswer(payload: {
  pollId: string;
  optionId: string;
  studentId: string;
}) {
  const res = await fetch(`${API_BASE}/answer/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Failed to submit answer");
  return res.json();
}
