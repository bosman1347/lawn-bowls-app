export const ADMIN_PIN = "9451";

export function isAdmin() {
  return localStorage.getItem("adminUnlocked") === "yes";
}

export function unlockAdmin(pin) {
  if (pin === ADMIN_PIN) {
    localStorage.setItem("adminUnlocked", "yes");
    return true;
  }
  return false;
}

export function lockAdmin() {
  localStorage.removeItem("adminUnlocked");
}
