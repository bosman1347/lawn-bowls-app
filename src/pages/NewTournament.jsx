import { useState } from "react";


export default function NewTournament() {
  const [name, setName] = useState("");
  const [numTeams, setNumTeams] = useState(4);
  const [teams, setTeams] = useState(["", "", "", ""]);
  const [scoringMethod, setScoringMethod] = useState("standard");

  // Keep teams array in sync with numTeams
  const handleNumTeamsChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (Number.isNaN(value) || value < 2) {
      setNumTeams(2);
      setTeams((prev) => prev.slice(0, 2));
      return;
    }

    setNumTeams(value);

    setTeams((prev) => {
      if (value > prev.length) {
        return [...prev, ...Array(value - prev.length).fill("")];
      } else {
        return prev.slice(0, value);
      }
    });
  };
  

  const updateTeamName = (index, value) => {
    setTeams((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

 const createTournament = async () => {
  const trimmedName = name.trim();
  if (!trimmedName) {
    alert("Please enter a tournament name.");
    return;
  }

  const trimmedTeams = teams.map(t => t.trim()).filter(Boolean);
  if (trimmedTeams.length < 2) {
    alert("Please enter at least 2 team names.");
    return;
  }

  const tournamentData = {
    name: trimmedName,
    teams: trimmedTeams,
    scoringMethod,
    matches: [],
    created: Date.now(),
  };

  await saveTournament(trimmedName, tournamentData);
  setActiveTournament(trimmedName);

  window.location.href = "/";
};



    const trimmedTeams = teams.map((t) => t.trim()).filter(Boolean);
    if (trimmedTeams.length < 2) {
      alert("Please enter at least 2 team names.");
      return;
    }

    

    if (all[trimmedName]) {
      const overwrite = window.confirm(
        `A tournament called "${trimmedName}" already exists. Overwrite it?`
      );
      if (!overwrite) return;
    }

    // ✅ Unified tournament shape (Option A)
    all[trimmedName] = {
      name: trimmedName,
      teams: trimmedTeams,          // <— team list here
      scoringMethod,                // "standard" or "skins"
      matches: [],                  // rounds will be generated later
      results: {}                   // reserved for future use
    };

    

    setActiveTournament(trimmedName);

    // Go back to Dashboard (home page)
    window.location.href = "/";
  };

  //return (
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
          <option value="standard">Standard (total shots)</option>
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

