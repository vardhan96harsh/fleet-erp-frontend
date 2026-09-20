import api from "./api.js";

export const driverService = {
  async getAll() {
    const res = await api.get("/drivers");
    return res.data.data;
  },

  async getById(id) {
    const res = await api.get(`/drivers/${id}`);
    return res.data.data;
  },

  async create(data) {
    const res = await api.post("/drivers", data);
    return res.data.data;
  },

  async update(id, data) {
    const res = await api.patch(`/drivers/${id}`, data);
    return res.data.data;
  },

  async delete(id) {
    const res = await api.delete(`/drivers/${id}`);
    return res.data.data;
  },

  async getDeleted() {
    const res = await api.get("/drivers/deleted");
    return res.data.data;
  },

  async restore(id) {
    const res = await api.post(`/drivers/${id}/restore`);
    return res.data.data;
  },
};
