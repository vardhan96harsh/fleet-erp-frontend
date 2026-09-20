import api, { setAccessToken, getRefreshToken } from "./api.js";

export const authService = {
  async login(username, password) {
    const res = await api.post("/auth/login", { username, password });
    const { user, accessToken, refreshToken } = res.data.data;
    setAccessToken(accessToken, user, refreshToken);
    return { user, accessToken, refreshToken };
  },

  async logout() {
    try {
      await api.post("/auth/logout", { refreshToken: getRefreshToken() });
    } finally {
      setAccessToken(null);
    }
  },

  async getMe() {
    const res = await api.get("/auth/me");
    return res.data.data?.user || res.data.data;
  },
};
