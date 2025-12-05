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

  // Update team count & resize list
  const handleNumTeamsChange = (e) => {
    const value = parseInt(e.target.value, 10);
    setNumTeams(value);

    if (value > teams.length) {
      setTeams([...teams, ...Array(value - teams.length).fill("")]);
    } else {
      setTeams(teams.slice(0, value));
    }
  };

  // Update name of a team
  const updateTeamName = (index, value) => {
    const updated = [...teams];
    updated[index] = value;
    setTeams(updated);
  };

  // Create tournament & generate fixtures
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

    // Generate round-robin fixtures
    const rounds = [];
    const list = [...trimmedTeams];

    // If odd number of teams — add a BYE
    if (list.length % 2 === 1) list.push("BYE");

    const totalTeams = list.length;
    const half = totalTeams / 2;

    for (let r = 0; r < totalTeams - 1; r++) {
      const round = [];
      for (let i = 0; i < half; i++) {
        const team1 = list[i];
        const team2 = list[totalTeams - 1 - i];
        if (team1 !== "BYE" && team2 !== "BYE") {
          round.push({
            team1,
            team2,
            score1: null,
            score2: null,
            skins: null
          });
        }
      }
      rounds.push(round);

      // Rotate teams except the first
      const fixed = list.shift();
      const last = list.pop();
      list.unshift(fixed);
      list.splice(1, 0, last);
    }

    // Save tournament
    const all = loadTournaments();
    all[name] = {
      tournament: trimmedTeams,
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
          value={numTeams}
          onChange={handleNumTeamsChange}
          min="2"
        />
      </div>

      <h3>Team Names</h3>
      {Array.from({ length: numTeams }, (_, i) => (
        <div key={i} className="form-group">
          <input
            className="form-input"
            value={teams[i] || ""}
            onChange={(e) => updateTeamName(i, e.target.value)}
            placeholder={`Team ${i + 1}`}
          />
        </div>
      ))}

      <button className="form-button" onClick={createTournament}>
        Create Tournament
      </button>
    </div>
  );
}
