// src/utils/auth.js
export const ADMIN_PIN = "9451";

export function isAdmin() {
  try {
    return localStorage.getItem("adminUnlocked") === "yes";
  } catch (e) {
    return false;
  }
}

export function unlockAdmin(pin) {
  if (String(pin) === ADMIN_PIN) {
    localStorage.setItem("adminUnlocked", "yes");
    return true;
  }
  return false;
}

export function lockAdmin() {
  localStorage.removeItem("adminUnlocked");
}

export function unlockAdmin(pin) {
  console.log("unlockAdmin called with:", pin);
  if (String(pin) === ADMIN_PIN) {
    localStorage.setItem("adminUnlocked", "yes");
    console.log("unlockAdmin: success");
    return true;
  }
  console.log("unlockAdmin: failed");
  return false;
}
