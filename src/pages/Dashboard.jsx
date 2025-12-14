import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import QRCode from "qrcode.react";

import {
  loadTournaments,
  saveTournaments,
  getActiveTournament,
  setActiveTournament,
} from "../utils/storage";

import { generateNextRound } from "../utils/pairings";
import { computeStandings } from "../utils/standings";

export default function Dashboard() {
  const [list, setList] = useState([]);
  const [active, setActive] = useState("");

  // QR state
  const [qrUrl, setQrUrl] = useState("");
  const [qrRound, setQrRound] = useState("");
  const [qrRink, setQrRink] = useState("");

  useEffect(() => {
    const all = loadTournaments();
    setList(Object.keys(all));
    setActive(getActiveTournament());
  }, []);

  const openTournament = (name) => {
    setActiveTournament(name);
    setActive(name);
  };

  const deleteTournament = (name) => {
    if (!window.confirm(`Delete tournament "${name}"?`)) return;
    const all = loadTournaments();
    delete all[name];
    saveTournaments(all);
    setList(Object.keys(all));

    if (getActiveTournament() === name) {
      setActiveTournament("");
      setActive("");
    }
  };

  const renameTournament = (oldName) => {
    const newName = prompt("New tournament name:", oldName);
    if (!newName || newName === oldName) return;

    const all = loadTournaments();
    if (all[newName]) {
      alert("Tournament name already exists.");
      return;
    }

    all[newName] = all[oldName];
    delete all[oldName];
    saveTournaments(all);

    if (getActiveTournament() === oldName) {
      setActiveTournament(newName);
      setActive(newName);
    }

    setList(Object.keys(all));
  };

  const duplicateTournament = (name) => {
    const newName = prompt("Name for duplicated tournament:");
    if (!newName) return;

    const all = loadTournaments();
    if (all[newName]) {
      alert("Tournament name already exists.");
      return;
    }

    all[newName] = JSON.parse(JSON.stringify(all[name]));
    saveTournaments(all);
    setList(Object.keys(all));
  };

  // -----------------------------
  // Generate NEXT ROUND
  // -----------------------------
  const handleGenerateNextRound = () => {
    const all = loadTournaments();
    const name = getActiveTournament();

    if (!name || !all[name]) {
      alert("No active tournament selected.");
      return;
    }

    const tournament = all[name];
    const previousRounds = tournament.matches || [];

    let standings;

    if (previousRounds.length === 0) {
      // Round 1 – no standings yet
      standings = tournament.teams.map((t) => ({ team: t }));
    } else {
      standings = computeStandings(previousRounds);
    }

    const nextRound = generateNextRound(standings, previousRounds);

    if (!nextRound || nextRound.length === 0) {
      alert("Could not generate new round.");
      return;
    }

    tournament.matches = [...previousRounds, nextRound];
    all[name] = tournament;
    saveTournaments(all);

    alert(`Round ${tournament.matches.length} generated.`);
  };

  // -----------------------------
  // QR CODE BUILDER
  // -----------------------------
  const buildQrForRound = () => {
    if (!active) {
      alert("Select an active tournament first.");
      return;
    }
    if (!qrRound) {
      alert("Enter a round number.");
      return;
    }

    //const t = encodeURIComponent(active);
    //const r = encodeURIComponent(qrRound);

    const url =
      window.location.origin +
      "/player?t=" +
      encodeURIComponent(active);
	  "&round=" +
      encodeURIComponent(qrRound);
	  
    if (qrRink) {
      url += `&rink=${encodeURIComponent(qrRink)}`;
    }

    setQrUrl(url);
  };

  return (
    <div className="page">
      <h2>Dashboard</h2>

      <Link to="/new">
        <button className="btn-primary">Create New Tournament</button>
      </Link>

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
        <div style={{ marginTop: "2rem" }}>
          <h3>Active Tournament: {active}</h3>

          <div className="active-buttons">
            <button className="btn-primary" onClick={handleGenerateNextRound}>
              Generate Next Round
            </button>

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

          {/* QR CODE SECTION */}
          <div style={{ marginTop: "2rem" }}>
            <h3>Generate QR Code for Players</h3>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                placeholder="Round #"
                value={qrRound}
                onChange={(e) => setQrRound(e.target.value)}
                style={{ width: 80 }}
              />
              <input
                placeholder="Rink (e.g. A3)"
                value={qrRink}
                onChange={(e) => setQrRink(e.target.value)}
                style={{ width: 120 }}
              />
              <button className="btn-secondary" onClick={buildQrForRound}>
                Build QR
              </button>
            </div>

            {qrUrl && (
              <div style={{ marginTop: 10 }}>
                <div>
                  <strong>Open on phone:</strong>{" "}
                  <a href={qrUrl} target="_blank" rel="noreferrer">{qrUrl}</a>
                </div>

                <div style={{ marginTop: 10 }}>
                  <QRCode value={qrUrl} size={160} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
