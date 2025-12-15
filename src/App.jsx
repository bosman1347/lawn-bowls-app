import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import NewTournament from "./pages/NewTournament";
import ProtectedPage from "./components/ProtectedPage";
import Matches from "./pages/Matches";
import Standings from "./pages/Standings";
import Summary from "./pages/Summary";
import Navbar from "./components/Navbar";
import PlayerEntry from "./pages/PlayerEntry";
import PinEntry from "./components/PinEntry";

//import AppWrapper from "./AppWrapper"; // if you have one


export default function App() {
  return (
    <Router>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tournaments" element={<Dashboard />} />
        <Route path="/new" element={<NewTournament />} />
		<Route path="/pin" element={<PinEntry />} />

		<Route
			path="/matches"
			element={
			<ProtectedPage>
				<Matches />
			</ProtectedPage>
			}
		/>

		<Route path="/summary" element={
			<ProtectedPage>
				<Summary />
			</ProtectedPage>
		} />
		<Route path="/player" element={<PlayerEntry />} />
      </Routes>
    </Router>
  );
}
