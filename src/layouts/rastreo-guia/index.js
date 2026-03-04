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

import { useMemo, useState } from "react";

import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Icon from "@mui/material/Icon";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDInput from "components/MDInput";
import MDTypography from "components/MDTypography";

import PageLayout from "examples/LayoutContainers/PageLayout";
import Footer from "examples/Footer";
import PublicNavbar from "layouts/rastreo-guia/components/PublicNavbar";
import api from "services/api";

const BRAND_COLORS = {
  deepBlue: "#0B1F3B",
  gold: "#F5B400",
  white: "#FFFFFF",
};

const STATUS_OPTIONS = [
  { value: 0, label: "Inactivo" },
  { value: 1, label: "Activo" },
  { value: 2, label: "Entregado" },
  { value: 3, label: "Cancelado" },
  { value: 4, label: "Retrasado" },
  { value: 5, label: "Pendiente" },
];

const LOCATION_OPTIONS = [
  { value: 0, label: "Bodega Cúcuta" },
  { value: 1, label: "Viajando Bucaramanga" },
  { value: 2, label: "Bodega Bucaramanga" },
  { value: 3, label: "Viajando Bogotá" },
  { value: 4, label: "Bodega Bogotá" },
  { value: 5, label: "Entregado" },
];

const DELIVERED_STATUS_ID = 2;
const DELIVERED_LOCATION_ID = 5;

const getStatusLabel = (statusId) => {
  const parsedStatusId = Number(statusId);
  const foundStatus = STATUS_OPTIONS.find((status) => status.value === parsedStatusId);

  return foundStatus?.label || "Estado no disponible";
};

const getLocationLabel = (locationId) => {
  const parsedLocationId = Number(locationId);
  const foundLocation = LOCATION_OPTIONS.find((location) => location.value === parsedLocationId);

  return foundLocation?.label || "Ubicación no disponible";
};

const isKnownStatus = (statusId) => {
  const parsedStatusId = Number(statusId);

  return STATUS_OPTIONS.some((status) => status.value === parsedStatusId);
};

const isKnownLocation = (locationId) => {
  const parsedLocationId = Number(locationId);

  return LOCATION_OPTIONS.some((location) => location.value === parsedLocationId);
};

const getStatusPresentation = (statusId) => {
  const parsedStatusId = Number(statusId);

  if (parsedStatusId === 2) {
    return {
      severity: "success",
      message: "El envío ya fue entregado en su destino final.",
    };
  }

  if (parsedStatusId === 3) {
    return {
      severity: "error",
      message: "El envío se encuentra cancelado.",
    };
  }

  if (parsedStatusId === 4) {
    return {
      severity: "warning",
      message: "El envío presenta retraso en su operación.",
    };
  }

  return null;
};

const getStatusTone = (statusId) => {
  const parsedStatusId = Number(statusId);

  if (parsedStatusId === 2) {
    return "success";
  }

  if (parsedStatusId === 3) {
    return "error";
  }

  if (parsedStatusId === 4) {
    return "warning";
  }

  return "info";
};

const normalizeTrackingResponse = (payload) => {
  if (!payload) {
    return null;
  }

  if (Array.isArray(payload)) {
    return payload[0] || null;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data[0] || null;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items[0] || null;
  }

  if (payload.shipment && typeof payload.shipment === "object") {
    return payload.shipment;
  }

  if (payload.id || payload.trackingCode) {
    return payload;
  }

  return null;
};

const getStepState = (stepValue, currentLocationId) => {
  const parsedCurrentLocationId = Number(currentLocationId);

  if (Number.isNaN(parsedCurrentLocationId)) {
    return "unknown";
  }

  if (stepValue < parsedCurrentLocationId) {
    return "completed";
  }

  if (stepValue === parsedCurrentLocationId) {
    return "current";
  }

  return "pending";
};

