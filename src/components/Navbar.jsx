import { Link } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-title">Lawn Bowls App</div>
      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/new">New Tournament</Link>
		<Link to="/matches">Matches</Link>
        <Link to="/scores">Scores</Link>
        <Link to="/results">Results</Link>
		<Link to="/standings">Standings</Link>
		<Link to="/summary">Summary</Link>


      </div>
    </nav>
  );
}