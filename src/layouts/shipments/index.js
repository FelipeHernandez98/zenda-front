import { useMemo, useState, useEffect } from "react";
import { Formik } from "formik";
import * as Yup from "yup";
import PropTypes from "prop-types";

import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Icon from "@mui/material/Icon";
import IconButton from "@mui/material/IconButton";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import Select from "@mui/material/Select";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import MDInput from "components/MDInput";
import MDBadge from "components/MDBadge";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import DataTable from "examples/Tables/DataTable";

import api from "services/api";

const normalizeShipmentsResponse = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.shipments)) {
    return payload.shipments;
  }

  if (payload?.id) {
    return [payload];
  }

  return [];
};

const normalizeClientsResponse = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.clients)) {
    return payload.clients;
  }

  return [];
};

const normalizeUsersResponse = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.users)) {
    return payload.users;
  }

  return [];
};

const normalizeSingleShipmentResponse = (payload) => {
  if (!payload || Array.isArray(payload)) {
    return null;
  }

  if (payload?.id) {
    return payload;
  }

  if (payload?.data && !Array.isArray(payload.data)) {
    return payload.data;
  }

  if (payload?.shipment && !Array.isArray(payload.shipment)) {
    return payload.shipment;
  }

  return null;
};

const sleep = (milliseconds) =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

const resolvePdfUrl = (pdfPath) => {
  if (!pdfPath || typeof pdfPath !== "string") {
    return "";
  }

  const cleanPath = pdfPath.trim();
  if (!cleanPath) {
    return "";
  }

  if (/^https?:\/\//i.test(cleanPath)) {
    return cleanPath;
  }

  const baseUrl = api.defaults.baseURL || window.location.origin;

  try {
    return new URL(cleanPath, baseUrl).href;
  } catch (_error) {
    return cleanPath;
  }
};

const getApiBaseUrl = () => {
  const configuredBaseUrl = api.defaults.baseURL;

  if (configuredBaseUrl) {
    try {
      return new URL(configuredBaseUrl, window.location.origin).href;
    } catch (_error) {
      return window.location.origin;
    }
  }

  return window.location.origin;
};

const isExternalUrl = (url) => {
  if (!/^https?:\/\//i.test(url)) {
    return false;
  }

  try {
    const parsedUrl = new URL(url);
    const apiOrigin = new URL(getApiBaseUrl()).origin;
    return parsedUrl.origin !== apiOrigin;
  } catch (_error) {
    return false;
  }
};

const getPdfFileName = (shipment) => {
  if (shipment?.trackingCode) {
    return `${shipment.trackingCode}.pdf`;
  }

  if (shipment?.id) {
    return `shipment-${shipment.id}.pdf`;
  }

  return "shipment-guide.pdf";
};

const triggerBrowserDownload = (pdfUrl, fileName) => {
  const anchor = document.createElement("a");
  anchor.href = pdfUrl;
  anchor.download = fileName;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
};

const triggerBlobDownload = (pdfBlob, fileName) => {
  const blobUrl = URL.createObjectURL(pdfBlob);
  triggerBrowserDownload(blobUrl, fileName);
  setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 60000);
};

const openPdfBlobInNewTab = (pdfBlob) => {
  const blobUrl = URL.createObjectURL(pdfBlob);
  window.open(blobUrl, "_blank", "noopener,noreferrer");
  setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 60000);
};

const fetchPdfBlobFromUrl = async (pdfUrl) => {
  const response = await api.get(pdfUrl, {
    responseType: "blob",
    suppressGlobalNotification: true,
  });

  return response.data;
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
];

const getStatusLabel = (statusId) => {
  const parsedStatusId = Number(statusId);
  const foundStatus = STATUS_OPTIONS.find((status) => status.value === parsedStatusId);
  return foundStatus?.label || "Sin estado";
};

