import React, { useState, useEffect, useRef } from "react";
import {
  loadTournaments,
  saveTournaments,
  getActiveTournament,
} from "../utils/storage";
import { buildScorecardsZipForRound, buildScorecardsA4ForRound } from "../utils/scorecards";

/*
 Matches.jsx
 - Collapsible rounds (Option B: colored header bars)
 - Latest round expanded by default
 - Preserves green & rink in all updates
 - Supports standard & skins scoring
 - Verification lock
 - Download scorecards (uses utils/scorecards)
*/

export default function Matches() {
  const [tournamentName, setTournamentName] = useState("");
  const [matches, setMatches] = useState([]); // array of rounds
  const [scoringMode, setScoringMode] = useState("standard"); // "standard" | "skins"

  // Controls which rounds are expanded (index => bool)
  const [openRounds, setOpenRounds] = useState({});
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    const name = getActiveTournament();
    if (!name) return;

    const all = loadTournaments();
    const data = all[name];
    if (data) {
      setTournamentName(name);
      setMatches(data.matches || []);
      setScoringMode(data.scoringMethod || "standard");

      // default: open only the latest round
      const lastIndex = (data.matches || []).length - 1;
      const initOpen = {};
      if (lastIndex >= 0) initOpen[lastIndex] = true;
      setOpenRounds(initOpen);
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
    }, 250);
  };

  // Toggle round open/closed
  const toggleRound = (index) => {
    setOpenRounds((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Update standard score (preserve green & rink)
  const updateStandardScore = (roundIndex, matchIndex, field, value) => {
    setMatches((prev) => {
      const next = prev.map((round, ri) => {
        if (ri !== roundIndex) return round;
        return round.map((m, mi) => {
          if (mi !== matchIndex) return m;
          if (m.verified) return m; // lock when verified

          const updated = {
            ...m,
            green: m.green,
            rink: m.rink,
            [field]: value === "" ? null : Number(value),
          };

          // If standard scores entered, clear skins data
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
        });
      });

      saveMatchesToStorage(next);
      return next;
    });
  };

  // Compute skins totals for a match
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
      matchPointsB,
    };
  };

  // Update skins score (preserve green & rink)
  const updateSkinScore = (roundIndex, matchIndex, skinIndex, teamKey, value) => {
    setMatches((prev) => {
      const next = prev.map((round, ri) => {
        if (ri !== roundIndex) return round;
        return round.map((m, mi) => {
          if (mi !== matchIndex) return m;
          if (m.verified) return m; // lock when verified

          const updated = { ...m, green: m.green, rink: m.rink };

          if (!updated.skins) {
            updated.skins = [
              { a: null, b: null },
              { a: null, b: null },
              { a: null, b: null },
            ];
          }

          // Ensure shallow copy
          updated.skins = updated.skins.map((s, si) => (si === skinIndex ? { ...s } : s));
          updated.skins[skinIndex][teamKey] = value === "" ? null : Number(value);

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
        });
      });

      saveMatchesToStorage(next);
      return next;
    });
  };

  // Toggle verification / lock
  const toggleVerified = async (roundIndex, matchIndex) => {
    setMatches((prev) => {
      const next = prev.map((round, ri) => {
        if (ri !== roundIndex) return round;
        return round.map((m, mi) => {
          if (mi !== matchIndex) return m;

          const isStandardComplete = m.score1 != null && m.score2 != null;
          const isSkinsComplete =
            m.skins && m.skins.length === 3 && m.skins.every((s) => s?.a != null && s?.b != null);

          const isComplete = scoringMode === "standard" ? isStandardComplete : isSkinsComplete;

          if (!m.verified && !isComplete) {
            alert("You can only verify a match once all scores or skins are fully entered.");
            return m;
          }

          return { ...m, green: m.green, rink: m.rink, verified: !m.verified };
        });
      });

      saveMatchesToStorage(next);
      return next;
    });
    await saveTournament(activeTournamentName, tournament);
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

    const roundIndex = matches.length - 1;
    const roundMatches = matches[roundIndex];

    if (!roundMatches || roundMatches.length === 0) {
      alert("The latest round has no matches.");
      return;
    }

    try {
      const zipBlob = await buildScorecardsZipForRound(tournamentName, roundIndex, roundMatches);
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${tournamentName.replace(/[^a-z0-9\-]+/gi, "_")}_round_${roundIndex + 1}_scorecards.zip`;
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
      const pdfBlob = await buildScorecardsA4ForRound(tournamentName, roundIndex, roundMatches);
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${tournamentName.replace(/[^a-z0-9\-]+/gi, "_")}_round_${roundIndex + 1}_scorecards_A4.pdf`;
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

  // Helper: render a single match card (keeps UI consistent)
  const renderMatchCard = (m, rIndex, mIndex) => {
    const hasStandard = m.score1 != null || m.score2 != null;
    const hasSkins = Array.isArray(m.skins) && m.skins.length === 3;

    const isStandardComplete = hasStandard && m.score1 != null && m.score2 != null;
    const isSkinsComplete = hasSkins && m.skins.every((s) => s?.a != null && s?.b != null);
    const isComplete = scoringMode === "standard" ? isStandardComplete : isSkinsComplete;

    const matchCardClass = [
      "match-card",
      isComplete ? "match-complete" : "",
      m.verified ? "match-verified" : "",
    ]
      .join(" ")
      .trim();

    return (
      <div key={mIndex} className={matchCardClass} style={{ marginBottom: 8 }}>
        {/* Location */}
        {m.green && m.rink != null && (
          <div className="match-location">
            <strong>
              🟩 Green {m.green} — Rink {m.rink}
            </strong>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h4 style={{ margin: "6px 0" }}>
            {m.team1} vs {m.team2}
          </h4>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {m.verified ? (
              <span style={{ color: "green", fontWeight: "700" }}>Verified ✓</span>
            ) : isComplete ? (
              <span style={{ color: "#b66", fontWeight: "600" }}>Complete — Not Verified</span>
            ) : (
              <span style={{ color: "#666" }}>In Progress</span>
            )}

            <button
              onClick={() => toggleVerified(rIndex, mIndex)}
              style={{
                padding: "6px 8px",
                borderRadius: 4,
                border: "1px solid #888",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              {m.verified ? "Unverify" : "Mark as Verified"}
            </button>
          </div>
        </div>

        {scoringMode === "standard" ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
            <input
              type="number"
              placeholder={m.team1}
              value={m.score1 ?? ""}
              disabled={m.verified}
              onChange={(e) => updateStandardScore(rIndex, mIndex, "score1", e.target.value)}
              style={{ width: 100 }}
            />
            <div style={{ fontWeight: 700 }}>vs</div>
            <input
              type="number"
              placeholder={m.team2}
              value={m.score2 ?? ""}
              disabled={m.verified}
              onChange={(e) => updateStandardScore(rIndex, mIndex, "score2", e.target.value)}
              style={{ width: 100 }}
            />
          </div>
        ) : (
          <div style={{ marginTop: 8 }}>
            {/* Skins rows (Option B style: colored row indicating winner) */}
            {([0, 1, 2].map((s) => {
              const skin = m.skins?.[s] || {};
              const a = skin.a;
              const b = skin.b;

              let background = "#fff";
              if (a != null && b != null) {
                if (a > b) background = "#e6fff0"; // team1 win -> light green
                else if (b > a) background = "#fff0f0"; // team2 win -> light red
                else background = "#f0f7ff"; // draw -> light blue
              }

              return (
                <div
                  key={s}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "6px",
                    background,
                    borderRadius: 4,
                    marginBottom: 6,
                  }}
                >
                  <div style={{ width: 72, fontWeight: 600 }}>Skin {s + 1}</div>

                  <input
                    type="number"
                    placeholder={m.team1}
                    value={a ?? ""}
                    disabled={m.verified}
                    onChange={(e) => updateSkinScore(rIndex, mIndex, s, "a", e.target.value)}
                    style={{ width: 72 }}
                  />

                  <div style={{ fontWeight: 700 }}>vs</div>

                  <input
                    type="number"
                    placeholder={m.team2}
                    value={b ?? ""}
                    disabled={m.verified}
                    onChange={(e) => updateSkinScore(rIndex, mIndex, s, "b", e.target.value)}
                    style={{ width: 72 }}
                  />
                </div>
              );
            }))}

            {/* Match summary */}
            {(m.totalA != null || m.totalB != null) && (
              <div style={{ marginTop: 6, fontSize: 13, color: "#222" }}>
                <strong>Totals</strong> — {m.team1}: {m.totalA ?? 0} , {m.team2}: {m.totalB ?? 0}
                &nbsp; | <strong>Skins</strong> — {m.team1}: {m.skinPointsA ?? 0} , {m.team2}: {m.skinPointsB ?? 0}
                &nbsp; | <strong>Bonus</strong> — {m.team1}: {m.bonusA ?? 0} , {m.team2}: {m.bonusB ?? 0}
                &nbsp; | <strong>Match Points</strong> — {m.team1}: {m.matchPointsA ?? 0} , {m.team2}: {m.matchPointsB ?? 0}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="page">
      <h2>Match Scoring — {tournamentName}</h2>

      <p>
        Scoring Mode: <strong>{scoringMode}</strong>
      </p>

      <div style={{ marginBottom: 12, display: "flex", gap: 8 }}>
        <button onClick={handleDownloadScorecardsZip} className="btn-secondary">
          Download A6 Scorecards (ZIP)
        </button>
        <button onClick={handleDownloadScorecardsA4} className="btn-secondary">
          Download A4 Scorecards (2 per page)
        </button>
      </div>

      {/* Rounds list (collapsible) */}
      {matches.map((round, rIndex) => {
        // default: last round open if not explicitly set in openRounds
        const isOpen = openRounds[rIndex] !== undefined ? openRounds[rIndex] : rIndex === matches.length - 1;
        const allVerified = round.every((m) => m.verified);

        return (
          <div key={rIndex} style={{ marginBottom: 10 }}>
            {/* Header bar */}
            <div
              onClick={() => toggleRound(rIndex)}
              style={{
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 10,
                borderRadius: 6,
                border: "1px solid #ccc",
                background: allVerified ? "#e8ffea" : "#f3f3f3",
              }}
            >
              <div style={{ fontWeight: 700 }}>
                {isOpen ? "▼" : "▶"} Round {rIndex + 1}
                {allVerified && <span style={{ marginLeft: 10, color: "green" }}>✓ Verified</span>}
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ fontSize: 13, color: "#444" }}>{round.length} matches</div>
                <div style={{ fontSize: 12, color: "#666" }}>
                  {isOpen ? "Click to collapse" : "Click to expand"}
                </div>
              </div>
            </div>

            {/* Collapsible content */}
            {isOpen && (
              <div style={{ padding: 10 }}>
                {round.map((m, mIndex) => (
                  <div key={mIndex} style={{ marginBottom: 6 }}>
                    {renderMatchCard(m, rIndex, mIndex)}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