const shouldMarkConnectorAsComplete = (nextStepValue, currentLocationId) => {
  const parsedCurrentLocationId = Number(currentLocationId);

  if (Number.isNaN(parsedCurrentLocationId)) {
    return false;
  }

  return nextStepValue <= parsedCurrentLocationId;
};

function RastreoGuia() {
  const [trackingCode, setTrackingCode] = useState("");
  const [uiState, setUiState] = useState("idle");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [shipmentResult, setShipmentResult] = useState(null);
  const [queryTrackingCode, setQueryTrackingCode] = useState("");
  const statusPresentation = useMemo(
    () => getStatusPresentation(shipmentResult?.statusId),
    [shipmentResult]
  );
  const currentStatusTone = getStatusTone(shipmentResult?.statusId);
  const timelineLocationId = useMemo(() => {
    const parsedLocationId = Number(shipmentResult?.locationId);
    const parsedStatusId = Number(shipmentResult?.statusId);

    if (parsedStatusId === DELIVERED_STATUS_ID) {
      return DELIVERED_LOCATION_ID;
    }

    return Number.isNaN(parsedLocationId) ? shipmentResult?.locationId : parsedLocationId;
  }, [shipmentResult]);

  const handleSearch = async (event) => {
    event.preventDefault();

    const cleanTrackingCode = trackingCode.trim();

    if (!cleanTrackingCode) {
      setUiState("error");
      setFeedbackMessage("Debes ingresar un tracking code para realizar la búsqueda.");
      setShipmentResult(null);
      return;
    }

    setUiState("loading");
    setFeedbackMessage("");
    setShipmentResult(null);
    setQueryTrackingCode(cleanTrackingCode);

    try {
      const response = await api.get(
        `/api/shipment/tracking/${encodeURIComponent(cleanTrackingCode)}`,
        {
          validateStatus: (status) => status === 200 || status === 404,
        }
      );

      if (response.status === 404) {
        setUiState("empty");
        setFeedbackMessage("No encontramos una guía con ese tracking code.");
        return;
      }

      const normalizedShipment = normalizeTrackingResponse(response.data);

      if (!normalizedShipment) {
        setUiState("empty");
        setFeedbackMessage("No encontramos una guía con ese tracking code.");
        return;
      }

      setUiState("success");
      setShipmentResult(normalizedShipment);
      setFeedbackMessage("Guía encontrada exitosamente.");
    } catch (error) {
      const backendMessage = error.response?.data?.message;
      const message =
        (Array.isArray(backendMessage) && backendMessage.join(". ")) ||
        backendMessage ||
        "No fue posible consultar la guía en este momento. Intenta nuevamente.";

      setUiState("error");
      setFeedbackMessage(message);
      setShipmentResult(null);
    }
  };

  return (
    <PageLayout background="light">
      <PublicNavbar light />
      <MDBox minHeight="100vh" px={2} pt={14} pb={8}>
        <Grid container spacing={3} justifyContent="center">
          <Grid item xs={12} lg={10}>
            <Card sx={{ overflow: "hidden" }}>
              <MDBox
                py={4}
                px={{ xs: 3, md: 4 }}
                sx={{
                  backgroundColor: BRAND_COLORS.deepBlue,
                  borderTop: `4px solid ${BRAND_COLORS.gold}`,
                }}
              >
                <MDBox display="flex" flexDirection={{ xs: "column", md: "row" }} gap={3}>
                  <MDBox flex={1}>
                    <MDBox display="flex" alignItems="center" gap={1.2}>
                      <MDBox
                        width="2rem"
                        height="2rem"
                        borderRadius="md"
                        bgColor="white"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        sx={{ border: `1px solid ${BRAND_COLORS.gold}` }}
                      >
                        <Icon sx={{ color: BRAND_COLORS.deepBlue }}>inventory_2</Icon>
                      </MDBox>
                      <MDTypography variant="h4" color="white" fontWeight="bold">
                        Rastreo de guía
                      </MDTypography>
                    </MDBox>
                    <MDTypography variant="button" color="white" display="block" mt={1.2}>
                      Consulta en tiempo real el estado de tu envío con trazabilidad clara y
                      actualizada.
                    </MDTypography>
                  </MDBox>

                  <MDBox
                    display="grid"
                    gridTemplateColumns={{ xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" }}
                    gap={1.2}
                    minWidth={{ md: "22rem" }}
                  >
                    <MDBox bgColor="light" borderRadius="lg" px={2} py={1.3}>
                      <MDTypography variant="caption" color="text" display="block">
                        Consulta rápida
                      </MDTypography>
                      <MDTypography variant="button" color="dark" fontWeight="bold">
                        24/7
                      </MDTypography>
                    </MDBox>
                    <MDBox bgColor="light" borderRadius="lg" px={2} py={1.3}>
                      <MDTypography variant="caption" color="text" display="block">
                        Resultado
                      </MDTypography>
                      <MDTypography variant="button" color="dark" fontWeight="bold">
                        Estado + ubicación
                      </MDTypography>
                    </MDBox>
                    <MDBox bgColor="light" borderRadius="lg" px={2} py={1.3}>
                      <MDTypography variant="caption" color="text" display="block">
                        Seguimiento
                      </MDTypography>
                      <MDTypography variant="button" color="dark" fontWeight="bold">
                        Punto a punto
                      </MDTypography>
                    </MDBox>
                  </MDBox>
                </MDBox>
              </MDBox>
            </Card>
          </Grid>

          <Grid item xs={12} lg={7}>
            <Card>
              <MDBox p={{ xs: 3, md: 4 }}>
                <MDTypography variant="h5" color="dark" fontWeight="bold">
                  Consulta tu envío
                </MDTypography>
                <MDTypography variant="button" color="text" display="block" mt={0.5}>
                  Ingresa el código de guía y obtén el estado actual en segundos.
                </MDTypography>

                <MDBox
                  component="form"
                  onSubmit={handleSearch}
                  mt={3}
                  display="flex"
                  flexDirection={{ xs: "column", sm: "row" }}
                  gap={1.5}
                >
                  <MDInput
                    fullWidth
                    label="Código de guía"
                    value={trackingCode}
                    onChange={(event) => setTrackingCode(event.target.value)}
                    disabled={uiState === "loading"}
                  />
                  <MDButton
                    variant="contained"
                    type="submit"
                    disabled={uiState === "loading"}
                    sx={{
                      minWidth: { sm: "9rem" },
                      backgroundColor: BRAND_COLORS.deepBlue,
                      color: BRAND_COLORS.white,
                      border: `1px solid ${BRAND_COLORS.deepBlue}`,
                      "&:hover": {
                        backgroundColor: BRAND_COLORS.deepBlue,
                        opacity: 0.92,
                      },
                    }}
                  >
                    {uiState === "loading" ? "Buscando..." : "Buscar"}
                  </MDButton>
                </MDBox>

                <MDTypography variant="caption" color="text" display="block" mt={1.2}>
                  Ejemplo: ZENDA123456789
                </MDTypography>

                {uiState === "loading" && (
                  <MDBox mt={2.5} display="flex" alignItems="center" gap={1}>
                    <CircularProgress size={18} sx={{ color: BRAND_COLORS.gold }} />
                    <MDTypography variant="button" color="text">
                      Consultando guía...
                    </MDTypography>
                  </MDBox>
                )}

                {(uiState === "error" || uiState === "empty" || uiState === "success") &&
                  feedbackMessage && (
                    <MDBox mt={2.5}>
                      <Alert
                        severity={
                          uiState === "success"
                            ? "success"
                            : uiState === "empty"
                              ? "warning"
                              : "error"
                        }
                      >
                        {feedbackMessage}
                      </Alert>
                    </MDBox>
                  )}

                {(uiState === "empty" || uiState === "error") && queryTrackingCode && (
                  <MDBox mt={1.5}>
                    <MDTypography variant="caption" color="text" display="block">
                      Última búsqueda: {queryTrackingCode}
                    </MDTypography>
                  </MDBox>
                )}

                {uiState === "success" && shipmentResult && (
                  <MDBox mt={3.5} p={2.5} bgColor="light" borderRadius="lg">
                    <MDBox
                      display="flex"
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      justifyContent="space-between"
                      flexDirection={{ xs: "column", sm: "row" }}
                      gap={1}
                    >
                      <MDTypography variant="button" color="dark" fontWeight="bold">
                        Guía: {shipmentResult?.trackingCode || "-"}
                      </MDTypography>
                      <MDBox
                        px={1.5}
                        py={0.5}
                        borderRadius="md"
                        bgColor={currentStatusTone}
                        display="inline-flex"
                      >
                        <MDTypography variant="caption" color="white" fontWeight="bold">
                          {getStatusLabel(shipmentResult?.statusId)}
                        </MDTypography>
                      </MDBox>
                    </MDBox>

                    <MDTypography variant="button" color="text" display="block" mt={1.2}>
                      Ubicación actual: {getLocationLabel(timelineLocationId)}
                    </MDTypography>

                    {statusPresentation && (
                      <MDBox mt={2}>
                        <Alert severity={statusPresentation.severity}>
                          {statusPresentation.message}
                        </Alert>
                      </MDBox>
                    )}

                    {!isKnownStatus(shipmentResult?.statusId) && (
                      <MDBox mt={2}>
                        <Alert severity="warning">
                          El estado recibido no está en el catálogo operativo. Se muestra como no
                          disponible.
                        </Alert>
                      </MDBox>
                    )}

                    {!isKnownLocation(timelineLocationId) && (
                      <MDBox mt={2}>
                        <Alert severity="warning">
                          La ubicación recibida no está en el catálogo operativo. No es posible
                          pintar el recorrido de forma confiable.
                        </Alert>
                      </MDBox>
                    )}

                    {isKnownLocation(timelineLocationId) && (
                      <MDBox mt={2.5}>
                        <Divider />
                        <MDTypography
                          variant="button"
                          color="dark"
                          fontWeight="bold"
                          display="block"
                          mt={2}
                          mb={1.5}
                        >
                          Recorrido del envío
                        </MDTypography>

                        {LOCATION_OPTIONS.map((location, index) => {
                          const stepState = getStepState(location.value, timelineLocationId);
                          const stepIconColor =
                            stepState === "completed" || stepState === "current"
                              ? "success"
                              : "disabled";
                          const stepIcon =
                            stepState === "completed"
                              ? "check_circle"
                              : stepState === "current"
                                ? "radio_button_checked"
                                : "radio_button_unchecked";

                          return (
                            <MDBox
                              key={location.value}
                              display="flex"
                              alignItems="flex-start"
                              gap={1.5}
                            >
                              <MDBox
                                display="flex"
                                flexDirection="column"
                                alignItems="center"
                                pt={0.2}
                              >
                                <Icon color={stepIconColor}>{stepIcon}</Icon>
                                {index < LOCATION_OPTIONS.length - 1 && (
                                  <MDBox
                                    width="2px"
                                    minHeight="1.5rem"
                                    mt={0.3}
                                    mb={0.1}
                                    bgColor={
                                      shouldMarkConnectorAsComplete(
                                        LOCATION_OPTIONS[index + 1].value,
                                        timelineLocationId
                                      )
                                        ? "success"
                                        : "light"
                                    }
                                  />
                                )}
                              </MDBox>

                              <MDBox pt={0.25}>
                                <MDTypography
                                  variant="button"
                                  color={
                                    stepState === "completed" || stepState === "current"
                                      ? "success"
                                      : "text"
                                  }
                                  fontWeight={stepState === "current" ? "bold" : "regular"}
                                >
                                  {location.label}
                                </MDTypography>
                              </MDBox>
                            </MDBox>
                          );
                        })}
                      </MDBox>
                    )}
                  </MDBox>
                )}
              </MDBox>
            </Card>
          </Grid>

          <Grid item xs={12} lg={3}>
            <Card sx={{ mb: 3 }}>
              <MDBox p={3}>
                <MDTypography variant="h6" color="dark" fontWeight="bold" mb={2}>
                  ¿Cómo rastrear?
                </MDTypography>

                <MDBox display="flex" alignItems="flex-start" gap={1.2} mb={1.8}>
                  <Icon sx={{ color: BRAND_COLORS.gold }}>looks_one</Icon>
                  <MDTypography variant="button" color="text">
                    Ingresa tu código de guía completo.
                  </MDTypography>
                </MDBox>

                <MDBox display="flex" alignItems="flex-start" gap={1.2} mb={1.8}>
                  <Icon sx={{ color: BRAND_COLORS.gold }}>looks_two</Icon>
                  <MDTypography variant="button" color="text">
                    Haz clic en buscar para consultar el estado más reciente.
                  </MDTypography>
                </MDBox>

                <MDBox display="flex" alignItems="flex-start" gap={1.2}>
                  <Icon sx={{ color: BRAND_COLORS.gold }}>looks_3</Icon>
                  <MDTypography variant="button" color="text">
                    Revisa el recorrido y la ubicación actual del envío.
                  </MDTypography>
                </MDBox>

                <Divider sx={{ my: 2 }} />

                <MDTypography
                  variant="button"
                  color="dark"
                  fontWeight="bold"
                  display="block"
                  mb={1}
                >
                  Recomendaciones
                </MDTypography>
                <MDTypography variant="caption" color="text" display="block">
                  Verifica que no haya espacios al inicio o al final del código.
                </MDTypography>
                <MDTypography variant="caption" color="text" display="block" mt={0.8}>
                  Si no encuentras resultados, confirma el número de guía con el remitente.
                </MDTypography>
              </MDBox>
            </Card>

            <Card id="quienes-somos">
              <MDBox p={3}>
                <MDTypography variant="h6" color="dark" fontWeight="bold" mb={1}>
                  Quiénes somos
                </MDTypography>
                <MDTypography variant="button" color="text">
                  Zenda es una plataforma logística enfocada en visibilidad, trazabilidad y
                  experiencia digital para el seguimiento de envíos.
                </MDTypography>
              </MDBox>
            </Card>

            <Card sx={{ mt: 3 }}>
              <MDBox p={3}>
                <MDTypography variant="h6" color="dark" fontWeight="bold" mb={1}>
                  ¿Tienes dudas?
                </MDTypography>
                <MDTypography variant="button" color="text" display="block">
                  Estamos para ayudarte. Comunícate con nuestra línea de atención y recibe
                  acompañamiento sobre el estado de tu envío.
                </MDTypography>

                <MDBox mt={2} display="flex" alignItems="center" gap={1}>
                  <Icon sx={{ color: BRAND_COLORS.gold }}>call</Icon>
                  <MDTypography variant="button" color="dark" fontWeight="bold">
                    Línea nacional: 123456789
                  </MDTypography>
                </MDBox>

                <MDBox mt={2}>
                  <MDButton
                    component="a"
                    href="https://wa.me/573123456789"
                    target="_blank"
                    rel="noreferrer"
                    variant="contained"
                    fullWidth
                    sx={{
                      backgroundColor: "#25D366",
                      color: BRAND_COLORS.white,
                      border: "1px solid #25D366",
                      "&:hover": {
                        backgroundColor: "#128C7E",
                        borderColor: "#128C7E",
                      },
                    }}
                  >
                    <WhatsAppIcon sx={{ mr: 1 }} fontSize="small" />
                    Ir a WhatsApp de soporte
                  </MDButton>
                </MDBox>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>

      <MDBox px={2} pb={3}>
        <Footer />
      </MDBox>
    </PageLayout>
  );
}

export default RastreoGuia;
