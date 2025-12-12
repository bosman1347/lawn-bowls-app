import { useState } from "react";
import { isAdmin } from "../utils/auth";
import PinEntry from "../pages/PinEntry";

export default function ProtectedPage({ children }) {
  const [unlocked, setUnlocked] = useState(isAdmin());

  if (!unlocked) {
    return <PinEntry onSuccess={() => setUnlocked(true)} />;
  }

  return children;
}
