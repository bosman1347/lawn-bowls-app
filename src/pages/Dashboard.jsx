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
    alert(`Tournament "${name}" opened.`);
  };
  
  // Rename tournament
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
  
  //Prevent duplicate tournaments namespaces
 const duplicateTournament = (name) => {
  const all = loadTournaments();
  const original = all[name];

  if (!original) {
    alert("Tournament not found");
    return;
  }

  // Generate a unique new name
  let newName = name + " (copy)";
  let counter = 2;
  while (all[newName]) {
    newName = name + " (copy " + counter + ")";
    counter++;
  }

  // Create a clean duplicate with ONLY allowed fields
  const copy = {
    name: newName,
    numTeams: original.numTeams,
    teams: [...original.teams],
    created: new Date().toISOString(),
    matches: JSON.parse(JSON.stringify(original.matches)), // safe deep clone
    results: {} // fresh results
  };

  // Save
  all[newName] = copy;
  saveTournaments(all);

  // Set active
  setActiveTournament(newName);
  setActive(newName);

  // Update list
  setList(Object.keys(all));

  alert(`Tournament duplicated as "${newName}"`);
};


  // Deep clone the original tournament (so editing one does not affect the other)
  const copy = JSON.parse(JSON.stringify(original));
  copy.name = newName;
  copy.created = new Date().toISOString();

  // Save to storage
  all[newName] = copy;
  saveTournaments(all);

  // Set duplicate as active
  setActiveTournament(newName);
  setActive(newName);

  // Refresh dashboard list
  setList(Object.keys(all));

  alert(`Tournament duplicated as "${newName}"`);
};


  // Copy old tournament to new name
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
      <h1>Lawn Bowls Tournament Dashboard</h1>

      <Link to="/new">
        <button style={{ marginBottom: "1rem" }}>Create New Tournament</button>
      </Link>

      <h2>Saved Tournaments</h2>

      {list.length === 0 ? (
        <p>No tournaments created yet.</p>
      ) : (
        <div>
          {list.map((name) => (
            <div
              key={name}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "8px"
              }}
            >
              <span
                style={{
                  fontWeight: active === name ? "bold" : "normal",
                  marginRight: "10px"
                }}
              >
                {name}
              </span>

              <button
                onClick={() => openTournament(name)}
                style={{ marginRight: "10px" }}
              >
                Open
              </button>
			  
			  <button
				onClick={() => renameTournament(name)}
				style={{ marginRight: "10px" }}
			>
				Rename
			</button>

			 <button
                onClick={() => deleteTournament(name)}
                style={{ background: "#c62828", color: "white" }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {active && (
        <div style={{ marginTop: "2rem" }}>
          <h3>Active Tournament: {active}</h3>

          <Link to="/matches">
            <button style={{ marginRight: "1rem" }}>Matches</button>
          </Link>

          <Link to="/standings">
            <button style={{ marginRight: "1rem" }}>Standings</button>
          </Link>

          <Link to="/summary">
            <button style={{ marginRight: "1rem" }}>Summary</button>
          </Link>
        </div>
      )}
    </div>
  );
}
