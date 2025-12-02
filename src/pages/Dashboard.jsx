import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

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

    // Copy old tournament data
    all[trimmed] = { ...all[oldName], name: trimmed };
    delete all[oldName];

    saveTournaments(all);

    // Update active tournament if needed
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

    // Generate unique name
    let newName = name + " (copy)";
    let counter = 2;
    while (all[newName]) {
      newName = name + " (copy " + counter + ")";
      counter++;
    }

    // Safe cloned tournament
    const copy = {
      name: newName,
      numTeams: original.numTeams,
      teams: [...original.teams],
      created: new Date().toISOString(),
      matches: JSON.parse(JSON.stringify(original.matches)),
      results: {}
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

 return (
  <div className="page">
    <h1 style={{ marginBottom: "2rem" }}>Tournament Dashboard</h1>

    <Link to="/new">
      <button className="btn-primary">➕ Create New Tournament</button>
    </Link>

    <h2 style={{ marginTop: "2rem" }}>Saved Tournaments</h2>

    {list.length === 0 ? (
      <p>No tournaments created yet.</p>
    ) : (
      <div className="tournament-grid">
        {list.map((name) => (
          <div
            key={name}
            className={`tournament-card ${
              active === name ? "active-card" : ""
            }`}
          >
            <h3>{name}</h3>

            <div className="card-buttons">
              <button onClick={() => openTournament(name)}>Open</button>
              <button onClick={() => renameTournament(name)}>Rename</button>
              <button onClick={() => duplicateTournament(name)}>
                Duplicate
              </button>
              <button
                onClick={() => deleteTournament(name)}
                className="btn-danger"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    )}

    {active && (
      <div style={{ marginTop: "3rem" }}>
        <h3>Active Tournament: {active}</h3>

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

