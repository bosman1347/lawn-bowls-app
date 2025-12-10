import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import NewTournament from "./pages/NewTournament";
import Matches from "./pages/Matches";
import Standings from "./pages/Standings";
import Summary from "./pages/Summary";

import Navbar from "./components/Navbar";

export default function App() {
  return (
    <Router>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tournaments" element={<Dashboard />} />
        <Route path="/new" element={<NewTournament />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/standings" element={<Standings />} />
        <Route path="/summary" element={<Summary />} />
      </Routes>
    </Router>
  );
}
