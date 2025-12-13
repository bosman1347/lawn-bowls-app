// src/utils/auth.js

const ADMIN_PIN = "9451";

export const unlockAdmin = (pin) => {
  if (String(pin) === ADMIN_PIN) {
    localStorage.setItem("adminUnlocked", "yes");
    return true;
  }
  return false;
};

export const isAdminUnlocked = () => {
  return localStorage.getItem("adminUnlocked") === "yes";
};

export const lockAdmin = () => {
  localStorage.removeItem("adminUnlocked");
};
