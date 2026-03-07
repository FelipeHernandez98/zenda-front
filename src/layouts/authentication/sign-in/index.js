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

import { useEffect, useState } from "react";
import { Formik } from "formik";
import * as Yup from "yup";

// react-router-dom components
import { useNavigate } from "react-router-dom";

// @mui material components
import Card from "@mui/material/Card";
import Switch from "@mui/material/Switch";
import Alert from "@mui/material/Alert";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";

// Authentication layout components
import BasicLayout from "layouts/authentication/components/BasicLayout";

// Context
import { useAuth } from "context/AuthContext";

// Images
import bgImage from "assets/images/bg-sign-in-basic.png";
import zendaLogo from "assets/images/zenda-logo.png";

function Basic() {
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");

  const { login, token, checkAuthStatus } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const validateSessionAndRedirect = async () => {
      if (!token) {
        return;
      }

      const isSessionValid = await checkAuthStatus();

      if (isMounted && isSessionValid) {
        navigate("/dashboard", { replace: true });
      }
    };

    validateSessionAndRedirect();

    return () => {
      isMounted = false;
    };
  }, [token, navigate]);

  const handleSetRememberMe = () => setRememberMe(!rememberMe);

  const validationSchema = Yup.object({
    username: Yup.string().trim().required("El usuario es obligatorio"),
    password: Yup.string()
      .required("La contraseña es obligatoria")
      .min(8, "La contraseña debe tener al menos 8 caracteres"),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    setError("");

    const result = await login(values.username.trim(), values.password);

    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.error || "Error al iniciar sesión");
    }

    setSubmitting(false);
  };

  return (
    <BasicLayout image={bgImage} showNavbar={false} showFooter={false}>
      <Card>
        <MDBox
          variant="gradient"
          bgColor="info"
          borderRadius="lg"
          coloredShadow="info"
          mx={2}
          mt={-3}
          p={2}
          mb={1}
          textAlign="center"
        >
          <MDBox component="img" src={zendaLogo} alt="Zenda" width="10rem" mx="auto" mb={1} />
          <MDTypography variant="h4" fontWeight="medium" color="white" mt={1}>
            Sign in
          </MDTypography>
        </MDBox>
        <MDBox pt={4} pb={3} px={3}>
          <Formik
            initialValues={{ username: "", password: "" }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({
              values,
              errors,
              touched,
              handleChange,
              handleBlur,
              handleSubmit: submitForm,
              isSubmitting,
            }) => (
              <MDBox component="form" role="form" onSubmit={submitForm}>
                {error && (
                  <MDBox mb={2}>
                    <Alert severity="error">{error}</Alert>
                  </MDBox>
                )}
                <MDBox mb={2}>
                  <MDInput
                    type="text"
                    label="Username"
                    name="username"
                    fullWidth
                    value={values.username}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.username && errors.username)}
                    helperText={touched.username && errors.username ? errors.username : ""}
                  />
                </MDBox>
                <MDBox mb={2}>
                  <MDInput
                    type="password"
                    label="Password"
                    name="password"
                    fullWidth
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.password && errors.password)}
                    helperText={touched.password && errors.password ? errors.password : ""}
                  />
                </MDBox>
                <MDBox display="flex" alignItems="center" ml={-1}>
                  <Switch checked={rememberMe} onChange={handleSetRememberMe} />
                  <MDTypography
                    variant="button"
                    fontWeight="regular"
                    color="text"
                    onClick={handleSetRememberMe}
                    sx={{ cursor: "pointer", userSelect: "none", ml: -1 }}
                  >
                    &nbsp;&nbsp;Remember me
                  </MDTypography>
                </MDBox>
                <MDBox mt={4} mb={1}>
                  <MDButton
                    variant="gradient"
                    color="info"
                    fullWidth
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Signing in..." : "sign in"}
                  </MDButton>
                </MDBox>
              </MDBox>
            )}
          </Formik>
        </MDBox>
      </Card>
    </BasicLayout>
  );
}

export default Basic;
