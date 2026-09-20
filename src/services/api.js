import axios from "axios";

let accessToken = localStorage.getItem("fleet_access_token") || null;
let refreshToken = localStorage.getItem("fleet_refresh_token") || null;

export const setAccessToken = (token, user = null, newRefreshToken = null) => {
  accessToken = token;
  if (newRefreshToken !== undefined && newRefreshToken !== null) {
    refreshToken = newRefreshToken;
    localStorage.setItem("fleet_refresh_token", newRefreshToken);
  }
  if (token) {
    localStorage.setItem("fleet_access_token", token);
    if (user) {
      localStorage.setItem("fleet_user", JSON.stringify(user));
    }
  } else {
    localStorage.removeItem("fleet_access_token");
    localStorage.removeItem("fleet_refresh_token");
    localStorage.removeItem("fleet_user");
    refreshToken = null;
  }
};

export const getCachedUser = () => {
  try {
    const raw = localStorage.getItem("fleet_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const getAccessToken = () => accessToken;
export const getRefreshToken = () =>
  refreshToken || localStorage.getItem("fleet_refresh_token");

export const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return "/api/v1";
  const cleaned = envUrl.replace(/\/+$/, "");
  return cleaned.endsWith("/api/v1") ? cleaned : `${cleaned}/api/v1`;
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000,
  withCredentials: true, // Needed for sending/receiving refresh cookies
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Do not retry refresh route itself or login route
    if (
      !originalRequest ||
      originalRequest.url?.includes("/auth/refresh") ||
      originalRequest.url?.includes("/auth/login")
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = getRefreshToken();
        const response = await axios.post(
          `${getBaseURL()}/auth/refresh`,
          { refreshToken: storedRefreshToken },
          { withCredentials: true, timeout: 10000 }
        );

        const newAccessToken = response.data?.data?.accessToken;
        const newRefreshToken = response.data?.data?.refreshToken;
        const newUser = response.data?.data?.user;
        if (newAccessToken) {
          setAccessToken(newAccessToken, newUser, newRefreshToken);
          processQueue(null, newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } else {
          throw new Error("No token returned");
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        setAccessToken(null);
        window.dispatchEvent(new CustomEvent("fleet_auth_logout"));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
