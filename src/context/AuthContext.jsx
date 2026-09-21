import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { authService } from "../services/authService.js";
import {
  getAccessToken,
  setAccessToken,
  getCachedUser,
} from "../services/api.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Instant startup: Read cached user from localStorage for 0ms initial render
  const [user, setUser] = useState(() => getCachedUser());
  const [loading, setLoading] = useState(() => {
    // If no token exists at all, we know immediately that user is not logged in
    return !getAccessToken() && !getCachedUser() ? false : true;
  });

  const checkAuth = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const me = await authService.getMe();
      const userData = me?.user || me;
      setUser(userData);
      setAccessToken(token, userData);
    } catch (err) {
      // If 401/403 or token invalid, clear session
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        setUser(null);
        setAccessToken(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only verify if we have token, otherwise we already set loading: false
    if (getAccessToken()) {
      checkAuth();
    } else {
      setLoading(false);
    }

    const handleForceLogout = () => {
      setUser(null);
      setAccessToken(null);
      setLoading(false);
    };

    window.addEventListener("fleet_auth_logout", handleForceLogout);
    return () => {
      window.removeEventListener("fleet_auth_logout", handleForceLogout);
    };
  }, [checkAuth]);

  const login = async (username, password) => {
    const result = await authService.login(username, password);
    setUser(result.user);
    setAccessToken(result.accessToken, result.user, result.refreshToken);
    return result;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore network errors on logout
    } finally {
      setUser(null);
      setAccessToken(null);
    }
  };

  const isAdmin = user?.role === "SUPER_ADMIN";
  const isSubAdmin = user?.role === "SUB_ADMIN";

  const value = {
    user,
    role: user?.role || null,
    isAdmin,
    isSubAdmin,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
