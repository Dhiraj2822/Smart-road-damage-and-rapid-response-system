import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  Chip,
  Card,
  CardMedia,
  CircularProgress,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  CheckCircleOutline,
  CancelOutlined,
  CameraAlt,
  PhotoCamera,
} from "@mui/icons-material";

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [openComplete, setOpenComplete] = useState(false);
  const [openReject, setOpenReject] = useState(false);
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState("");

  const fetchJob = async () => {
    try {
      const res = await api.get("/contractors/my-orders");
      const found = res.data.workOrders.find((j) => j.id === id || j._id === id);
      if (found) setJob(found);
      else navigate("/dashboard");
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchJob();
  }, [id]);

  const handleAccept = async () => {
    try {
      await api.post(`/contractors/orders/${id}/accept`);
      fetchJob();
    } catch (err) {
      setError(err.response?.data?.error || "Action failed");
    }
  };

  const handleReject = async () => {
    try {
      await api.post(`/contractors/orders/${id}/reject`, {
        reason: rejectReason,
      });
      setOpenReject(false);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Action failed");
    }
  };

  const handleComplete = async () => {
    try {
      if (!proofFile) {
        alert("Please capture or upload a proof photo first.");
        return;
      }
      const formData = new FormData();
      formData.append("finalCost", cost);
      formData.append("completionNotes", notes);
      formData.append("proofImage", proofFile);
      await api.post(`/contractors/orders/${id}/complete`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setOpenComplete(false);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Action failed");
    }
  };

  const getImgUrl = (path) => {
    if (!path) return "";
    return path.startsWith("http") ? path : `http://localhost:3000${path}`;
  };

  if (!job)
    return (
      <Container sx={{ mt: 10, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading Work Order...</Typography>
      </Container>
    );

  const allImages = job.complaint?.images || [];
  // isProof may not exist if DB migration pending — use originalName as fallback
  const isProofImg = (img) =>
    img.isProof === true || img.originalName === "Proof of Repairs";
  const beforeImages = allImages.filter((img) => !isProofImg(img));
  const proofImages = allImages.filter((img) => isProofImg(img));
  // Also check proofImageUrl directly on the workOrder object
  const hasProof = proofImages.length > 0 || !!job.proofImageUrl;

  return (
    <Container sx={{ mt: 4, mb: 6 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/dashboard")}
        sx={{ mb: 2 }}
      >
        Back
      </Button>

      <Paper sx={{ p: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h5" fontWeight="bold">
            {job.orderNumber}
          </Typography>
          <Chip
            label={job.status.replace("_", " ")}
            color={
              job.status === "ASSIGNED"
                ? "warning"
                : job.status === "IN_PROGRESS"
                ? "info"
                : job.status === "COMPLETED"
                ? "success"
                : "default"
            }
          />
        </Box>

        <Typography variant="body1" sx={{ mb: 2 }}>
          {job.description}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Rejection Alert */}
        {job.status === "IN_PROGRESS" && job.rejectionReason && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="subtitle2">
              Admin Feedback / Rejection Reason:
            </Typography>
            <Typography variant="body2">{job.rejectionReason}</Typography>
          </Alert>
        )}

        {/* Job Specs */}
        <Box sx={{ bgcolor: "#f5f5f5", p: 2, borderRadius: 2, mb: 3 }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Job Details
          </Typography>
          <Typography variant="body2">
            {" "}
            Location: {job.complaint?.address || "See description"}
          </Typography>
          <Typography variant="body2">
            {" "}
            Due Date:{" "}
            {job.dueDate ? new Date(job.dueDate).toLocaleDateString() : "-"}
          </Typography>
          <Typography variant="body2">
            {" "}
            Govt. Estimated Budget: ₹
            {job.estimatedCost?.toLocaleString() || "-"}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            (This is the government's budgeted amount. Submit your actual cost
            when you complete the job.)
          </Typography>
        </Box>

        {/* Before Images (Citizen's original damage photos) */}
        {beforeImages.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              {" "}
              Damage Evidence (Before Repair)
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {beforeImages.map((img, i) => (
                <Card key={i} sx={{ width: 200 }}>
                  <CardMedia
                    component="img"
                    height="140"
                    image={getImgUrl(img.imageUrl)}
                    alt={`Damage ${i + 1}`}
                    onError={(e) => {
                      e.target.src =
                        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
                    }}
                    sx={{ cursor: "pointer" }}
                    onClick={() => window.open(getImgUrl(img.imageUrl), "_blank")}
                  />
                </Card>
              ))}
            </Box>
          </Box>
        )}

        {/* After-Repair Proof section */}
        {proofImages.length > 0 && (
          <Box sx={{ mb: 3, p: 2, bgcolor: "#e8f5e9", borderRadius: 2 }}>
            <Typography
              variant="subtitle2"
              fontWeight="bold"
              sx={{ mb: 1, color: "success.dark" }}
            >
              {" "}
              After-Repair Proof (Your Submission)
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {proofImages.map((img, i) => (
                <Card key={i} sx={{ width: 200 }}>
                  <CardMedia
                    component="img"
                    height="140"
                    image={getImgUrl(img.imageUrl)}
                    alt={`Proof ${i + 1}`}
                    onError={(e) => {
                      e.target.src =
                        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
                    }}
                    sx={{ cursor: "pointer" }}
                    onClick={() => window.open(getImgUrl(img.imageUrl), "_blank")}
                  />
                </Card>
              ))}
            </Box>
          </Box>
        )}

        {/* Show proofImageUrl from workOrder if not in images array */}
        {proofImages.length === 0 && job.proofImageUrl && (
          <Box sx={{ mb: 3, p: 2, bgcolor: "#e8f5e9", borderRadius: 2 }}>
            <Typography
              variant="subtitle2"
              fontWeight="bold"
              sx={{ mb: 1, color: "success.dark" }}
            >
              {" "}
              After-Repair Proof (Your Submission)
            </Typography>
            <Card sx={{ width: 200 }}>
              <CardMedia
                component="img"
                height="140"
                image={getImgUrl(job.proofImageUrl)}
                alt="Proof"
                sx={{ cursor: "pointer" }}
                onClick={() => window.open(getImgUrl(job.proofImageUrl), "_blank")}
              />
            </Card>
          </Box>
        )}

        <Divider sx={{ mb: 3 }} />

        {/* Action Buttons */}
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          {job.status === "ASSIGNED" && (
            <>
              <Button
                variant="contained"
                color="primary"
                startIcon={<CheckCircleOutline />}
                onClick={handleAccept}
              >
                Accept & Start Job
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelOutlined />}
                onClick={() => setOpenReject(true)}
              >
                Reject Assignment
              </Button>
            </>
          )}
          {job.status === "IN_PROGRESS" && (
            <Button
              variant="contained"
              color="success"
              startIcon={<CameraAlt />}
              onClick={() => setOpenComplete(true)}
            >
              Submit Proof of Completion
            </Button>
          )}
          {job.status === "COMPLETED" && (
            <Alert severity="info" sx={{ width: "100%" }}>
              Work submitted. Waiting for Municipal Official to review and
              approve.
            </Alert>
          )}
        </Box>
      </Paper>

      {/* Complete Dialog */}
      <Dialog
        open={openComplete}
        onClose={() => setOpenComplete(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Submit Work Completion Proof</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Take a clear photo of the repaired road. The official will compare
            this with the damage photo before approving.
          </Typography>

          {/* Camera / File Upload */}
          <Box
            sx={{
              textAlign: "center",
              p: 2,
              border: "2px dashed #ccc",
              borderRadius: 2,
              mb: 2,
            }}
          >
            <input
              type="file"
              accept="image/*"
              capture="environment"
              id="proof-upload"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setProofFile(file);
                  setImageUrl(URL.createObjectURL(file));
                }
              }}
            />
            <label htmlFor="proof-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<PhotoCamera />}
              >
                {imageUrl ? "Retake Photo" : "Take / Upload Photo"}
              </Button>
            </label>
            {imageUrl && (
              <Box sx={{ mt: 2 }}>
                <img
                  src={imageUrl}
                  alt="Proof preview"
                  style={{
                    width: "100%",
                    maxHeight: 260,
                    objectFit: "cover",
                    borderRadius: 8,
                  }}
                />
              </Box>
            )}
          </Box>

          <TextField
            fullWidth
            label="Your Actual Cost (₹)"
            type="number"
            margin="normal"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            helperText={`Government estimated budget: ₹${job.estimatedCost?.toLocaleString() || "-"}. Enter your actual cost.`}
          />
          <TextField
            fullWidth
            label="Completion Notes"
            multiline
            rows={3}
            margin="normal"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenComplete(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleComplete}
            disabled={!proofFile}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog
        open={openReject}
        onClose={() => setOpenReject(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Reject Assignment</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Reason for Rejection"
            multiline
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReject(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleReject}>
            Confirm Rejection
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}