const API_BASE = "http://localhost:5001/api";

export async function getPollResults(pollId: string) {
  const res = await fetch(`${API_BASE}/polls/${pollId}/results`);
  if (!res.ok) throw new Error("Failed to fetch poll results");
  return res.json();
}