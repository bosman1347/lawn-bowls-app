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
  const [scoringMethod, setScoringMethod] = useState("standard");

  // Update team count
  const handleNumTeamsChange = (e) => {
    const value = parseInt(e.target.value, 10);
    setNumTeams(value);

    if (value > teams.length) {
      setTeams([...teams, ...Array(value - teams.length).fill("")]);
    } else {
      setTeams(teams.slice(0, value));
    }
  };

  // Update team name
  const updateTeamName = (index, value) => {
    const updated = [...teams];
    updated[index] = value;
    setTeams(updated);
  };

  // Create tournament
  const createTournament = () => {
    if (!name.trim()) {
      alert("Please enter a tournament name");
      return;
    }

    const trimmedTeams = teams.map((t) => t.trim()).filter(Boolean);
    if (trimmedTeams.length < 2) {
      alert("Please enter at least 2 team names");
      return;
    }

    // Generate round robin fixtures
    const rounds = [];
    const list = [...trimmedTeams];

    // Add BYE if odd
    if (list.length % 2 === 1) list.push("BYE");

    const totalTeams = list.length;
    const half = totalTeams / 2;

    for (let r = 0; r < totalTeams - 1; r++) {
      const round = [];

      for (let i = 0; i < half; i++) {
        const t1 = list[i];
        const t2 = list[totalTeams - 1 - i];

        if (t1 !== "BYE" && t2 !== "BYE") {
          round.push({
            team1: t1,
            team2: t2,
            scoringMethod,
            score1: null,
            score2: null,
            skins: [
              { a: null, b: null },
              { a: null, b: null },
              { a: null, b: null }
            ]
          });
        }
      }

      rounds.push(round);

      // Rotation except first
      const fixed = list.shift();
      const last = list.pop();
      list.unshift(fixed);
      list.splice(1, 0, last);
    }

    const all = loadTournaments();
    all[name] = {
      tournament: trimmedTeams,
      scoringMethod,
      matches: rounds,
      results: {}
    };

    saveTournaments(all);
    setActiveTournament(name);

    window.location.href = "/matches";
  };

  return (
    <div className="page">
      <h2>Create New Tournament</h2>

      <div className="form-group">
        <label className="form-label">Tournament Name</label>
        <input
          className="form-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter tournament name"
        />
      </div>

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

      <div className="form-group">
        <label className="form-label">Scoring Method</label>
        <select
          className="form-input"
          value={scoringMethod}
          onChange={(e) => setScoringMethod(e.target.value)}
        >
          <option value="standard">Standard (Total Shots)</option>
          <option value="skins">Skins (3 × 5 ends)</option>
        </select>
      </div>

      <h3>Team Names</h3>
      {Array.from({ length: numTeams }, (_, i) => (
        <div key={i} className="form-group">
          <input
            className="form-input"
            placeholder={`Team ${i + 1}`}
            value={teams[i] || ""}
            onChange={(e) => updateTeamName(i, e.target.value)}
          />
        </div>
      ))}

      <button className="form-button" onClick={createTournament}>
        Create Tournament
      </button>
    </div>
  );
}
