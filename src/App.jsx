import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";

import Home from "./pages/Home.jsx";
import NewTournament from "./pages/NewTournament.jsx";
import Scores from "./pages/Scores.jsx";
import Results from "./pages/Results.jsx";

export default function App() {
  return (
    <Router>
      <Navbar />

      <div className="page-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/new" element={<NewTournament />} />
          <Route path="/scores" element={<Scores />} />
          <Route path="/results" element={<Results />} />
        </Routes>
      </div>
    </Router>
  );
}