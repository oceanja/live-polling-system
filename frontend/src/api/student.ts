const API_BASE = `${import.meta.env.VITE_API_URL || "http://localhost:5001"}/api`;

export async function joinStudent(name: string) {
  const res = await fetch(`${API_BASE}/student/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  if (!res.ok) throw new Error("Failed to join student");
  return res.json();
}
