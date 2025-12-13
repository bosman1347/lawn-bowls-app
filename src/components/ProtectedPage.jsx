import { Navigate } from "react-router-dom";
import auth from "../utils/auth";
import PinEntry from "/src/pages/PinEntry.jsx";;

export default function ProtectedPage({ children }) {
  if (!auth.isUnlocked()) {
    return <PinEntry />;
  }

  return children;
}
