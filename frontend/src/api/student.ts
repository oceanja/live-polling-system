const API_BASE = "http://localhost:5001/api";

export async function joinStudent(name: string) {
  const res = await fetch(`${API_BASE}/student/join`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });

  if (!res.ok) {
    throw new Error("Failed to join student");
  }

  return res.json();
}
