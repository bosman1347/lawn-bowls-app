// src/pages/PlayerEntry.jsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  loadTournaments,
  saveTournaments,
  getActiveTournament,
  setActiveTournament,
} from "../utils/storage";

function parseRinkParam(rinkParam) {
  if (!rinkParam) return null;
  // Accept forms like "A3" or "A-3" or "A:3"
  const m = String(rinkParam).match(/^([A-Za-z])\D*([0-9]+)$/);
  if (!m) return null;
  return { green: m[1].toUpperCase(), rink: Number(m[2]) };
}

export default function PlayerEntry() {
  const [searchParams] = useSearchParams();
  const tournamentName = searchParams.get("tournament");
  const roundParam = search.get("r"); // round index (1-based)
  const rinkParam = search.get("rink"); // e.g. "A3"
  const [match, setMatch] = useState(null);
  const [tournamentName, setTournamentName] = useState(tParam || "");
  const [mode, setMode] = useState("skins"); // default
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const all = loadTournaments();
    let name = tParam || getActiveTournament();
    if (!name || !all[name]) {
      setMsg("Tournament not found. Ask the organiser to give the correct link.");
      return;
    }
    setTournamentName(name);

    const data = all[name];
    const roundIndex = roundParam ? Math.max(0, Number(roundParam) - 1) : (data.matches ? data.matches.length - 1 : -1);
    const rink = parseRinkParam(rinkParam);

    if (roundIndex < 0 || !Array.isArray(data.matches) || !data.matches[roundIndex]) {
      setMsg("Round not found.");
      return;
    }

    // Find single match for the rink if specified, otherwise find all matches for the round (if multiple, pick first)
    const round = data.matches[roundIndex];
    let found = null;
    if (rink) {
      found = round.find(m => String(m.green).toUpperCase() === rink.green && Number(m.rink) === rink.rink);
    } else {
      // If there is only one match for the pair (rare), pick the first; but normally we expect rink param
      found = round.length === 1 ? round[0] : null;
    }

    // If not found, fallback to first match for the round (useful if QR was for round only)
    if (!found) found = round[0];

    if (!found) {
      setMsg("Match not found for this round/rink.");
      return;
    }

    setMatch(found);
    setMode(found.skins ? "skins" : (found.score1 !== undefined || found.score2 !== undefined ? "standard" : data.scoringMethod || "skins"));
  }, [tParam, roundParam, rinkParam]);

  if (msg) {
    return (
      <div className="page">
        <h2>Score Entry</h2>
        <p>{msg}</p>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="page">
        <h2>Score Entry</h2>
        <p>Loading match...</p>
      </div>
    );
  }

  // Local inputs (not yet saved)
  const [local, setLocal] = useState(() => {
    // Initialize from match data if present
    return {
      skins: (match.skins && JSON.parse(JSON.stringify(match.skins))) || [{ a: "", b: "" }, { a: "", b: "" }, { a: "", b: "" }],
      score1: match.score1 ?? "",
      score2: match.score2 ?? "",
    };
  });

  const updateLocalSkin = (index, teamKey, val) => {
    setLocal(prev => {
      const s = prev.skins.map((r, i) => (i === index ? { ...r, [teamKey]: val } : r));
      return { ...prev, skins: s };
    });
  };

  const saveFromMobile = () => {
    // Validate: at least some numbers present
    const all = loadTournaments();
    const data = all[tournamentName];
    if (!data) {
      setMsg("Tournament data disappeared. Ask organiser.");
      return;
    }
    const roundIndex = roundParam ? Math.max(0, Number(roundParam) - 1) : (data.matches ? data.matches.length - 1 : -1);
    if (roundIndex < 0) { setMsg("Round index invalid."); return; }
    const round = data.matches[roundIndex];
    if (!round) { setMsg("Round not found."); return; }

    // find match by green+rink or by teams
    const rink = parseRinkParam(rinkParam);
    let idx = -1;
    if (rink) {
      idx = round.findIndex(m => String(m.green).toUpperCase() === rink.green && Number(m.rink) === rink.rink);
    } else {
      // fallback via teams
      idx = round.findIndex(m => m.team1 === match.team1 && m.team2 === match.team2);
    }
    if (idx === -1) { setMsg("Could not locate match in storage."); return; }

    const copy = JSON.parse(JSON.stringify(round[idx]));
    if (mode === "skins") {
      // convert local.skins to numbers or null
      copy.skins = local.skins.map(s => ({ a: s.a === "" ? null : Number(s.a), b: s.b === "" ? null : Number(s.b) }));
      // compute totals (client-side simple)
      let totalA = 0, totalB = 0, skinA = 0, skinB = 0;
      copy.skins.forEach(s => {
        if (s.a != null) totalA += s.a;
        if (s.b != null) totalB += s.b;
        if (s.a != null && s.b != null) {
          if (s.a > s.b) skinA++;
          else if (s.b > s.a) skinB++;
          else { skinA += 0.5; skinB += 0.5; }
        }
      });
      let bonusA = 0, bonusB = 0;
      if (totalA > totalB) bonusA = 2; else if (totalB > totalA) bonusB = 2; else { bonusA = 1; bonusB = 1; }
      copy.totalA = totalA; copy.totalB = totalB;
      copy.skinPointsA = skinA; copy.skinPointsB = skinB;
      copy.bonusA = bonusA; copy.bonusB = bonusB;
      copy.matchPointsA = skinA + bonusA; copy.matchPointsB = skinB + bonusB;
    } else {
      copy.score1 = local.score1 === "" ? null : Number(local.score1);
      copy.score2 = local.score2 === "" ? null : Number(local.score2);
    }

    // Mark as not verified (players submit; umpire verifies later)
    copy.verified = false;

    // Save back to tournament
    round[idx] = copy;
    data.matches[roundIndex] = round;
    all[tournamentName] = data;
    saveTournaments(all);

    setMsg("Scores saved. Ask the umpire to verify.");
  };

  return (
    <div className="page" style={{ padding: 12 }}>
      <h2>Enter Scores — {match.team1} vs {match.team2}</h2>
      <div style={{ marginBottom: 8 }}>
        <small>Round: {roundParam || "(latest)"} {match.green ? ` — Green ${match.green} Rink ${match.rink}` : ""}</small>
      </div>

      {mode === "skins" ? (
        <div>
          {local.skins.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
              <div style={{ width: 50, fontWeight: 700 }}>S{k(i)}</div>
              <input type="number" inputMode="numeric" placeholder={match.team1} value={s.a} onChange={(e) => updateLocalSkin(i, "a", e.target.value)} style={{ width: 80 }} />
              <div style={{ fontWeight: 700 }}>vs</div>
              <input type="number" inputMode="numeric" placeholder={match.team2} value={s.b} onChange={(e) => updateLocalSkin(i, "b", e.target.value)} style={{ width: 80 }} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input type="number" inputMode="numeric" placeholder={match.team1} value={local.score1} onChange={(e) => setLocal(prev => ({ ...prev, score1: e.target.value }))} style={{ width: 90 }} />
          <div style={{ fontWeight: 700 }}>vs</div>
          <input type="number" inputMode="numeric" placeholder={match.team2} value={local.score2} onChange={(e) => setLocal(prev => ({ ...prev, score2: e.target.value }))} style={{ width: 90 }} />
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <button onClick={saveFromMobile} className="btn-primary">Save scores (will be unverified)</button>
      </div>

      <div style={{ marginTop: 16, color: "#666" }}>
        <p><strong>Note:</strong> Scores saved from the mobile entry page are <em>not verified</em>. The umpire should check the paper cards and use the normal app verification controls to confirm results.</p>
      </div>
    </div>
  );
}

// tiny helper for skins labels
function k(i) { return `S${i+1}`; }
