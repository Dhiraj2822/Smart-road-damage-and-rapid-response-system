import { useState, useEffect } from "react";
import { Box, Grid, Paper, Typography, CircularProgress } from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import axios from "axios";

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: "Bearer " + token };

        const [statsRes, trendsRes] = await Promise.all([
          axios.get("http://localhost:3000/api/dashboard/stats", { headers }),
          axios.get("http://localhost:3000/api/dashboard/trends", { headers }),
        ]);

        setStats(statsRes.data.stats);
        setTrends(trendsRes.data.trends);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!stats) return <Typography>No data available</Typography>;

  const statusData = [
    { name: "Submitted", value: stats.byStatus.submitted },
    { name: "Verified", value: stats.byStatus.verified },
    { name: "Assigned", value: stats.byStatus.assigned },
    { name: "In Progress", value: stats.byStatus.inProgress },
    { name: "Resolved", value: stats.byStatus.resolved },
  ];

  const severityData = [
    { name: "Critical", value: stats.bySeverity.critical },
    { name: "High", value: stats.bySeverity.high },
    { name: "Medium", value: stats.total - stats.bySeverity.critical - stats.bySeverity.high },
  ];

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];
  const SEVERITY_COLORS = ["#d32f2f", "#f57c00", "#fbc02d"];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Analytics Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#e3f2fd" }}>
            <Typography variant="h6">Total Complaints</Typography>
            <Typography variant="h3" color="primary">
              {stats.total}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#fff3e0" }}>
            <Typography variant="h6">Pending</Typography>
            <Typography variant="h3" color="warning.main">
              {stats.byStatus.submitted + stats.byStatus.verified + stats.byStatus.assigned}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#e8f5e9" }}>
            <Typography variant="h6">Resolved</Typography>
            <Typography variant="h3" color="success.main">
              {stats.byStatus.resolved}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#ffebee" }}>
            <Typography variant="h6">Critical Issues</Typography>
            <Typography variant="h3" color="error">
              {stats.bySeverity.critical}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Status Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 350 }}>
            <Typography variant="h6" gutterBottom>
              Complaints by Status
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Severity Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 350 }}>
            <Typography variant="h6" gutterBottom>
              Severity Distribution
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {severityData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={SEVERITY_COLORS[index % SEVERITY_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Trends Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, height: 350 }}>
            <Typography variant="h6" gutterBottom>
              Daily Complaint Trends (Last 7 Days)
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#8884d8"
                  name="New Complaints"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
