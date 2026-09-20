import api from "./api.js";

export const attendanceService = {
  async getDaily(date) {
    const res = await api.get("/attendance/daily", { params: { date } });
    return res.data.data;
  },

  async getMonthly(month) {
    const res = await api.get("/attendance/monthly", { params: { month } });
    return res.data.data;
  },

  async record(data) {
    const res = await api.post("/attendance", data);
    return res.data.data;
  },

  async recordBulk(date, records) {
    const res = await api.post("/attendance/bulk", { date, records });
    return res.data.data;
  },
};

export default attendanceService;
