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

export const formatVehicleStatus = (status) => {
  switch (status) {
    case "ACTIVE":
      return "Active";
    case "DRIVER_NOT_AVAILABLE":
      return "Driver Not Available";
    case "UNDER_SERVICE":
      return "Under Service";
    case "INACTIVE":
      return "Inactive";
    default:
      return status || "—";
  }
};

export const getVehicleStatusBadgeVariant = (status) => {
  switch (status) {
    case "ACTIVE":
      return "ok";
    case "DRIVER_NOT_AVAILABLE":
      return "warn";
    case "UNDER_SERVICE":
      return "warn";
    case "INACTIVE":
      return "neutral";
    default:
      return "neutral";
  }
};

