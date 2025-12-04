import { useState } from "react";

import {
  loadTournaments,
  saveTournaments,
  setActiveTournament
} from "../utils/storage";

export default function NewTournament() {
  const [name, setName] = useState("");
  const [numTeams, setNumTeams] = useState(4);
  const [teams, setTeams] = useState(["", "", "", ""]);
  const [scoringMode, setScoringMode] = useState("standard"); // "standard" or "skins"

  // Update team count & resize list
  const handleNumTeamsChange = (e) => {
    const value = parseInt(e.target.value, 10) || 2;
    setNumTeams(value);

    const updated = [...teams];
    if (value > updated.length) {
      while (updated.length < value) updated.push("");
    } else {
      updated.length = value;
    }
    setTeams(updated);
  };

  const handleTeamNameChange = (i, value) => {
    const updated = [...teams];
    updated[i] = value;
    setTeams(updated);
  };

  // CREATE & SAVE TOURNAMENT
  const createTournament = () => {
    const trimmed = teams.map((t) => t.trim());

    if (name.trim() === "") {
      alert("Please enter a tournament name.");
      return;
    }

    if (trimmed.some((t) => t === "")) {
      alert("All team names must be filled in.");
      return;
    }

    const duplicates = trimmed.filter((t, i) => trimmed.indexOf(t) !== i);
    if (duplicates.length > 0) {
      alert("Duplicate team names detected.");
      return;
    }

    // Generate matches: use round-robin generator (keeps same structure)
    const matchRounds = generateRoundRobin(trimmed);

    // Load existing tournaments
    const all = loadTournaments();

    if (all[name]) {
      alert("A tournament with that name already exists.");
      return;
    }

    // Create minimal matches structure:
    // For standard matches each match object will be { team1, team2, score1: null, score2: null }
    // For skins mode, we'll store matches as { team1, team2, skins: [{a:null,b:null}, ...], totalA:0, totalB:0, skinPointsA:0, skinPointsB:0, bonusA:0, bonusB:0, matchPointsA:0, matchPointsB:0 }
    const preparedRounds = matchRounds.map((round) =>
      round.map((m) =>
        scoringMode === "skins"
          ? {
              team1: m.team1,
              team2: m.team2,
              skins: [
                { a: null, b: null },
                { a: null, b: null },
                { a: null, b: null }
              ],
              totalA: 0,
              totalB: 0,
              skinPointsA: 0,
              skinPointsB: 0,
              bonusA: 0,
              bonusB: 0,
              matchPointsA: 0,
              matchPointsB: 0
            }
          : { team1: m.team1, team2: m.team2, score1: null, score2: null }
      )
    );

    // Add new tournament
    all[name] = {
      name,
      numTeams,
      teams: trimmed,
      scoringMode,
      created: new Date().toISOString(),
      matches: preparedRounds,
      results: {}
    };

    // Save database
    saveTournaments(all);

    // Set active tournament
    setActiveTournament(name);

    alert("Tournament created successfully!");

    window.location.href = "/matches";
  };

  //-------------------------------------------------------
  // Round Robin generator (simple)
  //-------------------------------------------------------
  function generateRoundRobin(teams) {
    const n = teams.length;
    const isOdd = n % 2 !== 0;

    const list = isOdd ? [...teams, "BYE"] : [...teams];
    const total = list.length;

    const rounds = total - 1;
    const half = total / 2;
    const result = [];

    let rotating = list.slice(1);

    for (let r = 0; r < rounds; r++) {
      const round = [];
      const left = [list[0], ...rotating.slice(0, half - 1)];
      const right = rotating.slice(half - 1).reverse();

      for (let i = 0; i < half; i++) {
        const team1 = left[i];
        const team2 = right[i];

        if (team1 !== "BYE" && team2 !== "BYE") {
          round.push({
            team1,
            team2
          });
        }
      }

      result.push(round);

      rotating.push(rotating.shift());
    }

    return result;
  }

  //-------------------------------------------------------
  // RENDER UI
  //-------------------------------------------------------
  return (
    <div className="page">
      <h1>Create New Tournament</h1>

      <div className="form-card">
        {/* Tournament Name */}
        <div className="form-group">
          <label className="form-label">Tournament Name</label>
          <input
            className="form-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Summer Pairs 2025"
          />
        </div>

        {/* Scoring Mode */}
        <div className="form-group">
          <label className="form-label">Scoring Mode</label>
          <select
            className="form-input"
            value={scoringMode}
            onChange={(e) => setScoringMode(e.target.value)}
          >
            <option value="standard">Standard (2–1–0; optional bonus)</option>
            <option value="skins">Skins / Sets (3 × 5 ends)</option>
          </select>
        </div>

        {/* Number of Teams */}
        <div className="form-group">
          <label className="form-label">Number of Teams</label>
          <input
            className="form-input"
            type="number"
            min="2"
            value={numTeams}
            onChange={handleNumTeamsChange}
          />
        </div>

        {/* Team Inputs */}
        <div className="form-group">
          <label className="form-label">Team Names</label>
          {teams.map((team, i) => (
            <input
              key={i}
              className="form-input"
              type="text"
              value={team}
              onChange={(e) => handleTeamNameChange(i, e.target.value)}
              placeholder={`Team ${i + 1}`}
              style={{ marginBottom: "0.6rem" }}
            />
          ))}
        </div>

        {/* Create button */}
        <button className="btn-primary" onClick={createTournament}>
          Create Tournament
        </button>
      </div>
    </div>
  );
}
