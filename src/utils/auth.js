// src/utils/auth.js

const ADMIN_PIN = "9451";

export function isAdmin() {
  return localStorage.getItem("adminUnlocked") === "yes";
}

export function unlockAdmin(pin) {
  console.log("unlockAdmin called with:", pin);
  if (String(pin) === ADMIN_PIN) {
    localStorage.setItem("adminUnlocked", "yes");
    return true;
  }
  return false;
}

export function logoutAdmin() {
  localStorage.removeItem("adminUnlocked");
}
