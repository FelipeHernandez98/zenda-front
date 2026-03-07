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

import { useEffect, useMemo, useState } from "react";

// @mui material components
import Grid from "@mui/material/Grid";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import ReportsBarChart from "examples/Charts/BarCharts/ReportsBarChart";
import ReportsLineChart from "examples/Charts/LineCharts/ReportsLineChart";
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";

// Services
import api from "services/api";
import { useAuth } from "context/AuthContext";

const LOCATION_LABELS = {
  0: "Bodega Cúcuta",
  1: "Viajando Bucaramanga",
  2: "Bodega Bucaramanga",
  3: "Viajando Bogotá",
  4: "Bodega Bogotá",
};

const STATUS_LABELS = {
  0: "Inactivo",
  1: "Activo",
  2: "Entregado",
  3: "Cancelado",
  4: "Retrasado",
  5: "Pendiente",
};

function Dashboard() {
  const { roleId } = useAuth();
  const isAdmin = roleId === 0;
  const [stats, setStats] = useState({ users: 0, clients: 0, shipments: 0, delivered: 0 });
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError("");

        const baseRequests = [api.get("/api/client"), api.get("/api/shipment")];
        const requests = isAdmin ? [api.get("/api/user"), ...baseRequests] : baseRequests;
        const responses = await Promise.all(requests);

        const usersData = isAdmin && Array.isArray(responses[0]?.data) ? responses[0].data : [];
        const clientsResponse = responses[isAdmin ? 1 : 0];
        const shipmentsResponse = responses[isAdmin ? 2 : 1];
        const clientsData = Array.isArray(clientsResponse.data) ? clientsResponse.data : [];
        const shipmentsData = Array.isArray(shipmentsResponse.data) ? shipmentsResponse.data : [];

        setShipments(shipmentsData);
        setStats({
          users: isAdmin ? usersData.length : 0,
          clients: clientsData.length,
          shipments: shipmentsData.length,
          delivered: shipmentsData.filter((shipment) => Number(shipment.statusId) === 2).length,
        });
      } catch (fetchError) {
        setError(fetchError.response?.data?.message || "No fue posible cargar las métricas.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAdmin]);

  const shipmentsByStatusChart = useMemo(() => {
    const counts = shipments.reduce((accumulator, shipment) => {
      const statusId = Number(shipment.statusId ?? 0);
      const key = Number.isNaN(statusId) ? 0 : statusId;
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {});

    const sortedKeys = Object.keys(counts)
      .map((value) => Number(value))
      .sort((a, b) => a - b);

    const labels = sortedKeys.map((statusId) => STATUS_LABELS[statusId] || `Estado ${statusId}`);
    const data = sortedKeys.map((statusId) => counts[statusId]);

    return {
      labels: labels.length > 0 ? labels : ["Sin datos"],
      datasets: {
        label: "Envíos",
        data: data.length > 0 ? data : [0],
      },
    };
  }, [shipments]);

  const shipmentsByLocationChart = useMemo(() => {
    const counts = shipments.reduce((accumulator, shipment) => {
      const locationId = Number(shipment.locationId ?? 0);
      const key = Number.isNaN(locationId) ? 0 : locationId;
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {});

    const sortedKeys = Object.keys(counts)
      .map((value) => Number(value))
      .sort((a, b) => a - b)
      .slice(0, 8);

    const labels = sortedKeys.map(
      (locationId) => LOCATION_LABELS[locationId] || `Ubicación ${locationId}`
    );
    const data = sortedKeys.map((locationId) => counts[locationId]);

    return {
      labels: labels.length > 0 ? labels : ["Sin datos"],
      datasets: {
        label: "Envíos",
        data: data.length > 0 ? data : [0],
      },
    };
  }, [shipments]);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        {loading && (
          <MDBox display="flex" justifyContent="center" alignItems="center" minHeight="15rem">
            <CircularProgress color="info" />
          </MDBox>
        )}
        {error && (
          <MDBox mb={3}>
            <Alert severity="error">{error}</Alert>
          </MDBox>
        )}
        <Grid container spacing={3}>
          {isAdmin && (
            <Grid item xs={12} md={6} lg={3}>
              <MDBox mb={1.5}>
                <ComplexStatisticsCard
                  color="dark"
                  icon="groups"
                  title="Usuarios"
                  count={stats.users}
                  percentage={{
                    color: "success",
                    amount: "",
                    label: "registrados",
                  }}
                />
              </MDBox>
            </Grid>
          )}
          <Grid item xs={12} md={6} lg={isAdmin ? 3 : 4}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                icon="badge"
                title="Clientes"
                count={stats.clients}
                percentage={{
                  color: "success",
                  amount: "",
                  label: "registrados",
                }}
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={isAdmin ? 3 : 4}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="success"
                icon="local_shipping"
                title="Envíos"
                count={stats.shipments}
                percentage={{
                  color: "success",
                  amount: "",
                  label: "totales",
                }}
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={isAdmin ? 3 : 4}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="primary"
                icon="inventory_2"
                title="Entregados"
                count={stats.delivered}
                percentage={{
                  color: "success",
                  amount: "",
                  label: "entregados",
                }}
              />
            </MDBox>
          </Grid>
        </Grid>
        <MDBox mt={4.5}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6} lg={6}>
              <MDBox mb={3}>
                <ReportsBarChart
                  color="info"
                  title="envíos por estado"
                  description="Grafica de los envios por estado"
                  date="actualizado al cargar"
                  chart={shipmentsByStatusChart}
                />
              </MDBox>
            </Grid>
            <Grid item xs={12} md={6} lg={6}>
              <MDBox mb={3}>
                <ReportsLineChart
                  color="success"
                  title="envíos por ubicación"
                  description="Grafica de los envios por ubicación"
                  date="actualizado al cargar"
                  chart={shipmentsByLocationChart}
                />
              </MDBox>
            </Grid>
          </Grid>
        </MDBox>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Dashboard;
