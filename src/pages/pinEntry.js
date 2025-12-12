// src/pages/PinEntry.jsx
import { useState } from "react";
import { unlockAdmin } from "../utils/auth";

export default function PinEntry({ onSuccess }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const submitPin = () => {
    if (unlockAdmin(pin)) {
      setError("");
      if (typeof onSuccess === "function") onSuccess();
    } else {
      setError("Incorrect PIN");
    }
  };

  return (
    <div className="page">
      <h2>Admin Access Required</h2>
      <p>Enter PIN to continue:</p>

      <input
        type="password"
        value={pin}
        placeholder="PIN"
        onChange={(e) => setPin(e.target.value)}
        className="pin-input"
      />

      <button className="btn-primary" onClick={submitPin}>
        Unlock
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
