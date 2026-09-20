export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(Number(amount))) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
};

export const normalizeRole = (role) => {
  if (role === "SUPER_ADMIN") return "Super Admin";
  if (role === "SUB_ADMIN") return "Sub Admin";
  return role || "User";
};
