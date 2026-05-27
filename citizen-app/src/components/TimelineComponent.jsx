import { useState, useEffect } from "react";
import { Box, Typography, Stepper, Step, StepLabel, StepContent, CircularProgress, Chip } from "@mui/material";
import { complaintAPI } from "../services/api";

export default function TimelineComponent({ complaintId, trigger, initialData }) {
  const [history, setHistory] = useState(initialData || []);
  const [loading, setLoading] = useState(!initialData);

  useEffect(() => {
    // If we have initial data and the ID hasn't changed, we can skip the initial fetch
    if (initialData && history.length > 0 && !trigger) {
        setLoading(false);
        return;
    }

    if (complaintId) {
      setLoading(true);
      complaintAPI.getHistory(complaintId)
        .then((res) => {
            const data = res.data.history || res.data || [];
            const sorted = [...data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            setHistory(sorted);
        })
        .catch((err) => {
            console.error("History fetch failed, using fallback:", err);
            if (initialData) setHistory(initialData);
        })
        .finally(() => setLoading(false));
    }
  }, [complaintId, trigger, initialData]);

  if (loading) return <CircularProgress size={20} />;
  if (history.length === 0) return <Typography color="textSecondary" sx={{ mt: 2 }}>No history available</Typography>;

  const ACTION_LABELS = {
    SUBMISSION: "Complaint Submitted",
    AI_ADVISORY: "AI Damage Analysis Completed",
    VERIFICATION: "Complaint Verified by Official",
    REJECTION: "Complaint Rejected",
    COMPLAINT_REJECTED: "Complaint Rejected",
    ASSIGNMENT: "Assigned for Repair",
    WORK_ORDER_CREATED: "Work Order Issued to Contractor",
    WORK_ACCEPTED_BY_CONTRACTOR: "Contractor Accepted Job",
    WORK_COMPLETED_BY_CONTRACTOR: "Repair Finished - Pending Review",
    STATUS_CHANGE: "Status Update",
    WORK_REJECTED: "Work Rejected - Rework Required",
  };

  const getChipColor = (action) => {
    if (!action) return "default";
    const a = action.toUpperCase();
    if (a.includes("REJECT")) return "error";
    if (a.includes("VERIFY") || a.includes("VERIFICATION") || a.includes("APPROVE") || a.includes("SUBMISSION") || a.includes("SUBMITTED")) return "success";
    if (a.includes("WORK_ORDER") || a.includes("ASSIGN")) return "info";
    if (a.includes("CONTRACTOR") || a.includes("COMPLETE")) return "warning";
    return "primary";
  };

  return (
    <Box sx={{ maxWidth: 600, mt: 2 }}>
      <Stepper orientation="vertical">
        {history.map((item, index) => {
          const ts = item.timestamp ? new Date(item.timestamp) : null;
          let label = ACTION_LABELS[item.action] || item.action?.replace(/_/g, " ") || "Event";
          
          // Enhance generic status change labels
          if (item.action === "STATUS_CHANGE" && item.newValue) {
              label = `Status: ${item.newValue.replace(/_/g, " ")}`;
          }

          return (
            <Step key={item.id || index} active={true} expanded={true}>
              <StepLabel>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                  <Chip 
                    label={label} 
                    color={getChipColor(item.action)} 
                    size="small" 
                    sx={{ fontWeight: 700, borderRadius: '4px' }} 
                  />
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 500 }}>
                    {ts ? ts.toLocaleString("en-IN", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Date unknown"}
                  </Typography>
                </Box>
              </StepLabel>
              <StepContent>
                <Box sx={{ pl: 1, borderLeft: '2px solid #eee', ml: 0.5, py: 0.5 }}>
                    {item.comments && (
                      <Typography variant="body2" sx={{ color: "text.primary", fontStyle: item.action?.includes("REJECT") ? "normal" : "italic", mb: 0.5 }}>
                        {item.action?.includes("REJECT") ? <b>Reason: </b> : ""} {item.comments}
                      </Typography>
                    )}
                    <Typography variant="caption" color="textSecondary" display="block">
                      Action by: <b>{item.performedBy || "System"}</b>
                    </Typography>
                </Box>
              </StepContent>
            </Step>
          );
        })}
      </Stepper>
    </Box>
  );
}