const getStatusColor = (statusId) => {
  const parsedStatusId = Number(statusId);

  if (parsedStatusId === 1) {
    return "success";
  }

  if (parsedStatusId === 2) {
    return "info";
  }

  if (parsedStatusId === 3) {
    return "error";
  }

  if (parsedStatusId === 4) {
    return "warning";
  }

  if (parsedStatusId === 5) {
    return "secondary";
  }

  return "dark";
};

const getLocationLabel = (locationId) => {
  const parsedLocationId = Number(locationId);
  const foundLocation = LOCATION_OPTIONS.find((location) => location.value === parsedLocationId);
  return foundLocation?.label || "Sin ubicación";
};

const createShipmentSchema = Yup.object({
  remitterId: Yup.string().trim().required("El remitente es obligatorio"),
  recipientId: Yup.string().trim().required("El destinatario es obligatorio"),
  userId: Yup.string().trim().required("El usuario creador es obligatorio"),
  packageDescription: Yup.string()
    .trim()
    .required("La descripción del paquete es obligatoria")
    .max(100, "Máximo 100 caracteres"),
});

const editShipmentSchema = Yup.object({
  packageDescription: Yup.string().trim().max(100, "Máximo 100 caracteres"),
  locationId: Yup.number().typeError("Debe ser número").nullable(),
  statusId: Yup.number().typeError("Debe ser número").nullable(),
});

function DeleteConfirmDialog({ open, title, message, onClose, onConfirm, loading }) {
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>
        <MDBox display="flex" alignItems="center" gap={1}>
          <Icon color="error">warning</Icon>
          <MDTypography variant="h6" fontWeight="medium">
            {title}
          </MDTypography>
        </MDBox>
      </DialogTitle>
      <DialogContent>
        <MDTypography variant="button" color="text">
          {message}
        </MDTypography>
      </DialogContent>
      <DialogActions>
        <MDButton variant="outlined" color="secondary" onClick={onClose} disabled={loading}>
          Cancelar
        </MDButton>
        <MDButton variant="gradient" color="error" onClick={onConfirm} disabled={loading}>
          {loading ? "Eliminando..." : "Eliminar"}
        </MDButton>
      </DialogActions>
    </Dialog>
  );
}

