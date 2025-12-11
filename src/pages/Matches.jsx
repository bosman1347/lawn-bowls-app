import { useState, useEffect, useRef } from "react";
import {
  loadTournaments,
  saveTournaments,
  getActiveTournament
} from "../utils/storage";
import {
  buildScorecardsZipForRound,
  buildScorecardsA4ForRound
} from "../utils/scorecards";

// Controls which rounds are expanded
const [openRounds, setOpenRounds] = useState({});

const toggleRound = (index) => {
  setOpenRounds((prev) => ({
    ...prev,
    [index]: !prev[index],
  }));
};

/*
 Matches.jsx
 - Supports Standard and Skins scoring
 - Debounced saves to storage
 - Highlights skins (win/draw)
 - Highlights completed + verified matches
 - Adds umpire verification with lock
 - Adds "Download Scorecards" for latest round
*/

export default function Matches() {
  const [tournamentName, setTournamentName] = useState("");
  const [matches, setMatches] = useState([]);
  const [scoringMode, setScoringMode] = useState("standard"); // "standard" | "skins"

  const saveTimeoutRef = useRef(null);

  // Load tournament
  useEffect(() => {
    const name = getActiveTournament();
    if (!name) return;

    const all = loadTournaments();
    const data = all[name];

    if (data) {
      setTournamentName(name);
      setMatches(data.matches || []);
      setScoringMode(data.scoringMethod || "standard");
    }
  }, []);

  // Debounced save helper
  const saveMatchesToStorage = (latestMatches) => {
    if (!tournamentName) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      try {
        const all = loadTournaments();
        if (!all[tournamentName]) all[tournamentName] = {};
        all[tournamentName].matches = latestMatches;
        saveTournaments(all);
      } catch (err) {
        console.error("Error saving matches:", err);
      }
      saveTimeoutRef.current = null;
    }, 300);
  };

  // For skins scoring
  const computeSkinsMatchTotals = (skins) => {
    let totalA = 0,
      totalB = 0;
    let skinPointsA = 0,
      skinPointsB = 0;

    (skins || []).forEach((s) => {
      const a = s?.a == null ? null : Number(s.a);
      const b = s?.b == null ? null : Number(s.b);

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

    // Bonus by TOTAL SHOTS (tie → split)
    let bonusA = 0,
      bonusB = 0;
    if (totalA > totalB) bonusA = 2;
    else if (totalB > totalA) bonusB = 2;
    else {
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

  // Standard match update (shallow update, debounced save)
  const updateStandardScore = (roundIndex, matchIndex, field, value) => {
    setMatches((prev) => {
      const next = prev.map((round, ri) =>
        ri !== roundIndex
          ? round
          : round.map((m, mi) => {
              if (mi !== matchIndex) return m;
              if (m.verified) return m; // lock when verified

              const updated = {
                ...m,
                [field]: value === "" ? null : Number(value)
              };

              // If typing standard scores, clear skins data
              if (field === "score1" || field === "score2") {
                delete updated.skins;
                delete updated.totalA;
                delete updated.totalB;
                delete updated.skinPointsA;
                delete updated.skinPointsB;
                delete updated.bonusA;
                delete updated.bonusB;
                delete updated.matchPointsA;
                delete updated.matchPointsB;
              }

              return updated;
            })
      );

      saveMatchesToStorage(next);
      return next;
    });
  };

  // Skins update (shallow update, debounced save)
  const updateSkinScore = (roundIndex, matchIndex, skinIndex, team, value) => {
    setMatches((prev) => {
      const next = prev.map((round, ri) =>
        ri !== roundIndex
          ? round
          : round.map((m, mi) => {
              if (mi !== matchIndex) return m;
              if (m.verified) return m; // lock when verified

              const updated = { ...m };
              if (!updated.skins) {
                updated.skins = [
                  { a: null, b: null },
                  { a: null, b: null },
                  { a: null, b: null }
                ];
              }

              // shallow copy skin row
              updated.skins = updated.skins.map((s, si) =>
                si === skinIndex ? { ...s } : s
              );
              updated.skins[skinIndex][team] =
                value === "" ? null : Number(value);

              // Recompute totals
              const totals = computeSkinsMatchTotals(updated.skins);
              updated.totalA = totals.totalA;
              updated.totalB = totals.totalB;
              updated.skinPointsA = totals.skinPointsA;
              updated.skinPointsB = totals.skinPointsB;
              updated.bonusA = totals.bonusA;
              updated.bonusB = totals.bonusB;
              updated.matchPointsA = totals.matchPointsA;
              updated.matchPointsB = totals.matchPointsB;

              // Clear standard fields if any
              delete updated.score1;
              delete updated.score2;

              return updated;
            })
      );

      saveMatchesToStorage(next);
      return next;
    });
  };

  // Toggle verification (full lock when verified)
  const toggleVerified = (roundIndex, matchIndex) => {
    setMatches((prev) => {
      const next = prev.map((round, ri) =>
        ri !== roundIndex
          ? round
          : round.map((m, mi) => {
              if (mi !== matchIndex) return m;

              const isStandardComplete =
                m.score1 != null && m.score2 != null;
              const isSkinsComplete =
                m.skins &&
                m.skins.length === 3 &&
                m.skins.every((s) => s?.a != null && s?.b != null);

              const isComplete =
                scoringMode === "standard"
                  ? isStandardComplete
                  : isSkinsComplete;

              if (!m.verified && !isComplete) {
                alert(
                  "You can only verify a match once all scores or skins are fully entered."
                );
                return m;
              }

              return { ...m, verified: !m.verified };
            })
      );

      saveMatchesToStorage(next);
      return next;
    });
  };

  // Download A6 scorecards ZIP (one card per PDF)
  const handleDownloadScorecardsZip = async () => {
    if (!tournamentName) {
      alert("No active tournament.");
      return;
    }
    if (!matches || matches.length === 0) {
      alert("No rounds are available yet.");
      return;
    }

    const roundIndex = matches.length - 1; // latest round
    const roundMatches = matches[roundIndex];

    if (!roundMatches || roundMatches.length === 0) {
      alert("The latest round has no matches.");
      return;
    }

    try {
      const zipBlob = await buildScorecardsZipForRound(
        tournamentName,
        roundIndex,
        roundMatches
      );

      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${tournamentName.replace(
        /[^a-z0-9\-]+/gi,
        "_"
      )}_round_${roundIndex + 1}_scorecards.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error building scorecards ZIP:", err);
      alert("Could not generate scorecards. See console for details.");
    }
  };

  // Download A4 (2 A6 cards per page)
  const handleDownloadScorecardsA4 = async () => {
    if (!tournamentName) {
      alert("No active tournament.");
      return;
    }
    if (!matches || matches.length === 0) {
      alert("No rounds are available yet.");
      return;
    }

    const roundIndex = matches.length - 1;
    const roundMatches = matches[roundIndex];

    if (!roundMatches || roundMatches.length === 0) {
      alert("The latest round has no matches.");
      return;
    }

    try {
      const pdfBlob = await buildScorecardsA4ForRound(
        tournamentName,
        roundIndex,
        roundMatches
      );

      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${tournamentName.replace(
        /[^a-z0-9\-]+/gi,
        "_"
      )}_round_${roundIndex + 1}_scorecards_A4.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error building A4 scorecards:", err);
      alert("Could not generate A4 scorecards. See console for details.");
    }
  };

  if (!tournamentName) {
    return (
      <div className="page">
        <h2>No active tournament</h2>
      </div>
    );
  }

  return (
    <div className="page">
      <h2>Match Scoring — {tournamentName}</h2>

      <p>
        Scoring Mode: <strong>{scoringMode}</strong>
      </p>

      <div
        style={{
          marginBottom: "1rem",
          display: "flex",
          gap: "0.5rem",
          flexWrap: "wrap"
        }}
      >
        <button
          className="btn-secondary"
          type="button"
          onClick={handleDownloadScorecardsZip}
        >
          Download A6 Scorecards (ZIP)
        </button>
        <button
          className="btn-secondary"
          type="button"
          onClick={handleDownloadScorecardsA4}
        >
          Download A4 Scorecards (2 per page)
        </button>
      </div>

      {matches.map((round, rIndex) => {
  const isOpen =
    openRounds[rIndex] !== undefined
      ? openRounds[rIndex]
      : rIndex === matches.length - 1; // last round open by default

  const verified = round.every((m) => m.verified);

  return (
    <div key={rIndex} className="round-block">

      {/* HEADER BAR */}
      <div
        className="round-header"
        onClick={() => toggleRound(rIndex)}
        style={{
          cursor: "pointer",
          background: verified ? "#d0ffd0" : "#e0e0e0",
          padding: "8px",
          marginTop: "14px",
          borderRadius: "4px",
          border: "1px solid #ccc",
        }}
      >
        <strong>
          {isOpen ? "▼" : "▶"} Round {rIndex + 1}
        </strong>
        {verified && <span style={{ marginLeft: "10px" }}>✓ Verified</span>}
      </div>

      {/* COLLAPSIBLE CONTENT */}
      {isOpen && (
        <div className="round-content" style={{ paddingLeft: "10px" }}>
          {round.map((match, mIndex) => (
            <div key={mIndex} className="match-block">
              {/* your existing score UI stays exactly the same here */}
              { /* NOTHING about scoring is changed */ }
            </div>
          ))}
        </div>
      )}
    </div>
  );
})}


                    {(m.totalA != null || m.totalB != null) && (
                      <div className="match-summary">
                        <small>
                          Totals — {m.team1}: {m.totalA ?? 0} , {m.team2}:{" "}
                          {m.totalB ?? 0}
                          &nbsp; | Skins — {m.team1}: {m.skinPointsA ?? 0} ,{" "}
                          {m.team2}: {m.skinPointsB ?? 0}
                          &nbsp; | Bonus — {m.team1}: {m.bonusA ?? 0} ,{" "}
                          {m.team2}: {m.bonusB ?? 0}
                          &nbsp; | Match Points — {m.team1}:{" "}
                          {m.matchPointsA ?? 0} , {m.team2}:{" "}
                          {m.matchPointsB ?? 0}
                        </small>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
