import { useState } from "react";
import { saveTournament } from "../utils/api";
import { setActiveTournament } from "../utils/storage";

export default function NewTournament() {
  const [name, setName] = useState("");
  const [numTeams, setNumTeams] = useState(4);
  const [teams, setTeams] = useState(Array(4).fill(""));
  const [scoringMethod, setScoringMethod] = useState("skins");

  // Update number of teams and resize team list
  const handleNumTeamsChange = (e) => {
    const n = Math.max(2, parseInt(e.target.value || "2", 10));
    setNumTeams(n);
    setTeams((prev) => {
      const copy = [...prev];
      while (copy.length < n) copy.push("");
      return copy.slice(0, n);
    });
  };

  const handleTeamNameChange = (index, value) => {
    setTeams((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  const createTournament = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      alert("Please enter a tournament name.");
      return;
    }

    const cleanedTeams = teams.map(t => t.trim()).filter(Boolean);
    if (cleanedTeams.length < 2) {
      alert("Please enter at least two team names.");
      return;
    }

    const tournamentData = {
      name: trimmedName,
      teams: cleanedTeams,
      scoringMethod,
      matches: [],
      created: Date.now(),
    };

    await saveTournament(trimmedName, tournamentData);
    setActiveTournament(trimmedName);

    // Go back to dashboard
    window.location.href = "/";
  };

  return (
    <div className="page">
      <h2>Create New Tournament</h2>

      <div className="form-group">
        <label>Tournament name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter tournament name"
        />
      </div>

      <div className="form-group">
        <label>Number of teams</label>
        <input
          type="number"
          min="2"
          value={numTeams}
          onChange={handleNumTeamsChange}
        />
      </div>

      <div className="form-group">
        <label>Scoring method</label>
        <select
          value={scoringMethod}
          onChange={(e) => setScoringMethod(e.target.value)}
        >
          <option value="skins">Skins</option>
          <option value="standard">Standard</option>
        </select>
      </div>

      <h3>Teams</h3>
      {teams.map((team, idx) => (
        <div key={idx} className="form-group">
          <input
            value={team}
            onChange={(e) => handleTeamNameChange(idx, e.target.value)}
            placeholder={`Team ${idx + 1}`}
          />
        </div>
      ))}

      <button className="btn-primary" onClick={createTournament}>
        Create Tournament
      </button>
    </div>
  );
}
