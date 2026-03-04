import axios from "axios";

const apiBaseURL = process.env.REACT_APP_API_URL || "";
export const API_NOTIFICATION_EVENT = "shipments:api-notification";
export const AUTH_EXPIRED_EVENT = "shipments:auth-expired";

const REQUEST_TIMEOUT_MS = 15000;
const AUTH_ENDPOINTS = ["/api/user/login", "/api/user/check-status", "/api/user/findById"];

const dispatchAppEvent = (eventName, detail) => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(eventName, { detail }));
};

const getErrorMessage = (error) => {
  if (error.code === "ECONNABORTED") {
    return "La solicitud tardó demasiado. Intenta nuevamente.";
  }

  if (!error.response) {
    return "No fue posible conectar con el servidor. Verifica tu conexión.";
  }

  const responseData = error.response.data;
  const backendMessage = responseData?.message;

  if (Array.isArray(backendMessage)) {
    return backendMessage.join(". ");
  }

  if (typeof backendMessage === "string" && backendMessage.trim()) {
    return backendMessage;
  }

  if (typeof responseData?.error === "string" && responseData.error.trim()) {
    return responseData.error;
  }

  return "Ocurrió un error inesperado. Intenta nuevamente.";
};

const isAuthEndpoint = (url = "") => AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint));

// Crear instancia de Axios
const api = axios.create({
  baseURL: apiBaseURL,
  timeout: REQUEST_TIMEOUT_MS,
});

// Interceptor de request para agregar token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de response para manejar errores
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const statusCode = error.response?.status;
    const requestUrl = error.config?.url || "";
    const message = getErrorMessage(error);
    const suppressGlobalNotification = Boolean(error.config?.suppressGlobalNotification);

    if (statusCode === 401 && !isAuthEndpoint(requestUrl)) {
      localStorage.removeItem("token");
      dispatchAppEvent(AUTH_EXPIRED_EVENT, {
        message: "Tu sesión expiró. Debes iniciar sesión nuevamente.",
      });

      if (!window.location.pathname.includes("/authentication/sign-in")) {
        window.location.assign("/authentication/sign-in");
      }
    }

    if (!suppressGlobalNotification) {
      dispatchAppEvent(API_NOTIFICATION_EVENT, {
        severity: "error",
        message,
        statusCode,
      });
    }

    return Promise.reject(error);
  }
);

export default api;
