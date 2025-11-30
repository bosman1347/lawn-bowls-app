import { loadTournaments, setActiveTournament, deleteTournament } from "../utils/storage";

export default function TournamentList() {
  const tournaments = loadTournaments();
  const names = Object.keys(tournaments);

  return (
    <div className="page">
      <h1>Tournaments</h1>

      {names.length === 0 ? (
        <p>No tournaments saved yet.</p>
      ) : (
        names.map((name) => (
          <div
            key={name}
            style={{
              border: "1px solid #ccc",
              padding: "1rem",
              marginBottom: "1rem",
              borderRadius: "6px",
            }}
          >
            <h3>{name}</h3>

            <button
              onClick={() => {
                setActiveTournament(name);
                window.location.href = "/summary";
              }}
              style={{ marginRight: "1rem" }}
            >
              Load
            </button>

            <button
              onClick={() => {
                deleteTournament(name);
                window.location.reload();
              }}
            >
              Delete
            </button>
          </div>
        ))
      )}

      <button
        onClick={() => (window.location.href = "/new")}
        style={{ marginTop: "2rem" }}
      >
        Create New Tournament
      </button>
    </div>
  );
}
