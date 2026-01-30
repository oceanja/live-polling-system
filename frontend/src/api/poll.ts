const API_BASE = "http://localhost:5001/api";

export async function getActivePoll() {
  const res = await fetch(`${API_BASE}/polls/active`);

  if (!res.ok) {
    throw new Error("Failed to fetch active poll");
  }

  return res.json();
}
