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
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import MDInput from "components/MDInput";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import DataTable from "examples/Tables/DataTable";

import api from "services/api";

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

const DOCUMENT_TYPES = ["CC", "TI", "CE", "CD", "NIT", "PAS"];

const clientValidationSchema = Yup.object({
  name: Yup.string().trim().required("El nombre es obligatorio"),
  lastname: Yup.string().trim().required("El apellido es obligatorio"),
  documentType: Yup.string()
    .trim()
    .oneOf(DOCUMENT_TYPES, "Selecciona un tipo de documento válido")
    .required("El tipo de documento es obligatorio"),
  documentNumber: Yup.string().trim().required("El número de documento es obligatorio"),
  phoneNumber: Yup.string().trim().required("El teléfono es obligatorio"),
  address: Yup.string().trim().required("La dirección es obligatoria"),
  city: Yup.string().trim().required("La ciudad es obligatoria"),
  email: Yup.string().trim().email("Correo inválido").required("El correo es obligatorio"),
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

function ClientFormDialog({ open, mode, initialValues, onClose, onSubmit }) {
  const isEdit = mode === "edit";

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        <MDBox display="flex" alignItems="center" gap={1}>
          <Icon color="info">badge</Icon>
          <MDBox>
            <MDTypography variant="h6" fontWeight="medium">
              {isEdit ? "Actualizar cliente" : "Registrar cliente"}
            </MDTypography>
            <MDTypography variant="button" color="text">
              Registra identificación, contacto y ubicación del cliente.
            </MDTypography>
          </MDBox>
        </MDBox>
      </DialogTitle>
      <Formik
        initialValues={initialValues}
        validationSchema={clientValidationSchema}
        enableReinitialize
        onSubmit={onSubmit}
      >
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <MDBox mt={1}>
                <MDTypography
                  variant="button"
                  fontWeight="bold"
                  color="info"
                  textTransform="uppercase"
                >
                  Identificación
                </MDTypography>
                <Grid container spacing={2} mt={0.5}>
                  <Grid item xs={12} md={6}>
                    <MDInput
                      label="Nombre"
                      name="name"
                      value={values.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={Boolean(touched.name && errors.name)}
                      helperText={touched.name && errors.name ? errors.name : ""}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <MDInput
                      label="Apellido"
                      name="lastname"
                      value={values.lastname}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={Boolean(touched.lastname && errors.lastname)}
                      helperText={touched.lastname && errors.lastname ? errors.lastname : ""}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <MDTypography variant="button" color="text" fontWeight="regular" ml={0.5}>
                      Tipo de documento
                    </MDTypography>
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <MDTypography variant="button" color="text" fontWeight="regular" ml={0.5}>
                      Número de documento
                    </MDTypography>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <FormControl
                      fullWidth
                      error={Boolean(touched.documentType && errors.documentType)}
                      sx={{ mt: 0.5 }}
                    >
                      <Select
                        displayEmpty
                        name="documentType"
                        value={values.documentType}
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
                        renderValue={(selectedValue) => selectedValue || "Seleccionar"}
                      >
                        <MenuItem value="" disabled>
                          Seleccionar
                        </MenuItem>
                        {DOCUMENT_TYPES.map((documentType) => (
                          <MenuItem key={documentType} value={documentType}>
                            {documentType}
                          </MenuItem>
                        ))}
                      </Select>
                      {touched.documentType && errors.documentType && (
                        <FormHelperText>{errors.documentType}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <TextField
                      placeholder="Número de documento"
                      name="documentNumber"
                      value={values.documentNumber}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={Boolean(touched.documentNumber && errors.documentNumber)}
                      helperText={
                        touched.documentNumber && errors.documentNumber ? errors.documentNumber : ""
                      }
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          height: "56px",
                        },
                        "& .MuiOutlinedInput-input": {
                          height: "56px",
                          boxSizing: "border-box",
                          paddingTop: 0,
                          paddingBottom: 0,
                        },
                      }}
                      fullWidth
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <MDTypography
                  variant="button"
                  fontWeight="bold"
                  color="info"
                  textTransform="uppercase"
                >
                  Contacto
                </MDTypography>
                <Grid container spacing={2} mt={0.5}>
                  <Grid item xs={12} md={6}>
                    <MDInput
                      label="Teléfono"
                      name="phoneNumber"
                      value={values.phoneNumber}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={Boolean(touched.phoneNumber && errors.phoneNumber)}
                      helperText={
                        touched.phoneNumber && errors.phoneNumber ? errors.phoneNumber : ""
                      }
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <MDInput
                      label="Correo electrónico"
                      name="email"
                      type="email"
                      value={values.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={Boolean(touched.email && errors.email)}
                      helperText={touched.email && errors.email ? errors.email : ""}
                      fullWidth
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <MDTypography
                  variant="button"
                  fontWeight="bold"
                  color="info"
                  textTransform="uppercase"
                >
                  Ubicación
                </MDTypography>
                <Grid container spacing={2} mt={0.5}>
                  <Grid item xs={12} md={4}>
                    <MDInput
                      label="Ciudad"
                      name="city"
                      value={values.city}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={Boolean(touched.city && errors.city)}
                      helperText={touched.city && errors.city ? errors.city : ""}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <MDInput
                      label="Dirección"
                      name="address"
                      value={values.address}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={Boolean(touched.address && errors.address)}
                      helperText={touched.address && errors.address ? errors.address : ""}
                      fullWidth
                    />
                  </Grid>
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

function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("create");
  const [selectedClient, setSelectedClient] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClientToDelete, setSelectedClientToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const initialFormValues = {
    name: selectedClient?.name || "",
    lastname: selectedClient?.lastname || "",
    documentType: selectedClient?.documentType || "",
    documentNumber: selectedClient?.documentNumber || "",
    phoneNumber: selectedClient?.phoneNumber || "",
    address: selectedClient?.address || "",
    city: selectedClient?.city || "",
    email: selectedClient?.email || "",
  };

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/api/client");
      setClients(normalizeClientsResponse(response.data));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "No se pudieron cargar los clientes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
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

  const handleOpenCreate = () => {
    setDialogMode("create");
    setSelectedClient(null);
    setOpenDialog(true);
  };

  const handleOpenEdit = (client) => {
    setDialogMode("edit");
    setSelectedClient(client);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleOpenDeleteDialog = (client) => {
    if (!client?.id) {
      return;
    }

    setSelectedClientToDelete(client);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    if (isDeleting) {
      return;
    }

    setDeleteDialogOpen(false);
    setSelectedClientToDelete(null);
  };

  const handleSubmitClient = async (values, { setSubmitting }) => {
    setError("");
    setSuccessMessage("");

    const payload = {
      name: values.name.trim(),
      lastname: values.lastname.trim(),
      documentType: values.documentType.trim(),
      documentNumber: values.documentNumber.trim(),
      phoneNumber: values.phoneNumber.trim(),
      address: values.address.trim(),
      city: values.city.trim(),
      email: values.email.trim(),
    };

    try {
      if (dialogMode === "edit" && selectedClient?.id) {
        const updateResponse = await api.patch(`/api/client/${selectedClient.id}`, payload);
        const updatedClient = updateResponse.data;
        if (updatedClient && updatedClient.id) {
          setClients((prevClients) =>
            prevClients.map((client) =>
              client.id === updatedClient.id ? { ...client, ...updatedClient } : client
            )
          );
        }
        setSuccessMessage("Cliente actualizado correctamente.");
      } else {
        const createResponse = await api.post("/api/client", payload);
        const createdClient = createResponse.data;
        if (createdClient && createdClient.id) {
          setClients((prevClients) => [createdClient, ...prevClients]);
        }
        setSuccessMessage("Cliente creado correctamente.");
      }

      setOpenDialog(false);
      await fetchClients();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "No fue posible guardar el cliente.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!selectedClientToDelete?.id) {
      return;
    }

    setError("");
    setSuccessMessage("");
    setIsDeleting(true);

    try {
      await api.delete(`/api/client/${selectedClientToDelete.id}`);
      setClients((prevClients) =>
        prevClients.filter((existingClient) => existingClient.id !== selectedClientToDelete.id)
      );
      setSuccessMessage("El cliente se eliminó correctamente.");
      await fetchClients();
      handleCloseDeleteDialog();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "No fue posible eliminar el cliente.");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = useMemo(
    () => [
      { Header: "nombre", accessor: "name", align: "left" },
      { Header: "documento", accessor: "document", align: "left" },
      { Header: "contacto", accessor: "contact", align: "left" },
      { Header: "ciudad", accessor: "city", align: "left" },
      { Header: "acciones", accessor: "actions", align: "center" },
    ],
    []
  );

  const rows = useMemo(
    () =>
      clients.map((client) => ({
        name: (
          <MDBox lineHeight={1}>
            <MDTypography display="block" variant="button" fontWeight="medium">
              {`${client.name || ""} ${client.lastname || ""}`.trim()}
            </MDTypography>
            <MDTypography variant="caption" color="text">
              {client.id}
            </MDTypography>
          </MDBox>
        ),
        document: (
          <MDTypography variant="caption" color="text" fontWeight="medium">
            {`${client.documentType || ""} ${client.documentNumber || ""}`.trim()}
          </MDTypography>
        ),
        contact: (
          <MDBox lineHeight={1}>
            <MDTypography variant="caption" color="text" fontWeight="medium" display="block">
              {client.phoneNumber || "-"}
            </MDTypography>
            <MDTypography variant="caption" color="text">
              {client.email || "-"}
            </MDTypography>
          </MDBox>
        ),
        city: (
          <MDTypography variant="caption" color="text" fontWeight="medium">
            {client.city || "-"}
          </MDTypography>
        ),
        actions: (
          <MDBox display="flex" alignItems="center" justifyContent="center" gap={0.5}>
            <IconButton
              color="info"
              onClick={() => handleOpenEdit(client)}
              aria-label={`Editar cliente ${client.name || ""} ${client.lastname || ""}`}
            >
              <Icon>edit</Icon>
            </IconButton>
            <IconButton
              color="error"
              onClick={() => handleOpenDeleteDialog(client)}
              aria-label={`Eliminar cliente ${client.name || ""} ${client.lastname || ""}`}
            >
              <Icon>delete</Icon>
            </IconButton>
          </MDBox>
        ),
      })),
    [clients]
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
                  Gestión de clientes
                </MDTypography>
                <MDButton variant="gradient" color="dark" onClick={handleOpenCreate}>
                  Nuevo cliente
                </MDButton>
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

      <ClientFormDialog
        open={openDialog}
        mode={dialogMode}
        initialValues={initialFormValues}
        onClose={handleCloseDialog}
        onSubmit={handleSubmitClient}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        title="Eliminar cliente"
        message={`Esta acción eliminará al cliente ${selectedClientToDelete?.name || ""} ${selectedClientToDelete?.lastname || ""}.`}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleDeleteClient}
        loading={isDeleting}
      />

      <Footer />
    </DashboardLayout>
  );
}

ClientFormDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(["create", "edit"]).isRequired,
  initialValues: PropTypes.shape({
    name: PropTypes.string,
    lastname: PropTypes.string,
    documentType: PropTypes.string,
    documentNumber: PropTypes.string,
    phoneNumber: PropTypes.string,
    address: PropTypes.string,
    city: PropTypes.string,
    email: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

DeleteConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
};

export default Clients;
