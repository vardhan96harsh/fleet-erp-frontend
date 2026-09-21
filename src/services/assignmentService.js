import api from "./api.js";

export const assignmentService = {
  async getAll(params = {}) {
    const res = await api.get("/assignments", { params });
    return res.data?.data || [];
  },

  async getByVehicle(location = null) {
    const params = location && location !== "all" ? { location } : {};
    const res = await api.get("/assignments/by-vehicle", { params });
    return res.data?.data || [];
  },

  async getById(id) {
    const res = await api.get(`/assignments/${id}`);
    return res.data?.data;
  },

  async create(data) {
    const res = await api.post("/assignments", data);
    return res.data?.data;
  },

  async update(id, data) {
    const res = await api.patch(`/assignments/${id}`, data);
    return res.data?.data;
  },

  async returnItem(id, data = {}) {
    const res = await api.post(`/assignments/${id}/return`, data);
    return res.data?.data;
  },

  async delete(id) {
    const res = await api.delete(`/assignments/${id}`);
    return res.data?.data;
  },
};

export default assignmentService;
