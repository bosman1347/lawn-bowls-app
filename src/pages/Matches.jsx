import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { resolveTournament } from "../utils/tournamentContext";
import { loadAllTournaments, saveTournament } from "../utils/api";
import { isAdminUnlocked } from "../utils/auth";
import PinEntry from "../components/PinEntry";


export default function Matches() {
  const [searchParams] = useSearchParams();
  const tournamentName = resolveTournament(searchParams);

  const [tournament, setTournament] = useState(null);
  const [openRounds, setOpenRounds] = useState({});
  const saveTimer = useRef(null);

  // 🔐 Admin gate
  if (!isAdminUnlocked()) {
    return <PinEntry />;
  }

  // ❌ No tournament context
  if (!tournamentName) {
    return (
      <div className="page">
        <h2>No active tournament</h2>
        <p>Please scan the correct QR code or select a tournament.</p>
      </div>
    );
  }
  

  // 📥 Load from backend ONLY
useEffect(() => {
  if (!tournamentName) return;

  async function load() {
    const all = await loadAllTournaments();
    const data = all[tournamentName];
    if (!data) return;

    setTournament(data);

    const last = (data.matches || []).length - 1;
    if (last >= 0) setOpenRounds({ [last]: true });
  }

  load();
}, [tournamentName]);


  // 💾 Debounced backend save
  const scheduleSave = (updated) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveTournament(tournamentName, updated);
    }, 400);
  };

  if (!tournament) {
    return <div className="page">Loading matches…</div>;
  }

  const matches = tournament.matches || [];

  // 🧮 Update score handler (skins or standard)
  const updateMatch = (roundIdx, matchIdx, patch) => {
    const updated = structuredClone(tournament);
    Object.assign(updated.matches[roundIdx][matchIdx], patch);

    setTournament(updated);
    scheduleSave(updated);
  };

  return (
    <div className="page">
      <h2>Matches — {tournamentName}</h2>

      {matches.map((round, rIdx) => (
        <div key={rIdx} className="round-block">
          <h3 onClick={() =>
            setOpenRounds(o => ({ ...o, [rIdx]: !o[rIdx] }))
          }>
            Round {rIdx + 1}
          </h3>

          {openRounds[rIdx] && round.map((m, mIdx) => (
            <div key={mIdx} className="match-card">
              <strong>{m.team1}</strong> vs <strong>{m.team2}</strong>

              {m.skins?.map((s, i) => (
                <div key={i} className="skin-row">
                  <input
                    type="number"
                    value={s.score1 ?? ""}
                    onChange={e =>
                      updateMatch(rIdx, mIdx, {
                        skins: m.skins.map((x, xi) =>
                          xi === i ? { ...x, score1: +e.target.value } : x
                        )
                      })
                    }
                  />
                  <input
                    type="number"
                    value={s.score2 ?? ""}
                    onChange={e =>
                      updateMatch(rIdx, mIdx, {
                        skins: m.skins.map((x, xi) =>
                          xi === i ? { ...x, score2: +e.target.value } : x
                        )
                      })
                    }
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
