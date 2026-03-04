import React, { createContext, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import api from "../services/api";

const AuthContext = createContext();

const getStoredToken = () => {
  const storedToken = localStorage.getItem("token");
  if (!storedToken || storedToken === "undefined" || storedToken === "null") {
    return null;
  }
  return storedToken;
};

const getRoleIdFromUser = (user) => {
  const possibleRoleId =
    user?.roleId ?? user?.role?.id ?? user?.role_id ?? user?.roleIdFk ?? user?.idRole ?? null;
  const normalizedRoleId = Number(possibleRoleId);

  return Number.isNaN(normalizedRoleId) ? null : normalizedRoleId;
};

const getRoleIdFromToken = (token) => {
  if (!token) {
    return null;
  }

  try {
    const tokenParts = token.split(".");
    if (tokenParts.length < 2) {
      return null;
    }

    const payloadBase64 = tokenParts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(payloadBase64));
    const possibleRoleId = payload?.roleId ?? payload?.role?.id ?? payload?.idRole ?? null;
    const normalizedRoleId = Number(possibleRoleId);

    return Number.isNaN(normalizedRoleId) ? null : normalizedRoleId;
  } catch (error) {
    return null;
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(getStoredToken());
  const [loading, setLoading] = useState(true);
  const roleIdFromUser = getRoleIdFromUser(user);
  const roleIdFromToken = getRoleIdFromToken(token);
  const roleId = roleIdFromUser ?? roleIdFromToken;

  useEffect(() => {
    if (token) {
      // Verificar token al cargar
      checkAuthStatus();
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (username, password) => {
    try {
      console.log("Enviando petición de login:", { username });
      const response = await api.post("/api/user/login", {
        username,
        password,
      });
      const responseData = response.data || {};
      const newToken =
        responseData.token || responseData.accessToken || responseData.access_token || null;
      const userData = responseData.user || responseData.data?.user || null;

      if (!newToken) {
        return {
          success: false,
          error: "El backend no devolvió un token válido",
        };
      }

      console.log("Respuesta recibida:", response.data);

      setToken(newToken);
      setUser(userData);
      localStorage.setItem("token", newToken);

      return { success: true };
    } catch (error) {
      console.error("Error completo:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      console.error("Error message:", error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || "Error de login",
      };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
  };

  const checkAuthStatus = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get("/api/user/check-status", {
        suppressGlobalNotification: true,
      });
      setUser(response.data);
    } catch (error) {
      const statusCode = error.response?.status;

      if (statusCode === 401) {
        logout();
        return;
      }

      if (statusCode === 403 || statusCode === 404 || statusCode === 405) {
        try {
          const fallbackResponse = await api.get("/api/user/findById", {
            suppressGlobalNotification: true,
          });
          setUser(fallbackResponse.data);
          return;
        } catch (fallbackError) {
          if (fallbackError.response?.status === 401) {
            logout();
            return;
          }
          console.error("No se pudo validar sesión con /findById:", fallbackError);
        }
      } else {
        console.error("No se pudo validar sesión con /check-status:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    token,
    roleId,
    loading,
    login,
    logout,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
