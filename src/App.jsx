import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";

import Home from "./pages/Home.jsx";
import NewTournament from "./pages/NewTournament.jsx";
import Matches from "./pages/Matches.jsx";
import Scores from "./pages/Scores.jsx";
import Results from "./pages/Results.jsx";
import Standings from "./pages/Standings.jsx";
import Summary from "./pages/Summary.jsx";
import Dashboard from "./pages/Dashboard.jsx";



export default function App() {
  return (
    <Router>
      <Navbar />

      <div className="page-container">
        <Routes>
		  <Route path="/" element={<Dashboard />} />
          <Route path="/" element={<Home />} />
          <Route path="/new" element={<NewTournament />} />
		  <Route path="/matches" element={<Matches />} />
          <Route path="/scores" element={<Scores />} />
          <Route path="/results" element={<Results />} />
		  <Route path="/standings" element={<Standings />} />
		  <Route path="/summary" element={<Summary />} />

        </Routes>
      </div>
    </Router>
  );
}