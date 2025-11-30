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

    const tournament = {
      name,
      numTeams,
      teams: trimmed,
      created: new Date().toISOString(),
    };
	
	saveTournaments(all);
    setActiveTournament(name);

       // Generate matches
    const matchRounds = generateRoundRobin(trimmed);
    localStorage.setItem("matches", JSON.stringify(matchRounds));

    alert("Tournament created successfully!");
    window.location.href = "/matches";
  };


  //-------------------------------------------------------
  // Round Robin generator - fully working
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
        const teamA = left[i];
        const teamB = right[i];
        if (teamA !== "BYE" && teamB !== "BYE") {
          round.push({ teamA, teamB });
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

        {/* Team Names */}
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
        <button className="form-button" onClick={createTournament}>
          Create Tournament
        </button>

      </div>
    </div>
  );
}


