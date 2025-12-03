import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-title">Lawn Bowls Tournament</div>

      <div className="navbar-links">
        <Link to="/" className={isActive("/") ? "navbar-active" : ""}>
          Home
        </Link>

        <Link
          to="/tournaments"
          className={isActive("/tournaments") ? "navbar-active" : ""}
        >
          Tournaments
        </Link>

        <Link
          to="/new"
          className={isActive("/new") ? "navbar-active" : ""}
        >
          New Tournament
        </Link>

        <Link
          to="/matches"
          className={isActive("/matches") ? "navbar-active" : ""}
        >
          Matches
        </Link>

        <Link
          to="/standings"
          className={isActive("/standings") ? "navbar-active" : ""}
        >
          Standings
        </Link>

        <Link
          to="/summary"
          className={isActive("/summary") ? "navbar-active" : ""}
        >
          Summary
        </Link>
      </div>
    </nav>
  );
}
