import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import QRCode from "qrcode.react";

import {
  getActiveTournament,
  setActiveTournament,
} from "../utils/storage";

import { saveTournament, loadAllTournaments } from "../utils/api";
import { generateNextRound } from "../utils/pairings";

export default function Dashboard() {
  const [list, setList] = useState([]);
  const [active, setActive] = useState("");

  // QR state
  const [qrUrl, setQrUrl] = useState("");
  const [qrRound, setQrRound] = useState("");
  const [qrRink, setQrRink] = useState("");

  // ---------------------------------------------------
  // LOAD TOURNAMENTS (BACKEND ONLY)
  // ---------------------------------------------------
  useEffect(() => {
    async function load() {
      const all = await loadAllTournaments();        // ★ CHANGED
      setList(Object.keys(all));
      setActive(getActiveTournament());
    }
    load();
  }, []);

  const openTournament = (name) => {
    setActiveTournament(name);
    setActive(name);
  };

  const deleteTournament = async (name) => {
    if (!window.confirm(`Delete tournament "${name}"?`)) return;

    const all = await loadAllTournaments();           // ★ CHANGED
    delete all[name];
    await saveTournament("__bulk__", all);            // ★ CHANGED (bulk save)

    setList(Object.keys(all));
    if (getActiveTournament() === name) {
      setActiveTournament("");
      setActive("");
    }
  };

  const renameTournament = async (oldName) => {
    const newName = prompt("New tournament name:", oldName);
    if (!newName || newName === oldName) return;

    const all = await loadAllTournaments();           // ★ CHANGED
    if (all[newName]) {
      alert("Tournament name already exists.");
      return;
    }

    all[newName] = all[oldName];
    delete all[oldName];

    await saveTournament("__bulk__", all);             // ★ CHANGED

    if (getActiveTournament() === oldName) {
      setActiveTournament(newName);
      setActive(newName);
    }

    setList(Object.keys(all));
  };

  const duplicateTournament = async (name) => {
    const newName = prompt("Name for duplicated tournament:");
    if (!newName) return;

    const all = await loadAllTournaments();            // ★ CHANGED
    if (all[newName]) {
      alert("Tournament name already exists.");
      return;
    }

    all[newName] = JSON.parse(JSON.stringify(all[name]));
    await saveTournament("__bulk__", all);             // ★ CHANGED
    setList(Object.keys(all));
  };

  // ---------------------------------------------------
  // GENERATE NEXT ROUND
  // ---------------------------------------------------
  const handleGenerateNextRound = async () => {
    const name = getActiveTournament();
    if (!name) {
      alert("No active tournament");
      return;
    }

    const all = await loadAllTournaments();
    const tournament = all[name];
    if (!tournament) {
      alert("Tournament not found");
      return;
    }

    const previousRounds = tournament.matches || [];
    const standings = tournament.teams.map(t => ({ team: t }));

    const nextRound = generateNextRound(standings, previousRounds);
    if (!nextRound.length) {
      alert("Could not generate new round");
      return;
    }

    
    tournament.matches = [...previousRounds, nextRound];
    await saveTournament(name, tournament);

    window.location.reload(); // simple + safe
  };

  // ---------------------------------------------------
  // QR BUILDER (FIXED)
  // ---------------------------------------------------
  const buildQrForRound = () => {
    if (!active) {
      alert("Select an active tournament first.");
      return;
    }
    if (!qrRound) {
      alert("Enter a round number.");
      return;
    }

    let url =
      `${window.location.origin}/player` +
      `?t=${encodeURIComponent(active)}` +
      `&round=${encodeURIComponent(qrRound)}`;       // ★ FIXED

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

            <Link to="/matches"><button className="btn-primary">Matches</button></Link>
            <Link to="/standings"><button className="btn-primary">Standings</button></Link>
            <Link to="/summary"><button className="btn-primary">Summary</button></Link>
          </div>

          <div style={{ marginTop: "2rem" }}>
            <h3>Generate QR Code for Players</h3>

            <div style={{ display: "flex", gap: 8 }}>
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
                <a href={qrUrl} target="_blank" rel="noreferrer">{qrUrl}</a>
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
