export const fmtD = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const fmtDT = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return (
    d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }) +
    ", " +
    d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
};

export const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  d.setUTCHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

export const docBadgeStatus = (days) => {
  if (days === null || days === undefined) return "neutral";
  if (days < 0) return "bad";
  if (days <= 30) return "warn";
  return "ok";
};

export const worstVehicleStatus = (vehicle) => {
  if (!vehicle) return "neutral";
  const fields = [
    vehicle.pucExpiry,
    vehicle.fitnessExpiry,
    vehicle.insuranceExpiry,
    vehicle.permitExpiry,
    vehicle.rcExpiry,
  ];
  let worst = "ok";
  let hasAny = false;

  for (const f of fields) {
    if (!f) continue;
    hasAny = true;
    const days = daysUntil(f);
    const s = docBadgeStatus(days);
    if (s === "bad") return "bad";
    if (s === "warn" && worst !== "bad") worst = "warn";
  }

  if (!hasAny) return "neutral";
  return worst;
};

export const monthKey = (offset = 0) => {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export const daysInMonth = (yearMonthKey) => {
  const [y, m] = yearMonthKey.split("-").map(Number);
  return new Date(y, m, 0).getDate();
};
