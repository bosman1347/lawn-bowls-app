// Shared backend API helpers

export async function loadAllTournaments() {
  const res = await fetch("/api/tournaments");
  if (!res.ok) throw new Error("Failed to load tournaments");
  return await res.json();
}

export async function loadTournament(name) {
  const all = await loadAllTournaments();
  return all[name] || null;
}

export async function saveTournament(name, data) {
  const res = await fetch("/api/tournaments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, data }),
  });

  if (!res.ok) throw new Error("Failed to save tournament");
}
