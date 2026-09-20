import api, { setAccessToken } from "./api.js";

export const authService = {
  async login(username, password) {
    const res = await api.post("/auth/login", { username, password });
    const { user, accessToken } = res.data.data;
    setAccessToken(accessToken);
    return { user, accessToken };
  },

  async logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      setAccessToken(null);
    }
  },

  async getMe() {
    const res = await api.get("/auth/me");
    return res.data.data?.user || res.data.data;
  },
};
