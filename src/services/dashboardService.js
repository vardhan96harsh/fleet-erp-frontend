import api from "./api.js";

export const dashboardService = {
  async getSummary(ownerId = null) {
    const params = ownerId ? { ownerId } : {};
    const res = await api.get("/dashboard/summary", { params });
    return res.data.data;
  },
};
