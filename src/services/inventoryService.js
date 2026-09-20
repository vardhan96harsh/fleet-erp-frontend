import api from "./api.js";

export const inventoryService = {
  async getAll(location = null) {
    const params = location ? { location } : {};
    const res = await api.get("/inventory", { params });
    return res.data.data;
  },

  async getById(id) {
    const res = await api.get(`/inventory/${id}`);
    return res.data.data;
  },

  async create(data) {
    const res = await api.post("/inventory", data);
    return res.data.data;
  },

  async update(id, data) {
    const res = await api.patch(`/inventory/${id}`, data);
    return res.data.data;
  },

  async delete(id) {
    const res = await api.delete(`/inventory/${id}`);
    return res.data.data;
  },

  async getDeleted(location = null) {
    const params = location ? { location } : {};
    const res = await api.get("/inventory/deleted", { params });
    return res.data.data;
  },

  async restore(id) {
    const res = await api.post(`/inventory/${id}/restore`);
    return res.data.data;
  },
};
