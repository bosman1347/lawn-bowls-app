// src/utils/auth.js

const ADMIN_PIN = "9451";

export function unlockAdmin(pin) {
  if (String(pin) === ADMIN_PIN) {
    localStorage.setItem("adminUnlocked", "yes");
    return true;
  }
  return false;
}

export function isAdminUnlocked() {
  return localStorage.getItem("adminUnlocked") === "yes";
}

export function lockAdmin() {
  localStorage.removeItem("adminUnlocked");
}
