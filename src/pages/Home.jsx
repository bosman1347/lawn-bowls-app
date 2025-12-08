import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="page home-page">
      <h1>Welcome to the Centurion Lawn Bowls Tournament System</h1>

      <p className="home-subtitle">
        Manage tournaments, enter results, track standings, and generate scorecards.
      </p>

      <div className="home-buttons">
        <button className="form-button" onClick={() => navigate("/new")}>
          ➕ Create New Tournament
        </button>

        <button className="form-button" onClick={() => navigate("/dashboard")}>
          📋 Open Dashboard
        </button>

        <button className="form-button" onClick={() => navigate("/matches")}>
          🎯 Enter Scores (Matches)
        </button>

        <button className="form-button" onClick={() => navigate("/standings")}>
          🏆 View Standings
        </button>

        <button className="form-button" onClick={() => navigate("/summary")}>
          📘 Tournament Summary
        </button>
      </div>

      <style>{`
        .home-page {
          text-align: center;
        }

        .home-subtitle {
          font-size: 1.2rem;
          margin-bottom: 2rem;
          color: #555;
        }

        .home-buttons {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 1rem;
          max-width: 300px;
          margin-left: auto;
          margin-right: auto;
        }

        .home-buttons .form-button {
          padding: 0.8rem 1rem;
          font-size: 1.1rem;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
