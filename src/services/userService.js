import api from "./api.js";

export const userService = {
  async getAll() {
    const res = await api.get("/users");
    return res.data.data;
  },

  async getById(id) {
    const res = await api.get(`/users/${id}`);
    return res.data.data;
  },

  async create(data) {
    const res = await api.post("/users", data);
    return res.data.data;
  },

  async update(id, data) {
    const res = await api.patch(`/users/${id}`, data);
    return res.data.data;
  },

  async updateStatus(id, isActive) {
    const res = await api.patch(`/users/${id}/status`, { isActive });
    return res.data.data;
  },

  async resetPassword(id, password) {
    const res = await api.patch(`/users/${id}/reset-password`, { password });
    return res.data.data;
  },
};
