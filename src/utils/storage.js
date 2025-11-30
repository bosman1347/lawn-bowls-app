// Utility methods for storing multiple tournaments in LocalStorage

export function loadTournaments() {
  return JSON.parse(localStorage.getItem("tournaments")) || {};
}

export function saveTournaments(tournaments) {
  localStorage.setItem("tournaments", JSON.stringify(tournaments));
}

export function setActiveTournament(name) {
  localStorage.setItem("activeTournament", name);
}

export function getActiveTournament() {
  return localStorage.getItem("activeTournament") || null;
}

export function deleteTournament(name) {
  const tournaments = loadTournaments();
  delete tournaments[name];
  saveTournaments(tournaments);

  const active = getActiveTournament();
  if (active === name) {
    localStorage.removeItem("activeTournament");
  }
}
