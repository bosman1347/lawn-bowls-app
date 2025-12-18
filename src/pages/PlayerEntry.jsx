import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { loadAllTournaments, saveTournament } from "../utils/api";
import { resolveTournament } from "../utils/tournamentContext";

export default function PlayerEntry() {
  const [searchParams] = useSearchParams();
  const tournamentName = resolveTournament(searchParams);

  const [tournament, setTournament] = useState(null);
  const [roundIndex, setRoundIndex] = useState(null);
  const [matchIndex, setMatchIndex] = useState(null);
  const [match, setMatch] = useState(null);
  const [message, setMessage] = useState("");

  // 📥 Load tournament from backend
  useEffect(() => {
    if (!tournamentName) return;

    async function load() {
      const all = await loadAllTournaments();
      const t = all[tournamentName];
      if (!t || !t.matches || t.matches.length === 0) {
        setMessage("No matches yet.");
        return;
      }

      // Always load the latest round
      const r = t.matches.length - 1;
      const m = 0; // first match for now (can extend later)

      setTournament(t);
      setRoundIndex(r);
      setMatchIndex(m);
      setMatch(t.matches[r][m]);
    }

    load();
  }, [tournamentName]);

  // 📝 Update skin score
  const updateSkin = (skin, team, value) => {
    const updated = structuredClone(match);
    updated.skins[skin][team] = Number(value);
    setMatch(updated);
  };

  // 💾 Save scores
  const saveScores = async () => {
    if (!tournament || roundIndex === null || matchIndex === null) return;

    const updatedTournament = structuredClone(tournament);
    updatedTournament.matches[roundIndex][matchIndex] = match;

    await saveTournament(tournamentName, updatedTournament);
    setTournament(updatedTournament);
    setMessage("Scores saved.");
  };

  // ✅ Verify match
  const verifyMatch = async () => {
    if (!tournament) return;

    const updatedTournament = structuredClone(tournament);
    updatedTournament.matches[roundIndex][matchIndex].verified = true;

    await saveTournament(tournamentName, updatedTournament);
    setTournament(updatedTournament);
    setMatch(updatedTournament.matches[roundIndex][matchIndex]);
    setMessage("Match verified.");
  };

  // ❌ Unverify match
  const unverifyMatch = async () => {
    if (!tournament) return;

    const updatedTournament = structuredClone(tournament);
    updatedTournament.matches[roundIndex][matchIndex].verified = false;

    await saveTournament(tournamentName, updatedTournament);
    setTournament(updatedTournament);
    setMatch(updatedTournament.matches[roundIndex][matchIndex]);
    setMessage("Verification removed.");
  };

  // 🛑 Guards
  if (!tournamentName) {
    return (
      <div className="page">
        <h2>Tournament not found</h2>
        <p>Please scan the correct QR code.</p>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="page">
        <h2>Matches (Player Entry)</h2>
        <p>{message || "Loading..."}</p>
      </div>
    );
  }

  return (
    <div className="page">
      <h2>{tournamentName}</h2>
      <h3>Matches (Player Entry)</h3>

      <div className="match-card">
        <h4>
          {match.team1} vs {match.team2}
        </h4>

        {[0, 1, 2].map((skin) => (
          <div key={skin} className="skin-row">
            <strong>Skin {skin + 1}</strong>

            <input
              type="number"
              value={match.skins[skin].team1 ?? ""}
              onChange={(e) => updateSkin(skin, "team1", e.target.value)}
            />

            <span>vs</span>

            <input
              type="number"
              value={match.skins[skin].team2 ?? ""}
              onChange={(e) => updateSkin(skin, "team2", e.target.value)}
            />
          </div>
        ))}

        <div className="button-row">
          <button className="btn-primary" onClick={saveScores}>
            Save Scores
          </button>

          {!match.verified ? (
            <button className="btn-secondary" onClick={verifyMatch}>
              Verify ✓
            </button>
          ) : (
            <button className="btn-danger" onClick={unverifyMatch}>
              Unverify
            </button>
          )}
        </div>

        {message && <p>{message}</p>}
      </div>
    </div>
  );
}