function ShipmentFormDialog({ open, mode, initialValues, onClose, onSubmit, clients, users }) {
  const isEdit = mode === "edit";

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        <MDBox display="flex" alignItems="center" gap={1}>
          <Icon color="info">local_shipping</Icon>
          <MDBox>
            <MDTypography variant="h6" fontWeight="medium">
              {isEdit ? "Actualizar envío" : "Registrar envío"}
            </MDTypography>
            <MDTypography variant="button" color="text">
              Configura participantes y detalle operativo del envío.
            </MDTypography>
          </MDBox>
        </MDBox>
      </DialogTitle>
      <Formik
        initialValues={initialValues}
        validationSchema={isEdit ? editShipmentSchema : createShipmentSchema}
        enableReinitialize
        onSubmit={onSubmit}
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleBlur,
          handleSubmit,
          isSubmitting,
          setFieldValue,
          setFieldTouched,
        }) => (
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <MDBox mt={1}>
                {!isEdit && (
                  <>
                    <MDTypography
                      variant="button"
                      fontWeight="bold"
                      color="info"
                      textTransform="uppercase"
                    >
                      Participantes
                    </MDTypography>
                    <Grid container spacing={2} mt={0.5}>
                      <Grid item xs={12}>
                        <Autocomplete
                          options={clients}
                          value={clients.find((client) => client.id === values.remitterId) || null}
                          onChange={(_, selectedClient) => {
                            setFieldValue("remitterId", selectedClient?.id || "");
                          }}
                          onBlur={() => setFieldTouched("remitterId", true)}
                          getOptionLabel={(option) =>
                            `${option.documentNumber || ""} - ${option.name || ""} ${
                              option.lastname || ""
                            }`.trim()
                          }
                          isOptionEqualToValue={(option, value) => option.id === value.id}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Remitente (documento)"
                              error={Boolean(touched.remitterId && errors.remitterId)}
                              helperText={
                                touched.remitterId && errors.remitterId ? errors.remitterId : ""
                              }
                            />
                          )}
                        />
                        {values.remitterId && (
                          <MDTypography variant="caption" color="text" mt={0.5} display="block">
                            ID remitente seleccionado: {values.remitterId}
                          </MDTypography>
                        )}
                      </Grid>
                      <Grid item xs={12}>
                        <Autocomplete
                          options={clients}
                          value={clients.find((client) => client.id === values.recipientId) || null}
                          onChange={(_, selectedClient) => {
                            setFieldValue("recipientId", selectedClient?.id || "");
                          }}
                          onBlur={() => setFieldTouched("recipientId", true)}
                          getOptionLabel={(option) =>
                            `${option.documentNumber || ""} - ${option.name || ""} ${
                              option.lastname || ""
                            }`.trim()
                          }
                          isOptionEqualToValue={(option, value) => option.id === value.id}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Destinatario (documento)"
                              error={Boolean(touched.recipientId && errors.recipientId)}
                              helperText={
                                touched.recipientId && errors.recipientId ? errors.recipientId : ""
                              }
                            />
                          )}
                        />
                        {values.recipientId && (
                          <MDTypography variant="caption" color="text" mt={0.5} display="block">
                            ID destinatario seleccionado: {values.recipientId}
                          </MDTypography>
                        )}
                      </Grid>
                      <Grid item xs={12}>
                        <Autocomplete
                          options={users}
                          value={users.find((user) => user.id === values.userId) || null}
                          onChange={(_, selectedUser) => {
                            setFieldValue("userId", selectedUser?.id || "");
                          }}
                          onBlur={() => setFieldTouched("userId", true)}
                          getOptionLabel={(option) => option.username || ""}
                          isOptionEqualToValue={(option, value) => option.id === value.id}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Usuario creador (username)"
                              error={Boolean(touched.userId && errors.userId)}
                              helperText={touched.userId && errors.userId ? errors.userId : ""}
                            />
                          )}
                        />
                        {values.userId && (
                          <MDTypography variant="caption" color="text" mt={0.5} display="block">
                            ID usuario seleccionado: {values.userId}
                          </MDTypography>
                        )}
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 2 }} />
                  </>
                )}

                <MDTypography
                  variant="button"
                  fontWeight="bold"
                  color="info"
                  textTransform="uppercase"
                >
                  Detalle del envío
                </MDTypography>
                <Grid container spacing={2} mt={0.5}>
                  <Grid item xs={12}>
                    <MDInput
                      label="Descripción del paquete"
                      name="packageDescription"
                      value={values.packageDescription}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={Boolean(touched.packageDescription && errors.packageDescription)}
                      helperText={
                        touched.packageDescription && errors.packageDescription
                          ? errors.packageDescription
                          : ""
                      }
                      fullWidth
                    />
                  </Grid>
                  {isEdit && (
                    <>
                      <Grid item xs={12} md={6}>
                        <MDTypography variant="button" color="text" fontWeight="regular" ml={0.5}>
                          Ubicación
                        </MDTypography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <MDTypography variant="button" color="text" fontWeight="regular" ml={0.5}>
                          Estado
                        </MDTypography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControl
                          fullWidth
                          error={Boolean(touched.locationId && errors.locationId)}
                          sx={{ mt: 0.5 }}
                        >
                          <Select
                            displayEmpty
                            name="locationId"
                            value={values.locationId}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            sx={{
                              height: "56px",
                              "& .MuiSelect-select": {
                                height: "56px",
                                minHeight: "56px !important",
                                display: "flex",
                                alignItems: "center",
                                boxSizing: "border-box",
                                paddingTop: 0,
                                paddingBottom: 0,
                              },
                            }}
                            renderValue={(selectedValue) => {
                              if (selectedValue === "" || selectedValue === null) {
                                return "Seleccionar ubicación";
                              }

                              const locationLabel = getLocationLabel(selectedValue);
                              return locationLabel === "Sin ubicación"
                                ? "Seleccionar ubicación"
                                : locationLabel;
                            }}
                          >
                            <MenuItem value="" disabled>
                              Seleccionar ubicación
                            </MenuItem>
                            {LOCATION_OPTIONS.map((location) => (
                              <MenuItem key={location.value} value={location.value}>
                                {location.label}
                              </MenuItem>
                            ))}
                          </Select>
                          {touched.locationId && errors.locationId && (
                            <FormHelperText>{errors.locationId}</FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControl
                          fullWidth
                          error={Boolean(touched.statusId && errors.statusId)}
                          sx={{ mt: 0.5 }}
                        >
                          <Select
                            displayEmpty
                            name="statusId"
                            value={values.statusId}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            sx={{
                              height: "56px",
                              "& .MuiSelect-select": {
                                height: "56px",
                                minHeight: "56px !important",
                                display: "flex",
                                alignItems: "center",
                                boxSizing: "border-box",
                                paddingTop: 0,
                                paddingBottom: 0,
                              },
                            }}
                            renderValue={(selectedValue) => {
                              if (selectedValue === "" || selectedValue === null) {
                                return "Seleccionar estado";
                              }

                              const statusLabel = getStatusLabel(selectedValue);
                              return statusLabel === "Sin estado"
                                ? "Seleccionar estado"
                                : statusLabel;
                            }}
                          >
                            <MenuItem value="" disabled>
                              Seleccionar estado
                            </MenuItem>
                            {STATUS_OPTIONS.map((status) => (
                              <MenuItem key={status.value} value={status.value}>
                                {status.label}
                              </MenuItem>
                            ))}
                          </Select>
                          {touched.statusId && errors.statusId && (
                            <FormHelperText>{errors.statusId}</FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                    </>
                  )}
                </Grid>
              </MDBox>
            </DialogContent>
            <DialogActions>
              <MDButton variant="outlined" color="secondary" onClick={onClose}>
                Cancelar
              </MDButton>
              <MDButton variant="gradient" color="info" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : isEdit ? "Actualizar" : "Crear"}
              </MDButton>
            </DialogActions>
          </form>
        )}
      </Formik>
    </Dialog>
  );
}

