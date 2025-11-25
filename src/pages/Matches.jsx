export default function Matches() {
  const saved = localStorage.getItem("matches");
  const tournament = localStorage.getItem("tournament");

  const matches = saved ? JSON.parse(saved) : [];
  const tour = tournament ? JSON.parse(tournament) : null;

  if (!tour) {
    return (
      <div className="page">
        <h2>No tournament found</h2>
        <p>Please create a new tournament first.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <h2>Match Schedule</h2>

      {matches.length === 0 && <p>No matches generated.</p>}

      {matches.map((round, r) => (
        <div key={r} style={{ marginBottom: "1rem" }}>
          <h3>Round {r + 1}</h3>
          <ul>
            {round.map((m, i) => (
              <li key={i}>
                {m.teamA} vs {m.teamB}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}