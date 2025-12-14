import { Navigate } from "react-router-dom";
import { isAdminUnlocked } from "../utils/auth";

export default function ProtectedPage({ children }) {
  if (!isAdminUnlocked()) {
    return <Navigate to="/pin" replace />;
  }
  return children;
}
