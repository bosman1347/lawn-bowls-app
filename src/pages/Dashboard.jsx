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
  
  //Generate next round
  const handleGenerateNextRound = () => {
  const all = loadTournaments();
  const name = activeTournament; // or whatever state you use for the current one
  if (!name || !all[name]) {
    alert("No active tournament selected.");
    return;
  }

  const t = all[name];
  const teams = t.tournament || [];
  const matches = t.matches || [];
  const scoringMethod = t.scoringMethod || "standard";

  const newRound = generateNextRound(teams, matches, scoringMethod);

  if (!newRound || newRound.length === 0) {
    alert("Could not generate a new round. Check that you have at least two teams.");
    return;
  }

  t.matches = [...matches, newRound];
  all[name] = t;
  saveTournaments(all);

  // Optionally ensure this is still the active tournament
  setActiveTournament(name);
  
  //Create "Next Round" button
  {activeTournament && (
  <div className="dashboard-actions">
    <button className="btn-primary" onClick={handleGenerateNextRound}>
      Generate Next Round
    </button>
  </div>
)}



  // Go straight to Matches so they see the new round
  window.location.href = "/matches";
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

    <h2>Saved Tournaments</h2>

    {list.length === 0 ? (
      <p>No tournaments created yet.</p>
    ) : (
     <div className="tournament-row dashboard-card" key={name}>
        {list.map((name) => (
          <div
            key={name}
            className={`tournament-card ${
              active === name ? "active-card" : ""
            }`}
          >
            <h3>{name}</h3>

            <div className="card-buttons">
              <button
				className="btn-secondary"
					onClick={() => openTournament(name)}
						>
						Open
			   </button>
			   

				<button
					className="btn-secondary"
						onClick={() => renameTournament(name)}
							>
							Rename
			   </button>

				<button
					className="btn-secondary"
						onClick={() => duplicateTournament(name)}
						>
						Duplicate
			   </button>

				<button
					className="btn-danger"
						onClick={() => deleteTournament(name)}
						>
						Delete
			     </button>
			
            </div>
          </div>
        ))}
      </div>
    )}

    {active && (
      <div>
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
}

