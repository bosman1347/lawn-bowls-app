import { useState } from "react";
import { unlockAdmin } from "../utils/auth";
import { useNavigate } from "react-router-dom";

export default function PinEntry() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleUnlock = () => {
    const ok = unlockAdmin(pin);

    if (ok) {
      navigate("/matches");
    } else {
      setError("Incorrect PIN");
    }
  };

  return (
    <div className="page">
      <h2>Admin Access</h2>

      <input
        type="password"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        placeholder="Enter PIN"
      />

      <button onClick={handleUnlock}>Unlock</button>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
