import api from "./api.js";

const triggerBlobDownload = (data, filename) => {
  const url = window.URL.createObjectURL(new Blob([data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const importExportService = {
  async downloadVehicleTemplate() {
    const res = await api.get("/import-export/templates/vehicles", {
      responseType: "blob",
    });
    triggerBlobDownload(res.data, "vehicle-template.xlsx");
  },

  async downloadDriverTemplate() {
    const res = await api.get("/import-export/templates/drivers", {
      responseType: "blob",
    });
    triggerBlobDownload(res.data, "driver-template.xlsx");
  },

  async downloadInventoryTemplate(location = "LOCATION_A") {
    const res = await api.get("/import-export/templates/inventory", {
      params: { location },
      responseType: "blob",
    });
    triggerBlobDownload(res.data, `inventory-template-${location}.xlsx`);
  },

  async previewVehicleImport(file) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post("/import-export/preview/vehicles", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000,
    });
    return res.data.data;
  },

  async previewDriverImport(file) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post("/import-export/preview/drivers", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000,
    });
    return res.data.data;
  },

  async previewInventoryImport(file, location = "LOCATION_A") {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("location", location);
    const res = await api.post("/import-export/preview/inventory", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000,
    });
    return res.data.data;
  },

  async confirmImport(batchId) {
    const res = await api.post(`/import-export/confirm/${batchId}`, null, {
      timeout: 120000,
    });
    return res.data;
  },

  async exportVehicles() {
    const res = await api.get("/import-export/export/vehicles", {
      responseType: "blob",
    });
    triggerBlobDownload(
      res.data,
      `vehicles-export-${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  },

  async exportDrivers() {
    const res = await api.get("/import-export/export/drivers", {
      responseType: "blob",
    });
    triggerBlobDownload(
      res.data,
      `drivers-export-${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  },

  async exportInventory(location = null) {
    const params = location ? { location } : {};
    const res = await api.get("/import-export/export/inventory", {
      params,
      responseType: "blob",
    });
    triggerBlobDownload(
      res.data,
      `inventory-${location || "ALL"}-export-${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  },

  async downloadFullBackup() {
    const res = await api.get("/import-export/backup", {
      responseType: "blob",
    });
    triggerBlobDownload(
      res.data,
      `fleet-backup-${new Date().toISOString().slice(0, 10)}.json`
    );
  },
};
