import axios from "axios";

let accessToken = localStorage.getItem("fleet_access_token") || null;

export const setAccessToken = (token, user = null) => {
  accessToken = token;
  if (token) {
    localStorage.setItem("fleet_access_token", token);
    if (user) {
      localStorage.setItem("fleet_user", JSON.stringify(user));
    }
  } else {
    localStorage.removeItem("fleet_access_token");
    localStorage.removeItem("fleet_user");
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

const getBaseURL = () => {
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
        const response = await axios.post(
          "/api/v1/auth/refresh",
          {},
          { withCredentials: true, timeout: 8000 }
        );

        const newAccessToken = response.data?.data?.accessToken;
        const newUser = response.data?.data?.user;
        if (newAccessToken) {
          setAccessToken(newAccessToken, newUser);
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
