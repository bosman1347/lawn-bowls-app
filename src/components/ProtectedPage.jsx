import { useSearchParams } from "react-router-dom";
import { isAdminUnlocked } from "../utils/auth";
import PinEntry from "./components/PinEntry";

export default function ProtectedPage({ children }) {
  const [params] = useSearchParams();
  const isPlayer = params.has("t"); // QR / phone mode

  // Players are allowed through without PIN
  if (isPlayer) {
    return children;
  }

  // Admin requires PIN
  if (!isAdminUnlocked()) {
    return <PinEntry />;
  }

  return children;
}
