import { useState } from "react";
import { isAdmin } from "../utils/auth";
import PinEntry from "../pages/PinEntry";

export default function ProtectedPage({ children }) {
  const [unlocked, setUnlocked] = useState(isAdmin());
  console.log("ProtectedPage initial unlocked:", unlocked);

  if (!unlocked) {
    return <PinEntry onSuccess={() => setUnlocked(true)} />;
  }

  return <>{children}</>;
}
