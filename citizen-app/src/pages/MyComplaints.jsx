import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Visibility } from "@mui/icons-material";
import { fetchMyComplaints } from "../store/complaintsSlice";

const statusColors = {
  SUBMITTED: "info",
  VERIFIED: "primary",
  ASSIGNED: "warning",
  IN_PROGRESS: "warning",
  RESOLVED: "success",
  REJECTED: "error",
};

const severityColors = {
  LOW: "success",
  MEDIUM: "warning",
  HIGH: "error",
  CRITICAL: "error",
};

export default function MyComplaints() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, loading, error } = useSelector((state) => state.complaints);

  useEffect(() => {
    dispatch(fetchMyComplaints());
  }, [dispatch]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Complaints
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      {list.length === 0 ? (
        <Paper sx={{ p: 4, mt: 3, textAlign: "center" }}>
          <Typography variant="h6" color="textSecondary">
            No complaints submitted yet
          </Typography>
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => navigate("/report")}
          >
            Report New Issue
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {list.map((complaint) => (
            <Grid item xs={12} md={6} key={complaint.id}>
              <Card>
                <CardContent>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
                  >
                    <Typography variant="h6" component="div">
                      {complaint.title}
                    </Typography>
                    <Chip
                      label={complaint.status}
                      color={statusColors[complaint.status]}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    {complaint.description.substring(0, 100)}...
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                    <Chip
                      label={complaint.severity}
                      color={severityColors[complaint.severity]}
                      size="small"
                    />
                    <Chip
                      label={complaint.damageType}
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    Complaint #: {complaint.complaintNumber}
                  </Typography>
                  <br />
                  <Typography variant="caption" color="textSecondary">
                    Submitted: {new Date(complaint.createdAt).toLocaleDateString()}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<Visibility />}
                    onClick={() => navigate(`/complaints/${complaint.id}`)}
                  >
                    View Details
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}