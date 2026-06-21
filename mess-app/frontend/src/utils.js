export function fmtTk(n) {
  const rounded = Math.round((n || 0) * 100) / 100;
  return `${rounded.toLocaleString("en-BD")} Tk`;
}

export function fmtDate(s) {
  if (!s) return "—";
  try {
    const d = new Date(s.includes("T") ? s : s + "T00:00:00");
    return d.toLocaleDateString("en-BD", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return s;
  }
}

export function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export function initials(name = "") {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}
