import api from "./api.js";

export const vehicleService = {
  async getAll() {
    const res = await api.get("/vehicles");
    return res.data.data;
  },

  async getById(id) {
    const res = await api.get(`/vehicles/${id}`);
    return res.data.data;
  },

  async create(data) {
    const res = await api.post("/vehicles", data);
    return res.data.data;
  },

  async update(id, data) {
    const res = await api.patch(`/vehicles/${id}`, data);
    return res.data.data;
  },

  async delete(id) {
    const res = await api.delete(`/vehicles/${id}`);
    return res.data.data;
  },

  async getDeleted() {
    const res = await api.get("/vehicles/deleted");
    return res.data.data;
  },

  async restore(id) {
    const res = await api.post(`/vehicles/${id}/restore`);
    return res.data.data;
  },

  // ── Service Records ──────────────────────────────────────────────────────
  async addServiceRecord(vehicleId, data) {
    const res = await api.post(`/vehicles/${vehicleId}/service`, data);
    return res.data.data; // returns full updated vehicle
  },

  async removeServiceRecord(vehicleId, recordId) {
    const res = await api.delete(`/vehicles/${vehicleId}/service/${recordId}`);
    return res.data.data; // returns full updated vehicle
  },

  // ── Accident Reports ─────────────────────────────────────────────────────
  async addAccidentReport(vehicleId, data) {
    const res = await api.post(`/vehicles/${vehicleId}/accident`, data);
    return res.data.data;
  },

  async removeAccidentReport(vehicleId, reportId) {
    const res = await api.delete(`/vehicles/${vehicleId}/accident/${reportId}`);
    return res.data.data;
  },
};

