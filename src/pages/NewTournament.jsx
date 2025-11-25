import { useState } from "react";

export default function NewTournament() {
  const [numTeams, setNumTeams] = useState(4);
  const [teams, setTeams] = useState(["", "", "", ""]);

  // Update number of teams and resize team name array
  const handleNumTeamsChange = (e) => {
    const value = parseInt(e.target.value, 10);
    setNumTeams(value);

    // Resize the teams array
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

  const handleStart = () => {
    const trimmed = teams.map((t) => t.trim());

    // Validation
    if (trimmed.some((t) => t === "")) {
      alert("All team names must be filled in.");
      return;
    }
    const duplicates = trimmed.filter((t, i) => trimmed.indexOf(t) !== i);
    if (duplicates.length > 0) {
      alert("Duplicate team names detected. All names must be unique.");
      return;
    }

    // Save the tournament to local storage for now
    const tournament = {
      numTeams,
      teams: trimmed,
      created: new Date().toISOString(),
    };

    localStorage.setItem("tournament", JSON.stringify(tournament));

    alert("Tournament saved! (Matches generated in next phase)");
  };

  return (
    <div className="page">
      <h2>Create a New Tournament</h2>

      <label style={{ display: "block", marginBottom: "1rem" }}>
        Number of Teams:
        <input
          type="number"
          min="2"
          max="32"
          value={numTeams}
          onChange={handleNumTeamsChange}
          style={{ marginLeft: "1rem", width: "60px" }}
        />
      </label>

      <h3>Team Names</h3>

      {teams.map((name, index) => (
        <div key={index} style={{ marginBottom: "0.5rem" }}>
          <input
            type="text"
            placeholder={`Team ${index + 1}`}
            value={name}
            onChange={(e) =>
              handleTeamNameChange(index, e.target.value)
            }
            style={{ padding: "0.5rem", width: "250px" }}
          />
        </div>
      ))}

      <button onClick={handleStart} style={{ marginTop: "1.5rem" }}>
        Save Tournament
      </button>
    </div>
  );
}