function Shipments() {
  const [shipments, setShipments] = useState([]);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("create");
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedShipmentToDelete, setSelectedShipmentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [trackingFilter, setTrackingFilter] = useState("");
  const [activeTrackingFilter, setActiveTrackingFilter] = useState("");

  const initialFormValues = {
    remitterId: selectedShipment?.remitterId || "",
    recipientId: selectedShipment?.recipientId || "",
    userId: selectedShipment?.userId || "",
    packageDescription: selectedShipment?.packageDescription || "",
    locationId: selectedShipment?.locationId || "",
    statusId: selectedShipment?.statusId || "",
  };

  const fetchShipments = async (trackingCode = "") => {
    try {
      setLoading(true);
      setError("");
      const endpoint = trackingCode
        ? `/api/shipment/tracking/${encodeURIComponent(trackingCode)}`
        : "/api/shipment";
      const response = await api.get(endpoint);
      setShipments(normalizeShipmentsResponse(response.data));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "No se pudieron cargar los envíos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments("");
  }, []);

  const fetchClients = async () => {
    try {
      setClientsLoading(true);
      const response = await api.get("/api/client");
      setClients(normalizeClientsResponse(response.data));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "No se pudieron cargar los clientes.");
    } finally {
      setClientsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await api.get("/api/user");
      setUsers(normalizeUsersResponse(response.data));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "No se pudieron cargar los usuarios.");
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!successMessage && !error) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setSuccessMessage("");
      setError("");
    }, 4500);

    return () => clearTimeout(timer);
  }, [successMessage, error]);

  const handleSearchByTracking = async () => {
    const cleanValue = trackingFilter.trim();
    setActiveTrackingFilter(cleanValue);
    await fetchShipments(cleanValue);
  };

  const handleClearFilter = async () => {
    setTrackingFilter("");
    setActiveTrackingFilter("");
    await fetchShipments("");
  };

  const handleOpenCreate = () => {
    setDialogMode("create");
    setSelectedShipment(null);
    setOpenDialog(true);
  };

  const handleOpenEdit = (shipment) => {
    setDialogMode("edit");
    setSelectedShipment(shipment);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleOpenDeleteDialog = (shipment) => {
    if (!shipment?.id) {
      return;
    }

    setSelectedShipmentToDelete(shipment);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    if (isDeleting) {
      return;
    }

    setDeleteDialogOpen(false);
    setSelectedShipmentToDelete(null);
  };

  const handleSubmitShipment = async (values, { setSubmitting }) => {
    setError("");
    setSuccessMessage("");

    try {
      if (dialogMode === "edit" && selectedShipment?.id) {
        const payload = {};

        if (values.packageDescription?.trim()) {
          payload.packageDescription = values.packageDescription.trim();
        }
        if (values.locationId !== "" && values.locationId !== null) {
          payload.locationId = Number(values.locationId);
        }
        if (values.statusId !== "" && values.statusId !== null) {
          payload.statusId = Number(values.statusId);
        }

        if (Object.keys(payload).length === 0) {
          setError("Debes editar al menos un campo para actualizar el envío.");
          setSubmitting(false);
          return;
        }

        await api.patch(`/api/shipment/${selectedShipment.id}`, payload);
        setSuccessMessage("Envío actualizado correctamente.");
      } else {
        const payload = {
          remitterId: values.remitterId.trim(),
          recipientId: values.recipientId.trim(),
          userId: values.userId.trim(),
          packageDescription: values.packageDescription.trim(),
        };
        const createResponse = await api.post("/api/shipment", payload);
        const createdShipment = normalizeSingleShipmentResponse(createResponse.data);

        let pdfPath = createdShipment?.pdfPath;

        if (!pdfPath && createdShipment?.id) {
          for (let retry = 0; retry < 6; retry += 1) {
            await sleep(800);
            const shipmentResponse = await api.get(`/api/shipment/${createdShipment.id}`, {
              suppressGlobalNotification: true,
            });
            const shipmentUpdated = normalizeSingleShipmentResponse(shipmentResponse.data);
            pdfPath = shipmentUpdated?.pdfPath;

            if (pdfPath) {
              break;
            }
          }
        }

        if (pdfPath) {
          const resolvedPdfUrl = resolvePdfUrl(pdfPath);
          const fileName = getPdfFileName(createdShipment);

          try {
            if (isExternalUrl(resolvedPdfUrl)) {
              triggerBrowserDownload(resolvedPdfUrl, fileName);
            } else {
              const pdfBlob = await fetchPdfBlobFromUrl(resolvedPdfUrl);
              triggerBlobDownload(pdfBlob, fileName);
            }
            setSuccessMessage("Envío creado correctamente. Descarga de guía iniciada.");
          } catch (_downloadError) {
            if (createdShipment?.id) {
              const pdfResponse = await api.get(`/api/shipment/${createdShipment.id}/pdf`, {
                responseType: "blob",
                suppressGlobalNotification: true,
              });
              triggerBlobDownload(pdfResponse.data, fileName);
              setSuccessMessage("Envío creado correctamente. Descarga de guía iniciada.");
            } else {
              throw _downloadError;
            }
          }
        } else {
          setSuccessMessage("Envío creado correctamente. La guía PDF aún no está disponible.");
        }
      }

      setOpenDialog(false);
      await fetchShipments(activeTrackingFilter);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "No fue posible guardar el envío.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteShipment = async () => {
    if (!selectedShipmentToDelete?.id) {
      return;
    }

    setError("");
    setSuccessMessage("");
    setIsDeleting(true);

    try {
      await api.delete(`/api/shipment/${selectedShipmentToDelete.id}`);
      setSuccessMessage("El envío se eliminó correctamente.");
      await fetchShipments(activeTrackingFilter);
      handleCloseDeleteDialog();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "No fue posible eliminar el envío.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenShipmentGuide = async (shipment) => {
    if (!shipment?.id) {
      setError("No se encontró información del envío para abrir la guía.");
      return;
    }

    setError("");

    try {
      let pdfPath = shipment.pdfPath;

      if (!pdfPath) {
        const shipmentResponse = await api.get(`/api/shipment/${shipment.id}`, {
          suppressGlobalNotification: true,
        });
        const shipmentUpdated = normalizeSingleShipmentResponse(shipmentResponse.data);
        pdfPath = shipmentUpdated?.pdfPath;
      }

      if (pdfPath) {
        const resolvedPdfUrl = resolvePdfUrl(pdfPath);
        let guideOpenedFromPdfPath = false;

        try {
          if (isExternalUrl(resolvedPdfUrl)) {
            window.open(resolvedPdfUrl, "_blank", "noopener,noreferrer");
            guideOpenedFromPdfPath = true;
          } else {
            const pdfBlob = await fetchPdfBlobFromUrl(resolvedPdfUrl);
            openPdfBlobInNewTab(pdfBlob);
            guideOpenedFromPdfPath = true;
          }
        } catch (_pdfPathError) {
          guideOpenedFromPdfPath = false;
        }

        if (guideOpenedFromPdfPath) {
          return;
        }
      }

      const pdfResponse = await api.get(`/api/shipment/${shipment.id}/pdf`, {
        responseType: "blob",
        suppressGlobalNotification: true,
      });
      openPdfBlobInNewTab(pdfResponse.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "No fue posible abrir la guía PDF.");
    }
  };

  const columns = useMemo(
    () => [
      { Header: "tracking", accessor: "tracking", align: "left" },
      { Header: "detalle", accessor: "detail", align: "left" },
      { Header: "estado", accessor: "status", align: "center" },
      { Header: "ubicación", accessor: "location", align: "center" },
      { Header: "fecha", accessor: "date", align: "center" },
      { Header: "acciones", accessor: "actions", align: "center" },
    ],
    []
  );

  const rows = useMemo(
    () =>
      shipments.map((shipment) => ({
        tracking: (
          <MDBox lineHeight={1}>
            <MDTypography display="block" variant="button" fontWeight="medium">
              {shipment.trackingCode || "-"}
            </MDTypography>
            <MDTypography variant="caption" color="text">
              {shipment.id}
            </MDTypography>
          </MDBox>
        ),
        detail: (
          <MDBox lineHeight={1}>
            <MDTypography variant="caption" color="text" fontWeight="medium" display="block">
              {shipment.packageDescription || "-"}
            </MDTypography>
            <MDTypography variant="caption" color="text">
              Remitente: {shipment.remitterId || "-"} | Destinatario: {shipment.recipientId || "-"}
            </MDTypography>
          </MDBox>
        ),
        status: (
          <MDBox ml={-1} display="flex" justifyContent="center">
            <MDBadge
              badgeContent={getStatusLabel(shipment.statusId)}
              color={getStatusColor(shipment.statusId)}
              variant="gradient"
              size="sm"
            />
          </MDBox>
        ),
        location: (
          <MDTypography variant="caption" color="text" fontWeight="medium">
            {getLocationLabel(shipment.locationId)}
          </MDTypography>
        ),
        date: (
          <MDTypography variant="caption" color="text" fontWeight="medium">
            {shipment.sendDate ? new Date(shipment.sendDate).toLocaleDateString() : "-"}
          </MDTypography>
        ),
        actions: (
          <MDBox display="flex" alignItems="center" justifyContent="center" gap={0.5}>
            <IconButton
              color="dark"
              onClick={() => handleOpenShipmentGuide(shipment)}
              aria-label={`Ver guía de envío ${shipment.trackingCode || ""}`}
            >
              <Icon>picture_as_pdf</Icon>
            </IconButton>
            <IconButton
              color="info"
              onClick={() => handleOpenEdit(shipment)}
              aria-label={`Editar envío ${shipment.trackingCode || ""}`}
            >
              <Icon>edit</Icon>
            </IconButton>
            <IconButton
              color="error"
              onClick={() => handleOpenDeleteDialog(shipment)}
              aria-label={`Eliminar envío ${shipment.trackingCode || ""}`}
            >
              <Icon>delete</Icon>
            </IconButton>
          </MDBox>
        ),
      })),
    [shipments]
  );

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            {error && (
              <MDBox mb={2}>
                <Alert severity="error">{error}</Alert>
              </MDBox>
            )}
            {successMessage && (
              <MDBox mb={2}>
                <Alert severity="success">{successMessage}</Alert>
              </MDBox>
            )}
          </Grid>
          <Grid item xs={12}>
            <Card>
              <MDBox
                mx={2}
                mt={-3}
                py={2}
                px={2}
                variant="gradient"
                bgColor="info"
                borderRadius="lg"
                coloredShadow="info"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <MDTypography variant="h6" color="white">
                  Gestión de envíos
                </MDTypography>
                <MDButton variant="gradient" color="dark" onClick={handleOpenCreate}>
                  Nuevo envío
                </MDButton>
              </MDBox>

              <MDBox px={3} pt={3} display="flex" gap={1} alignItems="center" flexWrap="wrap">
                <MDBox width={{ xs: "100%", sm: "15rem" }}>
                  <MDInput
                    label="Buscar por tracking code"
                    value={trackingFilter}
                    onChange={(event) => setTrackingFilter(event.target.value)}
                    fullWidth
                  />
                </MDBox>
                <MDButton variant="gradient" color="info" onClick={handleSearchByTracking}>
                  Buscar
                </MDButton>
                <MDButton variant="outlined" color="secondary" onClick={handleClearFilter}>
                  Limpiar
                </MDButton>
                {activeTrackingFilter && (
                  <MDTypography variant="caption" color="text">
                    Filtro activo: tracking {activeTrackingFilter}
                  </MDTypography>
                )}
              </MDBox>

              <MDBox pt={3}>
                {loading ? (
                  <MDBox display="flex" justifyContent="center" alignItems="center" py={6}>
                    <CircularProgress color="info" />
                  </MDBox>
                ) : (
                  <DataTable
                    table={{ columns, rows }}
                    isSorted={false}
                    entriesPerPage={{ defaultValue: 10, entries: [5, 10, 15, 20] }}
                    showTotalEntries
                    canSearch
                    noEndBorder
                  />
                )}
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>

      <ShipmentFormDialog
        open={openDialog}
        mode={dialogMode}
        initialValues={initialFormValues}
        onClose={handleCloseDialog}
        onSubmit={handleSubmitShipment}
        clients={clients}
        users={users}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        title="Eliminar envío"
        message={`Esta acción eliminará el envío ${selectedShipmentToDelete?.trackingCode || ""}.`}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleDeleteShipment}
        loading={isDeleting}
      />

      {clientsLoading && (
        <MDBox px={3} pb={2}>
          <MDTypography variant="caption" color="text">
            Cargando clientes para remitente/destinatario...
          </MDTypography>
        </MDBox>
      )}

      {usersLoading && (
        <MDBox px={3} pb={2}>
          <MDTypography variant="caption" color="text">
            Cargando usuarios para seleccionar creador...
          </MDTypography>
        </MDBox>
      )}

      <Footer />
    </DashboardLayout>
  );
}

ShipmentFormDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(["create", "edit"]).isRequired,
  initialValues: PropTypes.shape({
    remitterId: PropTypes.string,
    recipientId: PropTypes.string,
    userId: PropTypes.string,
    packageDescription: PropTypes.string,
    locationId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    statusId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  clients: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      documentNumber: PropTypes.string,
      name: PropTypes.string,
      lastname: PropTypes.string,
    })
  ).isRequired,
  users: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      username: PropTypes.string,
    })
  ).isRequired,
};

DeleteConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
};

export default Shipments;
