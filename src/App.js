/**
=========================================================
* Material Dashboard 2 React - v2.2.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useState, useEffect, useMemo, useCallback } from "react";

// react-router components
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

// @mui material components
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Icon from "@mui/material/Icon";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDSnackbar from "components/MDSnackbar";

// Material Dashboard 2 React example components
import Sidenav from "examples/Sidenav";
import Configurator from "examples/Configurator";

// Material Dashboard 2 React themes
import theme from "assets/theme";
import themeRTL from "assets/theme/theme-rtl";

// Material Dashboard 2 React Dark Mode themes
import themeDark from "assets/theme-dark";
import themeDarkRTL from "assets/theme-dark/theme-rtl";

// RTL plugins
import rtlPlugin from "stylis-plugin-rtl";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";

// Material Dashboard 2 React routes
import routes from "routes";

// Material Dashboard 2 React contexts
import { useMaterialUIController, setMiniSidenav, setOpenConfigurator } from "context";
import { AuthProvider } from "context/AuthContext";
import { API_NOTIFICATION_EVENT, AUTH_EXPIRED_EVENT } from "services/api";

// Protected Route
import ProtectedRoute from "components/ProtectedRoute";
import RastreoGuia from "layouts/rastreo-guia";

// Images
import zendaLogo from "assets/images/zenda-logo.png";

export default function App() {
  const PUBLIC_ROUTES = ["/rastreo-guia", "/"];
  const [controller, dispatch] = useMaterialUIController();
  const {
    miniSidenav,
    direction,
    layout,
    openConfigurator,
    sidenavColor,
    transparentSidenav,
    whiteSidenav,
    darkMode,
  } = controller;
  const [onMouseEnter, setOnMouseEnter] = useState(false);
  const [rtlCache, setRtlCache] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    color: "error",
    title: "Error",
    content: "",
  });
  const { pathname } = useLocation();

  const closeSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  const openSnackbar = useCallback((severity = "error", message = "") => {
    if (!message) {
      return;
    }

    setSnackbar({
      open: true,
      color: severity === "success" ? "success" : "error",
      title: severity === "success" ? "Éxito" : "Error",
      content: message,
    });
  }, []);

  // Cache for the rtl
  useMemo(() => {
    const cacheRtl = createCache({
      key: "rtl",
      stylisPlugins: [rtlPlugin],
    });

    setRtlCache(cacheRtl);
  }, []);

  // Open sidenav when mouse enter on mini sidenav
  const handleOnMouseEnter = () => {
    if (miniSidenav && !onMouseEnter) {
      setMiniSidenav(dispatch, false);
      setOnMouseEnter(true);
    }
  };

  // Close sidenav when mouse leave mini sidenav
  const handleOnMouseLeave = () => {
    if (onMouseEnter) {
      setMiniSidenav(dispatch, true);
      setOnMouseEnter(false);
    }
  };

  // Change the openConfigurator state
  const handleConfiguratorOpen = () => setOpenConfigurator(dispatch, !openConfigurator);

  // Setting the dir attribute for the body element
  useEffect(() => {
    document.body.setAttribute("dir", direction);
  }, [direction]);

  // Setting page scroll to 0 when changing the route
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
  }, [pathname]);

  useEffect(() => {
    const handleApiNotification = (event) => {
      const { message, severity } = event.detail || {};
      openSnackbar(severity, message);
    };

    const handleAuthExpired = (event) => {
      const { message } = event.detail || {};
      openSnackbar("error", message || "Tu sesión expiró. Inicia sesión nuevamente.");
    };

    window.addEventListener(API_NOTIFICATION_EVENT, handleApiNotification);
    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);

    return () => {
      window.removeEventListener(API_NOTIFICATION_EVENT, handleApiNotification);
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    };
  }, [openSnackbar]);

  const getRoutes = (allRoutes) =>
    allRoutes.map((route) => {
      if (route.collapse) {
        return getRoutes(route.collapse);
      }

      if (route.route && route.component) {
        const isAuthRoute = route.route.includes("/authentication/");
        const isPublicRoute = PUBLIC_ROUTES.includes(route.route);
        const component = isAuthRoute ? (
          route.component
        ) : isPublicRoute ? (
          route.component
        ) : (
          <ProtectedRoute allowedRoles={route.allowedRoles}>{route.component}</ProtectedRoute>
        );
        return <Route exact path={route.route} element={component} key={route.key} />;
      }

      return null;
    });

  const configsButton = (
    <MDBox
      display="flex"
      justifyContent="center"
      alignItems="center"
      width="3.25rem"
      height="3.25rem"
      bgColor="white"
      shadow="sm"
      borderRadius="50%"
      position="fixed"
      right="2rem"
      bottom="2rem"
      zIndex={99}
      color="dark"
      sx={{ cursor: "pointer" }}
      onClick={handleConfiguratorOpen}
    >
      <Icon fontSize="small" color="inherit">
        settings
      </Icon>
    </MDBox>
  );

  const globalSnackbar = (
    <MDSnackbar
      color={snackbar.color}
      icon="notifications"
      title={snackbar.title}
      content={snackbar.content}
      dateTime="ahora"
      open={snackbar.open}
      close={closeSnackbar}
      onClose={closeSnackbar}
    />
  );

  return (
    <AuthProvider>
      {direction === "rtl" ? (
        <CacheProvider value={rtlCache}>
          <ThemeProvider theme={darkMode ? themeDarkRTL : themeRTL}>
            <CssBaseline />
            {layout === "dashboard" && (
              <>
                <Sidenav
                  color={sidenavColor}
                  brand={zendaLogo}
                  brandName=""
                  routes={routes}
                  onMouseEnter={handleOnMouseEnter}
                  onMouseLeave={handleOnMouseLeave}
                />
                <Configurator />
                {configsButton}
              </>
            )}
            {layout === "vr" && <Configurator />}
            <Routes>
              <Route path="/" element={<Navigate to="/rastreo-guia" replace />} />
              <Route path="/rastreo-guia" element={<RastreoGuia />} />
              {getRoutes(routes)}
              <Route path="*" element={<Navigate to="/rastreo-guia" replace />} />
            </Routes>
            {globalSnackbar}
          </ThemeProvider>
        </CacheProvider>
      ) : (
        <ThemeProvider theme={darkMode ? themeDark : theme}>
          <CssBaseline />
          {layout === "dashboard" && (
            <>
              <Sidenav
                color={sidenavColor}
                brand={zendaLogo}
                brandName=""
                routes={routes}
                onMouseEnter={handleOnMouseEnter}
                onMouseLeave={handleOnMouseLeave}
              />
              <Configurator />
              {configsButton}
            </>
          )}
          {layout === "vr" && <Configurator />}
          <Routes>
            <Route path="/" element={<Navigate to="/rastreo-guia" replace />} />
            <Route path="/rastreo-guia" element={<RastreoGuia />} />
            {getRoutes(routes)}
            <Route path="*" element={<Navigate to="/rastreo-guia" replace />} />
          </Routes>
          {globalSnackbar}
        </ThemeProvider>
      )}
    </AuthProvider>
  );
}
