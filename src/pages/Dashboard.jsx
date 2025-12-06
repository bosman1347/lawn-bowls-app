import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { generateNextRound } from "../utils/pairings";

import {
  loadTournaments,
  saveTournaments,
  getActiveTournament,
  setActiveTournament
} from "../utils/storage";

export default function Dashboard() {
  const [list, setList] = useState([]);
  const [active, setActive] = useState(null);

  // Load tournament list on page load
  useEffect(() => {
    const all = loadTournaments();
    setList(Object.keys(all));
    setActive(getActiveTournament());
  }, []);

  // Open a tournament
  const openTournament = (name) => {
    setActiveTournament(name);
    setActive(name);
  };

  // Rename a tournament
  const renameTournament = (oldName) => {
    const newName = window.prompt("Enter a new name:", oldName);
    if (!newName) return;

    const trimmed = newName.trim();
    if (trimmed === "") {
      alert("Name cannot be empty.");
      return;
    }

    const all = loadTournaments();

    if (all[trimmed] && trimmed !== oldName) {
      alert("A tournament with that name already exists.");
      return;
    }

    all[trimmed] = { ...all[oldName], name: trimmed };
    delete all[oldName];

    saveTournaments(all);

    if (getActiveTournament() === oldName) {
      setActiveTournament(trimmed);
      setActive(trimmed);
    }

    setList(Object.keys(all));
  };

  // Duplicate a tournament
  const duplicateTournament = (name) => {
    const all = loadTournaments();
    const original = all[name];

    if (!original) {
      alert("Tournament not found");
      return;
    }

    let newName = name + " (copy)";
    let counter = 2;
    while (all[newName]) {
      newName = name + " (copy " + counter + ")";
      counter++;
    }

    const copy = {
      name: newName,
      numTeams: original.numTeams,
      tournament: [...original.tournament],
      created: new Date().toISOString(),
      matches: JSON.parse(JSON.stringify(original.matches)),
      scoringMethod: original.scoringMethod
    };

    all[newName] = copy;
    saveTournaments(all);

    setActiveTournament(newName);
    setActive(newName);
    setList(Object.keys(all));
  };

  // Delete a tournament
  const deleteTournament = (name) => {
    if (!window.confirm(`Delete tournament "${name}" permanently?`)) return;

    const all = loadTournaments();
    delete all[name];
    saveTournaments(all);

    if (active === name) {
      setActiveTournament(null);
      setActive(null);
    }

    setList(Object.keys(all));
  };

  // Generate next round
  const handleGenerateNextRound = () => {
    const all = loadTournaments();
    const name = getActiveTournament();

    if (!name || !all[name]) {
      alert("No active tournament selected.");
      return;
    }

    const tournament = all[name];

    const teams = tournament.tournament || [];
    const matches = tournament.matches || [];
    const scoringMethod = tournament.scoringMethod || "standard";

    const nextRound = generateNextRound(teams, matches, scoringMethod);

    if (!nextRound || nextRound.length === 0) {
      alert("Could not generate a new round. There may be too few teams.");
      return;
    }

    tournament.matches = [...matches, nextRound];
    all[name] = tournament;

    saveTournaments(all);
    setActiveTournament(name);

    // Redirect to Matches page
    window.location.href = "/matches";
  };

  return (
    <div className="page">
      <h1 style={{ marginBottom: "2rem" }}>Tournament Dashboard</h1>

      <Link to="/new">
        <button className="btn-primary">➕ Create New Tournament</button>
      </Link>

      {active && (
        <div style={{ marginTop: "20px" }}>
          <button className="btn-primary" onClick={handleGenerateNextRound}>
            Generate Next Round
          </button>
        </div>
      )}

      <h2 style={{ marginTop: "2rem" }}>Saved Tournaments</h2>

      {list.length === 0 ? (
        <p>No tournaments created yet.</p>
      ) : (
        <div className="tournament-row">
          {list.map((name) => (
            <div
              key={name}
              className={`tournament-card ${
                active === name ? "active-card" : ""
              }`}
            >
              <h3>{name}</h3>

              <div className="card-buttons">
                <button className="btn-secondary" onClick={() => openTournament(name)}>
                  Open
                </button>

                <button className="btn-secondary" onClick={() => renameTournament(name)}>
                  Rename
                </button>

                <button className="btn-secondary" onClick={() => duplicateTournament(name)}>
                  Duplicate
                </button>

                <button className="btn-danger" onClick={() => deleteTournament(name)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {active && (
        <div>
          <h3 style={{ marginTop: "2rem" }}>Active Tournament: {active}</h3>

          <div className="active-buttons">
            <Link to="/matches">
              <button className="btn-primary">Matches</button>
            </Link>

            <Link to="/standings">
              <button className="btn-primary">Standings</button>
            </Link>

            <Link to="/summary">
              <button className="btn-primary">Summary</button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
