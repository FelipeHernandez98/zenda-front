import { useEffect, useMemo, useState } from "react";
import { Formik } from "formik";
import * as Yup from "yup";

import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import api from "services/api";
import { useAuth } from "context/AuthContext";

const decodeTokenPayload = (token) => {
  if (!token) {
    return null;
  }

  try {
    const tokenParts = token.split(".");
    if (tokenParts.length < 2) {
      return null;
    }

    const payloadBase64 = tokenParts[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payloadBase64));
  } catch (_error) {
    return null;
  }
};

const getUserIdFromToken = (token) => {
  const payload = decodeTokenPayload(token);
  const possibleId = payload?.id ?? payload?.userId ?? payload?.sub ?? payload?.user?.id ?? null;

  if (typeof possibleId === "string" && possibleId.trim()) {
    return possibleId.trim();
  }

  return null;
};

const formatDateTime = (dateValue) => {
  if (!dateValue) {
    return "-";
  }

  const parsedDate = new Date(dateValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return parsedDate.toLocaleString();
};

const passwordSchema = Yup.object({
  password: Yup.string()
    .required("La contraseña es obligatoria")
    .min(8, "Mínimo 8 caracteres")
    .max(20, "Máximo 20 caracteres"),
  confirmPassword: Yup.string()
    .required("Confirma la contraseña")
    .oneOf([Yup.ref("password")], "Las contraseñas no coinciden"),
});

const ROLE_LABELS = {
  0: "Administrador",
  1: "Usuario",
};

const STATUS_LABELS = {
  0: "Inactivo",
  1: "Activo",
  2: "Entregado",
  3: "Cancelado",
  4: "Retrasado",
  5: "Pendiente",
};

const getRoleLabel = (roleId) => {
  const parsedRoleId = Number(roleId);

  if (Number.isNaN(parsedRoleId)) {
    return "Sin rol";
  }

  return ROLE_LABELS[parsedRoleId] || "Sin rol";
};

const getStatusLabel = (stateId) => {
  const parsedStateId = Number(stateId);

  if (Number.isNaN(parsedStateId)) {
    return "Sin estado";
  }

  return STATUS_LABELS[parsedStateId] || "Sin estado";
};

function Profile() {
  const { token, user: authUser, checkAuthStatus } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const userId = useMemo(() => {
    return getUserIdFromToken(token) || authUser?.id || "";
  }, [token, authUser]);

  const fetchProfile = async () => {
    if (!userId) {
      setLoading(false);
      setError("No fue posible identificar el usuario desde el token.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await api.get(`/api/user/id/${userId}`);
      setProfile(response.data || null);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "No fue posible cargar el perfil.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [userId]);

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

  const handlePasswordSubmit = async (values, { setSubmitting, resetForm }) => {
    if (!userId) {
      setError("No fue posible identificar el usuario para actualizar la contraseña.");
      setSubmitting(false);
      return;
    }

    try {
      setError("");
      setSuccessMessage("");

      await api.patch(`/api/user/${userId}`, {
        password: values.password,
      });

      setSuccessMessage("Contraseña actualizada correctamente.");
      resetForm();
      await Promise.resolve(checkAuthStatus?.());
      await fetchProfile();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "No fue posible actualizar la contraseña.");
    } finally {
      setSubmitting(false);
    }
  };

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

          <Grid item xs={12} lg={7}>
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
              >
                <MDTypography variant="h6" color="white">
                  Perfil de usuario
                </MDTypography>
              </MDBox>

              <MDBox p={3}>
                {loading ? (
                  <MDBox display="flex" justifyContent="center" alignItems="center" py={6}>
                    <CircularProgress color="info" />
                  </MDBox>
                ) : (
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <MDTypography variant="caption" color="text" display="block">
                        ID
                      </MDTypography>
                      <MDTypography variant="button" color="dark" fontWeight="medium">
                        {profile?.id || "-"}
                      </MDTypography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <MDTypography variant="caption" color="text" display="block">
                        Username
                      </MDTypography>
                      <MDTypography variant="button" color="dark" fontWeight="medium">
                        {profile?.username || "-"}
                      </MDTypography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <MDTypography variant="caption" color="text" display="block">
                        Nombre
                      </MDTypography>
                      <MDTypography variant="button" color="dark" fontWeight="medium">
                        {profile?.name || "-"}
                      </MDTypography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <MDTypography variant="caption" color="text" display="block">
                        Apellido
                      </MDTypography>
                      <MDTypography variant="button" color="dark" fontWeight="medium">
                        {profile?.lastname || "-"}
                      </MDTypography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <MDTypography variant="caption" color="text" display="block">
                        Teléfono
                      </MDTypography>
                      <MDTypography variant="button" color="dark" fontWeight="medium">
                        {profile?.phoneNumber || "-"}
                      </MDTypography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <MDTypography variant="caption" color="text" display="block">
                        Estado (stateId)
                      </MDTypography>
                      <MDTypography variant="button" color="dark" fontWeight="medium">
                        {getStatusLabel(profile?.stateId)}
                      </MDTypography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <MDTypography variant="caption" color="text" display="block">
                        Rol (roleId)
                      </MDTypography>
                      <MDTypography variant="button" color="dark" fontWeight="medium">
                        {getRoleLabel(profile?.roleId)}
                      </MDTypography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <MDTypography variant="caption" color="text" display="block">
                        Fecha creación
                      </MDTypography>
                      <MDTypography variant="button" color="dark" fontWeight="medium">
                        {formatDateTime(profile?.createdAt)}
                      </MDTypography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <MDTypography variant="caption" color="text" display="block">
                        Última actualización
                      </MDTypography>
                      <MDTypography variant="button" color="dark" fontWeight="medium">
                        {formatDateTime(profile?.updatedAt)}
                      </MDTypography>
                    </Grid>
                  </Grid>
                )}
              </MDBox>
            </Card>
          </Grid>

          <Grid item xs={12} lg={5}>
            <Card>
              <MDBox
                mx={2}
                mt={-3}
                py={2}
                px={2}
                variant="gradient"
                bgColor="dark"
                borderRadius="lg"
                coloredShadow="dark"
              >
                <MDTypography variant="h6" color="white">
                  Cambiar contraseña
                </MDTypography>
              </MDBox>

              <MDBox p={3}>
                <Formik
                  initialValues={{ password: "", confirmPassword: "" }}
                  validationSchema={passwordSchema}
                  onSubmit={handlePasswordSubmit}
                >
                  {({
                    values,
                    errors,
                    touched,
                    handleChange,
                    handleBlur,
                    handleSubmit,
                    isSubmitting,
                  }) => (
                    <MDBox component="form" onSubmit={handleSubmit}>
                      <MDBox mb={2}>
                        <MDInput
                          type="password"
                          label="Nueva contraseña"
                          name="password"
                          value={values.password}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={Boolean(touched.password && errors.password)}
                          helperText={touched.password && errors.password ? errors.password : ""}
                          fullWidth
                        />
                      </MDBox>

                      <MDBox mb={2}>
                        <MDInput
                          type="password"
                          label="Confirmar contraseña"
                          name="confirmPassword"
                          value={values.confirmPassword}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={Boolean(touched.confirmPassword && errors.confirmPassword)}
                          helperText={
                            touched.confirmPassword && errors.confirmPassword
                              ? errors.confirmPassword
                              : ""
                          }
                          fullWidth
                        />
                      </MDBox>

                      <MDButton
                        variant="gradient"
                        color="info"
                        type="submit"
                        disabled={isSubmitting || !userId}
                        fullWidth
                      >
                        {isSubmitting ? "Actualizando..." : "Actualizar contraseña"}
                      </MDButton>
                    </MDBox>
                  )}
                </Formik>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Profile;
