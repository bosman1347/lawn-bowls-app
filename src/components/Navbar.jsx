import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-title">Lawn Bowls App</div>

      <div className="navbar-links">
        <Link className={isActive("/") ? "active" : ""} to="/">Home</Link>
        <Link className={isActive("/dashboard") ? "active" : ""} to="/dashboard">
			Tournaments
		</Link>

		<Link className={isActive("/matches") ? "active" : ""} to="/matches">Matches</Link>
        <Link className={isActive("/standings") ? "active" : ""} to="/standings">Standings</Link>
        <Link className={isActive("/summary") ? "active" : ""} to="/summary">Summary</Link>
        <Link className={isActive("/new") ? "active" : ""} to="/new">New Tournament</Link>
      </div>
    </nav>
  );
}
