import { useEffect, useMemo, useState } from "react";

import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";

import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDInput from "components/MDInput";
import MDTypography from "components/MDTypography";
import MDBadge from "components/MDBadge";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import DataTable from "examples/Tables/DataTable";
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";
import ReportsBarChart from "examples/Charts/BarCharts/ReportsBarChart";

import api from "services/api";

const MONTHS = [
  { value: 1, label: "Enero" },
  { value: 2, label: "Febrero" },
  { value: 3, label: "Marzo" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Mayo" },
  { value: 6, label: "Junio" },
  { value: 7, label: "Julio" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Septiembre" },
  { value: 10, label: "Octubre" },
  { value: 11, label: "Noviembre" },
  { value: 12, label: "Diciembre" },
];

const STATUS_LABELS = {
  0: "Inactivo",
  1: "Activo",
  2: "Entregado",
  3: "Cancelado",
  4: "Retrasado",
  5: "Pendiente",
};

const STATUS_COLORS = {
  0: "dark",
  1: "success",
  2: "info",
  3: "error",
  4: "warning",
  5: "primary",
};

const numberFormatter = new Intl.NumberFormat("es-CO");

const formatCurrency = (value, currency = "COP") =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const parseNumber = (value) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

function ShipmentMetrics() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMetrics = async (selectedYear, selectedMonth) => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/api/shipment/metrics", {
        params: {
          year: selectedYear,
          month: selectedMonth,
        },
      });

      setMetrics(response.data || null);
    } catch (requestError) {
      const message = requestError.response?.data?.message || "No fue posible cargar las metricas.";
      setError(message);
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics(today.getFullYear(), today.getMonth() + 1);
  }, []);

  const handleApplyFilters = () => {
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      setError("El anio debe estar entre 2000 y 2100.");
      return;
    }

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      setError("El mes debe estar entre 1 y 12.");
      return;
    }

    loadMetrics(year, month);
  };

  const byStatusChart = useMemo(() => {
    const statuses = Array.isArray(metrics?.byStatus) ? metrics.byStatus : [];
    const labels = statuses.map(
      ({ statusId }) => STATUS_LABELS[parseNumber(statusId)] || `Estado ${statusId}`
    );
    const data = statuses.map(({ totalAmount }) => parseNumber(totalAmount));

    return {
      labels: labels.length > 0 ? labels : ["Sin datos"],
      datasets: {
        label: "Monto total",
        data: data.length > 0 ? data : [0],
      },
    };
  }, [metrics]);

  const columns = useMemo(
    () => [
      { Header: "estado", accessor: "status", align: "left" },
      { Header: "envios", accessor: "totalShipments", align: "center" },
      { Header: "monto total", accessor: "totalAmount", align: "right" },
    ],
    []
  );

  const rows = useMemo(() => {
    const statuses = Array.isArray(metrics?.byStatus) ? metrics.byStatus : [];

    return statuses.map((item) => {
      const statusId = parseNumber(item.statusId);
      const statusLabel = STATUS_LABELS[statusId] || `Estado ${statusId}`;

      return {
        status: (
          <MDBox ml={-1}>
            <MDBadge
              badgeContent={statusLabel}
              color={STATUS_COLORS[statusId] || "dark"}
              variant="gradient"
              size="sm"
            />
          </MDBox>
        ),
        totalShipments: (
          <MDTypography variant="caption" color="text" fontWeight="medium">
            {numberFormatter.format(parseNumber(item.totalShipments))}
          </MDTypography>
        ),
        totalAmount: (
          <MDTypography variant="caption" color="text" fontWeight="medium">
            {formatCurrency(item.totalAmount, metrics?.currency || "COP")}
          </MDTypography>
        ),
      };
    });
  }, [metrics]);

  const periodLabel = metrics?.period?.label || "Periodo seleccionado";
  const currency = metrics?.currency || "COP";
  const countedStatuses = Array.isArray(metrics?.countedStatuses) ? metrics.countedStatuses : [];
  const countedStatusesLabel =
    countedStatuses
      .map((statusId) => STATUS_LABELS[parseNumber(statusId)] || `Estado ${statusId}`)
      .join(", ") || "N/A";

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
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
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                flexWrap="wrap"
                gap={1}
              >
                <MDTypography variant="h6" color="white">
                  Cuentas de envios
                </MDTypography>
                <MDTypography variant="button" color="white" opacity={0.9}>
                  {periodLabel}
                </MDTypography>
              </MDBox>

              <MDBox p={3}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={4}>
                    <MDInput
                      select
                      fullWidth
                      label="Mes"
                      value={month}
                      onChange={(event) => setMonth(parseNumber(event.target.value))}
                    >
                      {MONTHS.map((monthOption) => (
                        <MenuItem key={monthOption.value} value={monthOption.value}>
                          {monthOption.label}
                        </MenuItem>
                      ))}
                    </MDInput>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <MDInput
                      type="number"
                      fullWidth
                      label="Anio"
                      value={year}
                      inputProps={{ min: 2000, max: 2100 }}
                      onChange={(event) => setYear(parseNumber(event.target.value))}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <MDButton
                      variant="gradient"
                      color="dark"
                      fullWidth
                      onClick={handleApplyFilters}
                    >
                      Aplicar filtro
                    </MDButton>
                  </Grid>
                </Grid>
              </MDBox>
            </Card>
          </Grid>

          {error && (
            <Grid item xs={12}>
              <Alert severity="error">{error}</Alert>
            </Grid>
          )}

          {loading ? (
            <Grid item xs={12}>
              <MDBox display="flex" justifyContent="center" alignItems="center" minHeight="14rem">
                <CircularProgress color="info" />
              </MDBox>
            </Grid>
          ) : (
            <>
              <Grid item xs={12} md={4}>
                <ComplexStatisticsCard
                  color="info"
                  icon="local_shipping"
                  title="Envios del mes"
                  count={numberFormatter.format(parseNumber(metrics?.totalShipments))}
                  percentage={{ color: "success", amount: "", label: periodLabel }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <ComplexStatisticsCard
                  color="success"
                  icon="payments"
                  title={`Total (${currency})`}
                  count={formatCurrency(metrics?.totalAmount, currency)}
                  percentage={{ color: "success", amount: "", label: "valor consolidado" }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <ComplexStatisticsCard
                  color="dark"
                  icon="account_balance_wallet"
                  title="Ticket promedio"
                  count={formatCurrency(metrics?.averageTicket, currency)}
                  percentage={{ color: "success", amount: "", label: "por envio" }}
                />
              </Grid>

              <Grid item xs={12} lg={6}>
                <ReportsBarChart
                  color="dark"
                  title="Monto por estado"
                  description={`Estados facturables: ${countedStatusesLabel}`}
                  date="actualizado al consultar"
                  chart={byStatusChart}
                />
              </Grid>

              <Grid item xs={12} lg={6}>
                <Card>
                  <MDBox p={2}>
                    <MDTypography variant="h6">Detalle por estado</MDTypography>
                  </MDBox>
                  <DataTable
                    table={{ columns, rows }}
                    isSorted={false}
                    entriesPerPage={false}
                    showTotalEntries={false}
                    canSearch={false}
                    noEndBorder
                  />
                </Card>
              </Grid>
            </>
          )}
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default ShipmentMetrics;
