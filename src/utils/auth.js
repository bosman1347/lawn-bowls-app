// src/utils/auth.js

const ADMIN_PIN = "9451";

const auth = {
  unlock(pin) {
    if (String(pin) === ADMIN_PIN) {
      localStorage.setItem("adminUnlocked", "yes");
      return true;
    }
    return false;
  },

  isUnlocked() {
    return localStorage.getItem("adminUnlocked") === "yes";
  },

  lock() {
    localStorage.removeItem("adminUnlocked");
  }
};

export default auth;
