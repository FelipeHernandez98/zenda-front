import React from "react";
import { Navigate } from "react-router-dom";
import PropTypes from "prop-types";
import CircularProgress from "@mui/material/CircularProgress";
import MDBox from "components/MDBox";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { token, loading, roleId } = useAuth();

  if (loading) {
    return (
      <MDBox display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
        <CircularProgress color="info" />
      </MDBox>
    );
  }

  if (!token) {
    return <Navigate to="/authentication/sign-in" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(roleId)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.arrayOf(PropTypes.number),
};

ProtectedRoute.defaultProps = {
  allowedRoles: undefined,
};

export default ProtectedRoute;
