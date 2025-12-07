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
    if (Number.isNaN(value) || value < 2) {
      setNumTeams(2);
      setTeams(teams.slice(0, 2));
      return;
    }

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

  // Create tournament (no fixtures yet – Twilight engine will generate rounds)
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

    const all = loadTournaments();

    if (all[name]) {
      const overwrite = window.confirm(
        `A tournament called "${name}" already exists. Overwrite it?`
      );
      if (!overwrite) return;
    }

    all[name] = {
      name,
      numTeams: trimmedTeams.length,
      tournament: trimmedTeams,   // team list
      scoringMethod,              // "standard" or "skins"
      matches: [],                // IMPORTANT: no rounds yet
      results: {}
    };

    saveTournaments(all);
    setActiveTournament(name);

    // Go to dashboard so you can click "Generate Next Round"
    window.location.href = "/dashboard";
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
