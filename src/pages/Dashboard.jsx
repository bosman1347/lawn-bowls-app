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
