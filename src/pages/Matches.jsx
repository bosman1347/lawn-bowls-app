import { useState, useEffect } from "react";
import {
  loadTournaments,
  saveTournaments,
  getActiveTournament
} from "../utils/storage";

export default function Matches() {
  const [tournamentName, setTournamentName] = useState("");
  const [matches, setMatches] = useState([]);
  const [scoringMode, setScoringMode] = useState("standard"); // "standard" | "skins"

  // Load tournament
  useEffect(() => {
    const name = getActiveTournament();
    if (!name) return;

    const all = loadTournaments();
    const data = all[name];

    if (data) {
      setTournamentName(name);
      setMatches(data.matches);
      setScoringMode(data.scoringMode || "standard");
    }
  }, []);

  // For skins scoring
  const computeSkinsMatchTotals = (skins) => {
    let totalA = 0,
      totalB = 0;
    let skinPointsA = 0,
      skinPointsB = 0;

    skins.forEach((s) => {
      const a = s.a == null ? null : Number(s.a);
      const b = s.b == null ? null : Number(s.b);

      if (a != null) totalA += a;
      if (b != null) totalB += b;

      if (a != null && b != null) {
        if (a > b) skinPointsA += 1;
        else if (b > a) skinPointsB += 1;
        else {
          skinPointsA += 0.5;
          skinPointsB += 0.5;
        }
      }
    });

    // Bonus allocation **BY TOTAL SHOTS** (your clarified rule)
    let bonusA = 0,
      bonusB = 0;
    if (totalA > totalB) bonusA = 2;
    else if (totalB > totalA) bonusB = 2;
    else {
      // equal totals → split
      bonusA = 1;
      bonusB = 1;
    }

    const matchPointsA = skinPointsA + bonusA;
    const matchPointsB = skinPointsB + bonusB;

    return {
      totalA,
      totalB,
      skinPointsA,
      skinPointsB,
      bonusA,
      bonusB,
      matchPointsA,
      matchPointsB
    };
  };

  const updateStandardScore = (roundIndex, matchIndex, field, value) => {
    const newMatches = JSON.parse(JSON.stringify(matches));
    const m = newMatches[roundIndex][matchIndex];

    m[field] = value === "" ? null : Number(value);

    // Clear any skins fields in case user changed scoring mode
    delete m.skins;
    delete m.totalA;
    delete m.totalB;
    delete m.skinPointsA;
    delete m.skinPointsB;
    delete m.bonusA;
    delete m.bonusB;
    delete m.matchPointsA;
    delete m.matchPointsB;

    setMatches(newMatches);

    const all = loadTournaments();
    all[tournamentName].matches = newMatches;
    saveTournaments(all);
  };

  const updateSkinScore = (roundIndex, matchIndex, skinIndex, team, value) => {
    const newMatches = JSON.parse(JSON.stringify(matches));
    const m = newMatches[roundIndex][matchIndex];

    if (!m.skins) {
      m.skins = [
        { a: null, b: null },
        { a: null, b: null },
        { a: null, b: null }
      ];
    }

    m.skins[skinIndex][team] = value === "" ? null : Number(value);

    // Recalculate totals
    const totals = computeSkinsMatchTotals(m.skins);

    m.totalA = totals.totalA;
    m.totalB = totals.totalB;
    m.skinPointsA = totals.skinPointsA;
    m.skinPointsB = totals.skinPointsB;
    m.bonusA = totals.bonusA;
    m.bonusB = totals.bonusB;
    m.matchPointsA = totals.matchPointsA;
    m.matchPointsB = totals.matchPointsB;

    // Clear standard score fields (avoid conflicts)
    delete m.score1;
    delete m.score2;

    setMatches(newMatches);

    const all = loadTournaments();
    all[tournamentName].matches = newMatches;
    saveTournaments(all);
  };

  if (!tournamentName) {
    return <div className="page"><h2>No active tournament</h2></div>;
  }

  return (
    <div className="page">
      <h2>Match Scoring — {tournamentName}</h2>

      <p>Scoring Mode: <strong>{scoringMode}</strong></p>

      {matches.map((round, rIndex) => (
        <div key={rIndex} className="round-block">
          <h3>Round {rIndex + 1}</h3>

          {round.map((m, mIndex) => (
            <div key={mIndex} className="match-card">
              <h4>
                {m.team1} vs {m.team2}
              </h4>

              {scoringMode === "standard" ? (
                <div className="standard-score">
                  <input
                    type="number"
                    placeholder={m.team1}
                    value={m.score1 ?? ""}
                    onChange={(e) =>
                      updateStandardScore(rIndex, mIndex, "score1", e.target.value)
                    }
                  />
                  <span className="vs">vs</span>
                  <input
                    type="number"
                    placeholder={m.team2}
                    value={m.score2 ?? ""}
                    onChange={(e) =>
                      updateStandardScore(rIndex, mIndex, "score2", e.target.value)
                    }
                  />
                </div>
              ) : (
                <div className="skins-score">
                  {[0, 1, 2].map((s) => (
                    <div key={s} className="skin-row">
                      <span>Skin {s + 1}</span>

                      <input
                        type="number"
                        placeholder={m.team1}
                        value={m.skins?.[s]?.a ?? ""}
                        onChange={(e) =>
                          updateSkinScore(rIndex, mIndex, s, "a", e.target.value)
                        }
                      />

                      <span className="vs">vs</span>

                      <input
                        type="number"
                        placeholder={m.team2}
                        value={m.skins?.[s]?.b ?? ""}
                        onChange={(e) =>
                          updateSkinScore(rIndex, mIndex, s, "b", e.target.value)
                        }
                      />
                    </div>
                  ))}

                  {/* Summary block */}
                  {(m.totalA != null || m.totalB != null) && (
                    <div className="match-summary">
                      <small>
                        Totals — {m.team1}: {m.totalA ?? 0} , {m.team2}: {m.totalB ?? 0}
                        &nbsp; | Skins — {m.team1}: {m.skinPointsA ?? 0} , {m.team2}: {m.skinPointsB ?? 0}
                        &nbsp; | Bonus — {m.team1}: {m.bonusA ?? 0} , {m.team2}: {m.bonusB ?? 0}
                        &nbsp; | Match Points — {m.team1}: {m.matchPointsA ?? 0} , {m.team2}: {m.matchPointsB ?? 0}
                      </small>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
