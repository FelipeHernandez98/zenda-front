/* eslint-disable react/prop-types */
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

const createValidationSchema = Yup.object({
  name: Yup.string().trim().required("El nombre es obligatorio"),
  lastname: Yup.string().trim().required("El apellido es obligatorio"),
  username: Yup.string().trim().required("El usuario es obligatorio"),
  phoneNumber: Yup.string().trim().required("El teléfono es obligatorio"),
  password: Yup.string()
    .required("La contraseña es obligatoria")
    .min(8, "La contraseña debe tener al menos 8 caracteres"),
});

const editValidationSchema = Yup.object({
  name: Yup.string().trim().required("El nombre es obligatorio"),
  lastname: Yup.string().trim().required("El apellido es obligatorio"),
  username: Yup.string().trim().required("El usuario es obligatorio"),
  phoneNumber: Yup.string().trim().required("El teléfono es obligatorio"),
  password: Yup.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
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

function UserFormDialog({ open, mode, initialValues, onClose, onSubmit }) {
  const isEdit = mode === "edit";

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        <MDBox display="flex" alignItems="center" gap={1}>
          <Icon color="info">manage_accounts</Icon>
          <MDBox>
            <MDTypography variant="h6" fontWeight="medium">
              {isEdit ? "Actualizar usuario" : "Registrar usuario"}
            </MDTypography>
            <MDTypography variant="button" color="text">
              Completa la información básica, acceso y contacto.
            </MDTypography>
          </MDBox>
        </MDBox>
      </DialogTitle>
      <Formik
        initialValues={initialValues}
        validationSchema={isEdit ? editValidationSchema : createValidationSchema}
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
                  Datos personales
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
                </Grid>

                <Divider sx={{ my: 2 }} />

                <MDTypography
                  variant="button"
                  fontWeight="bold"
                  color="info"
                  textTransform="uppercase"
                >
                  Acceso y seguridad
                </MDTypography>
                <Grid container spacing={2} mt={0.5}>
                  <Grid item xs={12} md={6}>
                    <MDInput
                      label="Username"
                      name="username"
                      value={values.username}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={Boolean(touched.username && errors.username)}
                      helperText={touched.username && errors.username ? errors.username : ""}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <MDInput
                      label={isEdit ? "Nueva contraseña (opcional)" : "Contraseña"}
                      name="password"
                      type="password"
                      value={values.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={Boolean(touched.password && errors.password)}
                      helperText={
                        touched.password && errors.password
                          ? errors.password
                          : isEdit
                            ? "Déjalo vacío para conservar la contraseña actual"
                            : "Mínimo 8 caracteres"
                      }
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

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("create");
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUserToDelete, setSelectedUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const initialFormValues = {
    name: selectedUser?.name || "",
    lastname: selectedUser?.lastname || "",
    username: selectedUser?.username || "",
    phoneNumber: selectedUser?.phoneNumber || "",
    password: "",
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/api/user");
      setUsers(normalizeUsersResponse(response.data));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "No se pudieron cargar los usuarios.");
    } finally {
      setLoading(false);
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

  const handleOpenCreate = () => {
    setDialogMode("create");
    setSelectedUser(null);
    setOpenDialog(true);
  };

  const handleOpenEdit = (user) => {
    setDialogMode("edit");
    setSelectedUser(user);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleOpenDeleteDialog = (user) => {
    if (!user?.id) {
      return;
    }

    setSelectedUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    if (isDeleting) {
      return;
    }

    setDeleteDialogOpen(false);
    setSelectedUserToDelete(null);
  };

  const handleSubmitUser = async (values, { setSubmitting }) => {
    setError("");
    setSuccessMessage("");

    const payload = {
      name: values.name.trim(),
      lastname: values.lastname.trim(),
      username: values.username.trim(),
      phoneNumber: values.phoneNumber.trim(),
    };

    if (values.password.trim()) {
      payload.password = values.password.trim();
    }

    try {
      if (dialogMode === "edit" && selectedUser?.id) {
        const updateResponse = await api.patch(`/api/user/${selectedUser.id}`, payload);
        const updatedUser = updateResponse.data;
        if (updatedUser && updatedUser.id) {
          setUsers((prevUsers) =>
            prevUsers.map((user) =>
              user.id === updatedUser.id ? { ...user, ...updatedUser } : user
            )
          );
        }
        setSuccessMessage("Usuario actualizado correctamente.");
      } else {
        const createResponse = await api.post("/api/user", payload);
        const createdUser = createResponse.data;
        if (createdUser && createdUser.id) {
          setUsers((prevUsers) => [createdUser, ...prevUsers]);
        }
        setSuccessMessage("Usuario creado correctamente.");
      }

      setOpenDialog(false);
      await fetchUsers();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "No fue posible guardar el usuario.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUserToDelete?.id) {
      return;
    }

    setError("");
    setSuccessMessage("");
    setIsDeleting(true);

    try {
      await api.delete(`/api/user/${selectedUserToDelete.id}`);
      setUsers((prevUsers) =>
        prevUsers.filter((existingUser) => existingUser.id !== selectedUserToDelete.id)
      );
      setSuccessMessage("El usuario se eliminó correctamente.");
      await fetchUsers();
      handleCloseDeleteDialog();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "No fue posible eliminar el usuario.");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        Header: "nombre",
        accessor: "name",
        align: "left",
        Cell: ({ row }) => (
          <MDBox lineHeight={1}>
            <MDTypography display="block" variant="button" fontWeight="medium">
              {`${row.original.raw.name || ""} ${row.original.raw.lastname || ""}`.trim()}
            </MDTypography>
            <MDTypography variant="caption" color="text">
              {row.original.raw.id}
            </MDTypography>
          </MDBox>
        ),
      },
      {
        Header: "usuario",
        accessor: "username",
        align: "left",
        Cell: ({ row }) => (
          <MDTypography variant="caption" color="text" fontWeight="medium">
            {row.original.raw.username || "-"}
          </MDTypography>
        ),
      },
      {
        Header: "teléfono",
        accessor: "phoneNumber",
        align: "left",
        Cell: ({ row }) => (
          <MDTypography variant="caption" color="text" fontWeight="medium">
            {row.original.raw.phoneNumber || "-"}
          </MDTypography>
        ),
      },
      {
        Header: "estado",
        accessor: "state",
        align: "center",
        Cell: ({ row }) => (
          <MDBox ml={-1}>
            <MDBadge
              badgeContent={Number(row.original.raw.stateId) === 1 ? "activo" : "inactivo"}
              color={Number(row.original.raw.stateId) === 1 ? "success" : "dark"}
              variant="gradient"
              size="sm"
            />
          </MDBox>
        ),
      },
      {
        Header: "acciones",
        accessor: "actions",
        align: "center",
        disableSortBy: true,
        Cell: ({ row }) => (
          <MDBox display="flex" alignItems="center" justifyContent="center" gap={0.5}>
            <IconButton
              color="info"
              onClick={() => handleOpenEdit(row.original.raw)}
              aria-label={`Editar usuario ${row.original.raw.username || ""}`}
            >
              <Icon>edit</Icon>
            </IconButton>
            <IconButton
              color="error"
              onClick={() => handleOpenDeleteDialog(row.original.raw)}
              aria-label={`Eliminar usuario ${row.original.raw.username || ""}`}
            >
              <Icon>delete</Icon>
            </IconButton>
          </MDBox>
        ),
      },
    ],
    []
  );

  const rows = useMemo(
    () =>
      users.map((user) => ({
        raw: user,
        name: `${user.name || ""} ${user.lastname || ""} ${user.id || ""}`.trim(),
        username: user.username || "",
        phoneNumber: user.phoneNumber || "",
        state: Number(user.stateId) === 1 ? "activo" : "inactivo",
        actions: "",
      })),
    [users]
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
                  Gestión de usuarios
                </MDTypography>
                <MDButton variant="gradient" color="dark" onClick={handleOpenCreate}>
                  Nuevo usuario
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

      <UserFormDialog
        open={openDialog}
        mode={dialogMode}
        initialValues={initialFormValues}
        onClose={handleCloseDialog}
        onSubmit={handleSubmitUser}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        title="Eliminar usuario"
        message={`Esta acción eliminará al usuario ${selectedUserToDelete?.username || ""}.`}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleDeleteUser}
        loading={isDeleting}
      />

      <Footer />
    </DashboardLayout>
  );
}

UserFormDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(["create", "edit"]).isRequired,
  initialValues: PropTypes.shape({
    name: PropTypes.string,
    lastname: PropTypes.string,
    username: PropTypes.string,
    phoneNumber: PropTypes.string,
    password: PropTypes.string,
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

export default Users;
