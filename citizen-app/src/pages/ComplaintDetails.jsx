import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Box, Typography, Paper, Grid, Chip, CircularProgress, Alert, ImageList, ImageListItem } from "@mui/material";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { fetchComplaintById } from "../store/complaintsSlice";
import TimelineComponent from "../components/TimelineComponent";

export default function ComplaintDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { current, loading, error } = useSelector((state) => state.complaints);

  useEffect(() => { dispatch(fetchComplaintById(id)); }, [dispatch, id]);

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!current) return <Alert severity="info">Complaint not found</Alert>;

  const handleImageClick = (url) => window.open(url, "_blank");
  const getImageUrl = (url) => !url ? "" : url.startsWith("http") ? url : `http://localhost:3000${url}`;

  // Find rejection reason from auditLogs or complaintHistory
  const getRejectionReason = () => {
    const logs = current.auditLogs || [];
    // Check for official rejection in new audit system
    const rejLog = logs.find(l =>
      l.action === "REJECTION" || l.action === "COMPLAINT_REJECTED" || l.action === "STATUS_CHANGE"
    );
    
    if (rejLog?.details?.comments) return rejLog.details.comments;
    if (rejLog?.details?.reason) return rejLog.details.reason;

    // Fallback: check old history system
    const hist = current.history || current.complaintHistory || [];
    const rejHist = hist.find(h => (h.action?.includes("REJECT") || h.action?.includes("REJECTION")) && h.comments);
    return rejHist?.comments || null;
  };

  const rejectionReason = current.status === "REJECTED" ? getRejectionReason() : null;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Complaint Details</Typography>
      <Paper sx={{ p: 3, mt: 3 }}>
        <Grid container spacing={4}>

          {/* Header: Title + Status */}
          <Grid item xs={12}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Box>
                <Typography variant="h5">{current.title}</Typography>
                <Typography variant="caption" color="textSecondary">Complaint #: {current.complaintNumber}</Typography>
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <Chip
                  label={
                    current.status === "COMPLETED" ? "Work Submitted - Admin Reviewing" :
                    current.status === "CLOSED" ? "Resolved & Closed" :
                    current.status === "VERIFIED" ? "Verified - Pending Assignment" :
                    current.status === "ASSIGNED" ? "Assigned to Contractor" :
                    current.status === "IN_PROGRESS" ? "Repair In Progress" :
                    current.status === "REJECTED" ? "Complaint Rejected" : "Submitted - Awaiting Review"
                  }
                  color={
                    current.status === "CLOSED" ? "success" :
                    current.status === "REJECTED" ? "error" :
                    (current.status === "COMPLETED" || current.status === "IN_PROGRESS") ? "warning" : "primary"
                  }
                  sx={{ fontSize: "0.85rem", height: 32, fontWeight: 600 }}
                />
                {current.status === "COMPLETED" && (
                  <Typography variant="caption" display="block" color="warning.main" sx={{ mt: 0.5 }}>
                     Contractor submitted. Awaiting official approval before closing.
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>

          {/* Rejection Reason Banner — prominently shown when rejected */}
          {current.status === "REJECTED" && (
            <Grid item xs={12}>
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Your complaint was rejected by the Municipal Corporation</Typography>
                {rejectionReason ? (
                  <Typography variant="body2">
                    <b>Reason:</b> {rejectionReason}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    No specific reason was provided. Please visit the ward office or re-submit with clearer photos and an accurate description.
                  </Typography>
                )}
              </Alert>
            </Grid>
          )}

          {/* Description */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>Description</Typography>
            <Typography variant="body1">{current.description}</Typography>
          </Grid>

          {/* Location & Meta */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">Location</Typography>
            <Typography variant="body2">{current.address}</Typography>
            <Typography variant="body2">Ward: {current.ward}</Typography>
            <Typography variant="body2">Road Type: {current.roadType}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">Submitted On</Typography>
            <Typography variant="body2">{new Date(current.createdAt).toLocaleString()}</Typography>
            {current.slaDeadline && <Box sx={{ mt: 1 }}><Typography variant="subtitle2" color="textSecondary">Target Resolution</Typography><Typography variant="body2" color="warning.main">{new Date(current.slaDeadline).toLocaleDateString()}</Typography></Box>}
          </Grid>

          {/* Map */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>Location Map</Typography>
            {current.latitude && current.longitude ? (
              <Box sx={{ height: 300, width: "100%" }}>
                <MapContainer center={[current.latitude, current.longitude]} zoom={15} style={{ height: "100%", width: "100%" }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                  <Marker position={[current.latitude, current.longitude]}><Popup>{current.address}</Popup></Marker>
                </MapContainer>
              </Box>
            ) : <Typography>No location data</Typography>}
          </Grid>

          {/* Images Gallery: Divided into Before and After sections */}
          <Grid item xs={12}>
            {current.images && current.images.length > 0 && (
              <Box>
                {/* BEFORE Section: Citizen evidence */}
                <Box sx={{ mb: 4, p: 2, bgcolor: "#fff8e1", borderRadius: 2, border: '1px solid #ffe082' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: "#f57c00", fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, bgcolor: "#f57c00", borderRadius: "50%" }} />
                    BEFORE - Citizen Damage Evidence
                  </Typography>
                  <ImageList cols={3} gap={8} rowHeight={160}>
                    {current.images.filter(img => !img.isProof).map((image, index) => (
                      <ImageListItem key={index}>
                        <img src={getImageUrl(image.imageUrl)} alt="Before" loading="lazy" style={{ cursor: "pointer", height: '100%', objectFit: "cover", borderRadius: 4 }} onClick={() => handleImageClick(getImageUrl(image.imageUrl))} />
                      </ImageListItem>
                    ))}
                  </ImageList>
                  {current.images.filter(img => !img.isProof).length === 0 && <Typography variant="caption">No initial evidence photos available.</Typography>}
                </Box>

                {/* AFTER Section: Contractor proof (Only if status is COMPLETED/CLOSED) */}
                {current.images.some(img => img.isProof) && (
                  <Box sx={{ p: 2, bgcolor: "#e8f5e9", borderRadius: 2, border: '1px solid #a5d6a7' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: "#2e7d32", fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, bgcolor: "#2e7d32", borderRadius: "50%" }} />
                      AFTER - Contractor Repair Proof
                    </Typography>
                    <ImageList cols={3} gap={8} rowHeight={160}>
                      {current.images.filter(img => img.isProof).map((image, index) => (
                        <ImageListItem key={index}>
                          <img src={getImageUrl(image.imageUrl)} alt="After" loading="lazy" style={{ cursor: "pointer", height: '100%', objectFit: "cover", borderRadius: 4 }} onClick={() => handleImageClick(getImageUrl(image.imageUrl))} />
                        </ImageListItem>
                      ))}
                    </ImageList>
                  </Box>
                )}
              </Box>
            )}
          </Grid>

          {/* Activity Timeline */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Activity History</Typography>
            <TimelineComponent 
               complaintId={id} 
               trigger={current.updatedAt} 
               initialData={current.auditLogs?.map(l => ({
                 id: l.id,
                 action: l.action,
                 timestamp: l.timestamp,
                 comments: l.details?.comments || l.details?.reason || null,
                 performedBy: l.performedBy?.name || (l.performedById === 'SYSTEM' ? 'AI System' : 'Official')
               }))}
            />
          </Grid>

        </Grid>
      </Paper>
    </Box>
  );
}