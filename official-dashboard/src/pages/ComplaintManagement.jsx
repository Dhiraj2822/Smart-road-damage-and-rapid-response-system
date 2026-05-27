import { useState, useEffect } from "react";
import { Box, Typography, Paper, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Grid, TextField, ImageList, ImageListItem, MenuItem, Alert, FormControl, InputLabel, Select, Tabs, Tab } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { complaintAPI, contractorAPI, departmentAPI } from "../services/api";
import TimelineComponent from "../components/TimelineComponent";

export default function ComplaintManagement() {
  const [complaints, setComplaints] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState("");
  
  // Verification State
  const [verifyType, setVerifyType] = useState("");
  const [verifySeverity, setVerifySeverity] = useState("");
  const [verifyPriority, setVerifyPriority] = useState(5);
  
  // Assignment State
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTab, setAssignTab] = useState(0); // 0 = Contractor, 1 = Department
  const [selectedContractor, setSelectedContractor] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [estCost, setEstCost] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [workDesc, setWorkDesc] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const fetchComplaints = () => { setLoading(true); complaintAPI.getAll().then(res => setComplaints(res.data.complaints)).finally(() => setLoading(false)); };
  const fetchContractors = () => { contractorAPI.getAll().then(res => setContractors(res.data.contractors || [])).catch(() => setContractors([])); };
  const fetchDepartments = () => { departmentAPI.getAll().then(res => setDepartments(res.data.departments || [])).catch(() => setDepartments([])); };
  useEffect(() => { fetchComplaints(); fetchContractors(); fetchDepartments(); }, []);

  useEffect(() => {
     if (selectedComplaint && open) {
          const ai = selectedComplaint.aiDetails || {};
          setVerifyType(ai.damageType || "");
          setVerifySeverity(ai.severity || "");
          setVerifyPriority(5);
     }
  }, [selectedComplaint, open]);

  const handleVerify = async () => {
    setConfirmOpen(false);
    try {
      if (!verifyType || !verifySeverity) { alert("Type and Severity required"); return; }
      await complaintAPI.verify(selectedComplaint.id, { verified: true, damageType: verifyType, severity: verifySeverity, priority: verifyPriority, comments: comment });
      fetchComplaints(); setOpen(false); setComment("");
    } catch (e) { alert("Failed: " + (e.response?.data?.error || e.message)); }
  };

  const handleReject = async () => {
    setConfirmOpen(false);
    if (!comment) { alert("Reason required"); return; }
    try {
      await complaintAPI.verify(selectedComplaint.id, { verified: false, comments: comment }); // Backend handles verified: false as reject
      fetchComplaints(); setOpen(false); setComment("");
    } catch (e) { alert("Failed: " + e.message); }
  };

  const openConfirmation = (action) => {
    setConfirmAction(action); 
    setConfirmOpen(true);
  };

  const handleAssignClick = () => {
      setAssignOpen(true);
      setAssignTab(0);
      setSelectedContractor("");
      setSelectedDepartment("");
      const d = new Date(); d.setDate(d.getDate() + 14); setDueDate(d.toISOString().split("T")[0]);
      setWorkDesc(`Repair: ${selectedComplaint.title}`);
  };

  const submitAssignment = async () => {
        if (!selectedContractor || !estCost || !dueDate) { console.warn("Missing fields"); return; }
        try {
            await contractorAPI.assignWorkOrder({
                complaintId: selectedComplaint.id, contractorId: selectedContractor, description: workDesc, estimatedCost: estCost, dueDate
            });
            setAssignOpen(false); setOpen(false); fetchComplaints();
        } catch (e) { console.error("Assignment Failed: ", e); }
  };

  const columns = [
    { field: "complaintNumber", headerName: "No", width: 150 },
    { field: "title", headerName: "Title", width: 250 },
    { field: "status", headerName: "Status", width: 140, renderCell: (p) => <Chip label={p.value} color={p.value==="RESOLVED"?"success":p.value==="REJECTED"?"error":p.value==="ASSIGNED"?"info":"warning"} /> },
    { field: "ward", headerName: "Ward", width: 100 },
    { field: "createdAt", headerName: "Created", width: 180, valueFormatter: (p) => new Date(p.value).toLocaleDateString() },
    { field: "actions", headerName: "Actions", width: 150, renderCell: (p) => <Button onClick={() => { setSelectedComplaint(p.row); setOpen(true); }}>View</Button> },
  ];

  const getImageUrl = (path) => path ? `http://localhost:3000${path}` : "";

  return (
    <Box sx={{ height: 650, width: "100%" }}>
      <Typography variant="h4" gutterBottom>Complaint Management</Typography>
      <Paper sx={{ p: 2, height: 600 }}>
        <DataGrid rows={complaints} columns={columns} pageSize={10} disableSelectionOnClick loading={loading} />
      </Paper>
      
      {selectedComplaint && (
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>{selectedComplaint.complaintNumber} <Chip label={selectedComplaint.status} size="small" sx={{ ml: 2 }} /></DialogTitle>
          <DialogContent dividers>
            <Typography variant="h6">{selectedComplaint.title}</Typography>
            <Typography paragraph>{selectedComplaint.description}</Typography>
            
            {/* AI Advisory */}
            {/* AI Advisory â€” shown when available */}
            <Box sx={{ mb: 2, p: 2, bgcolor: selectedComplaint.aiDetails ? "#e3f2fd" : "#f5f5f5", borderRadius: 2 }}>
              <Typography variant="subtitle2" color={selectedComplaint.aiDetails ? "primary" : "textSecondary"}>
                AI Analysis {selectedComplaint.aiDetails ? "(Advisory)" : "- Not Available for this complaint"}
              </Typography>
              {selectedComplaint.aiDetails ? (
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                  <Grid item xs={4}><Typography variant="caption">Damage Type</Typography><Typography fontWeight="bold">{selectedComplaint.aiDetails.damageType || "-"}</Typography></Grid>
                  <Grid item xs={4}><Typography variant="caption">Severity</Typography><Typography fontWeight="bold">{selectedComplaint.aiDetails.severity || "-"}</Typography></Grid>
                  <Grid item xs={4}><Typography variant="caption">Confidence</Typography><Typography fontWeight="bold">{selectedComplaint.aiDetails.confidence ? (selectedComplaint.aiDetails.confidence * 100).toFixed(1) + "%" : "-"}</Typography></Grid>
                </Grid>
              ) : (
                <Typography variant="caption" color="textSecondary">AI was not able to analyze this complaint. Please fill in the Damage Type and Severity manually using the fields below.</Typography>
              )}
            </Box>

            {/* Official Verification Inputs - Show if SUBMITTED */}
            {selectedComplaint.status === "SUBMITTED" && (
                <Box sx={{ mt: 2, p: 2, border: "1px solid #ddd", borderRadius: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Official Verification</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Damage Type</InputLabel>
                                <Select value={verifyType} label="Damage Type" onChange={e => setVerifyType(e.target.value)}>
                                    <MenuItem value="POTHOLE">Pothole</MenuItem>
                                    <MenuItem value="CRACK">Crack</MenuItem>
                                    <MenuItem value="SURFACE_FAILURE">Surface Failure</MenuItem>
                                    <MenuItem value="DRAINAGE">Drainage Issue</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Severity</InputLabel>
                                <Select value={verifySeverity} label="Severity" onChange={e => setVerifySeverity(e.target.value)}>
                                    <MenuItem value="LOW">Low (&lt;10cm)</MenuItem>
                                    <MenuItem value="MEDIUM">Medium (10-30cm)</MenuItem>
                                    <MenuItem value="HIGH">High (30-50cm)</MenuItem>
                                    <MenuItem value="CRITICAL">Critical (&gt;50cm)</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </Box>
            )}

            {/* Read-only details for other statuses */}
            {selectedComplaint.status !== "SUBMITTED" && selectedComplaint.damageType && (
                 <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2">Verified Classification</Typography>
                    <Typography component="span" sx={{ mr: 2 }}>Type: <b>{selectedComplaint.damageType}</b></Typography>
                    <Typography component="span">Severity: <b>{selectedComplaint.severity}</b></Typography>
                 </Box>
            )}
            
            {/* Images - BEFORE (citizen damage) & AFTER (contractor proof) */}
            {selectedComplaint.images?.filter(img => (!(img.isProof === true || img.originalName === "Proof of Repairs") && img.originalName !== "Proof of Repairs")).length > 0 && (
                <Box sx={{ mt: 2, p: 2, bgcolor: "#fff3e0", borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: "warning.dark", fontWeight: 700 }}> Before - Citizen Damage Evidence</Typography>
                    <ImageList cols={4} rowHeight={120}>
                        {selectedComplaint.images.filter(img => (!(img.isProof === true || img.originalName === "Proof of Repairs") && img.originalName !== "Proof of Repairs")).map(img => (
                            <ImageListItem key={img.id} sx={{ cursor: "pointer" }} onClick={() => window.open(getImageUrl(img.imageUrl), "_blank")}>
                                <img src={getImageUrl(img.imageUrl)} alt="Before" style={{ height: 120, objectFit: "cover", borderRadius: 4 }} />
                            </ImageListItem>
                        ))}
                    </ImageList>
                </Box>
            )}
            {selectedComplaint.images?.filter(img => (img.isProof === true || img.originalName === "Proof of Repairs")).length > 0 ? (
                <Box sx={{ mt: 2, p: 2, bgcolor: "#e8f5e9", borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: "success.dark", fontWeight: 700 }}> After - Contractor Repair Proof</Typography>
                    <ImageList cols={4} rowHeight={120}>
                        {selectedComplaint.images.filter(img => (img.isProof === true || img.originalName === "Proof of Repairs")).map(img => (
                            <ImageListItem key={img.id} sx={{ cursor: "pointer" }} onClick={() => window.open(getImageUrl(img.imageUrl), "_blank")}>
                                <img src={getImageUrl(img.imageUrl)} alt="After" style={{ height: 120, objectFit: "cover", borderRadius: 4 }} />
                            </ImageListItem>
                        ))}
                    </ImageList>
                </Box>
            ) : selectedComplaint.status === "COMPLETED" && (
                <Box sx={{ mt: 2, p: 1.5, bgcolor: "#fff8e1", borderRadius: 2 }}>
                    <Typography variant="caption" color="warning.main"> Contractor marked complete but no after-photo uploaded. Consider rejecting.</Typography>
                </Box>
            )}

            {/* Activity History / Timeline */}
            <Box sx={{ mt: 3, mb: 1 }}>
                <Typography variant="subtitle2" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>Activity History</Typography>
                <TimelineComponent 
                  complaintId={selectedComplaint.id} 
                  trigger={selectedComplaint.updatedAt} 
                  initialData={selectedComplaint.auditLogs?.map(l => ({
                    id: l.id,
                    action: l.action,
                    timestamp: l.timestamp,
                    comments: l.details?.comments || l.details?.reason || null,
                    performedBy: l.performedBy?.name || (l.performedById === 'SYSTEM' ? 'AI System' : 'Official')
                  }))}
                />
            </Box>

            {/* Verify/Reject Input - Show for SUBMITTED (Verification) and COMPLETED (Approval) */}
            {(selectedComplaint.status === "SUBMITTED" || selectedComplaint.status === "COMPLETED") && (
                <TextField 
                  fullWidth 
                  label={selectedComplaint.status === "SUBMITTED" ? "Comments / Internal Notes" : "Approval/Feedback Notes"} 
                  multiline 
                  rows={2} 
                  value={comment} 
                  onChange={e => setComment(e.target.value)} 
                  sx={{ mt: 2 }} 
                  placeholder={selectedComplaint.status === "SUBMITTED" ? "Optional verification notes..." : "Optional approval notes..."}
                />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Close</Button>
            {selectedComplaint.status === "SUBMITTED" && (
              <>
                <Button color="error" onClick={() => openConfirmation("REJECT")}>Reject</Button>
                <Button variant="contained" color="success" onClick={() => openConfirmation("VERIFY")}>Verify Complaint</Button>
              </>
            )}
             
            {/* Assignment Dialog Trigger */}
            {(selectedComplaint.status === "ASSIGNED" || selectedComplaint.status === "VERIFIED") && !selectedComplaint.contractorId && (
                <Button variant="contained" color="primary" onClick={handleAssignClick}>Assign Contractor</Button> )}
            {(selectedComplaint.status === "COMPLETED") && ( <> <Button color="error" onClick={() => openConfirmation("REJECT_WORK")}>Reject Work</Button> <Button variant="contained" color="success" onClick={() => openConfirmation("APPROVE_WORK")}>Approve & Close</Button> </> )}
          </DialogActions>
        </Dialog>
      )}

      {/* Popups (Confirm, Assign) omitted for brevity but logic is needed... inclusion recommended */}
       <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {confirmAction?.includes("REJECT") ? "Confirm Rejection" : "Confirm Action"}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {confirmAction === "VERIFY" && "Verify this complaint and proceed to assignment?"}
            {confirmAction === "REJECT" && "Please provide a reason for rejecting this citizen complaint:"}
            {confirmAction === "APPROVE_WORK" && "Approve the contractor's work and close this complaint?"}
            {confirmAction === "REJECT_WORK" && "Please provide a reason for rejecting the contractor's work:"}
          </Typography>
          
          {confirmAction?.includes("REJECT") && (
            <TextField
              fullWidth
              label="Rejection Reason (Required)"
              multiline
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              error={!comment.trim()}
              helperText={!comment.trim() ? "A reason is mandatory for rejection." : ""}
              autoFocus
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button 
            onClick={async () => { 
              if (confirmAction === "VERIFY") await handleVerify(); 
              else if (confirmAction === "REJECT") await handleReject(); 
              else if (confirmAction === "APPROVE_WORK") { 
                try { 
                  await complaintAPI.updateStatus(selectedComplaint.id, "CLOSED", comment || "Work Verified by Admin"); 
                  fetchComplaints(); setOpen(false); setConfirmOpen(false); setComment("");
                } catch(e) { alert(e.message); } 
              } 
              else if (confirmAction === "REJECT_WORK") { 
                try { 
                  if (!comment.trim()) { alert("Rejection reason is mandatory"); return; }
                  await complaintAPI.updateStatus(selectedComplaint.id, "IN_PROGRESS", "Work Rejected: " + comment); 
                  fetchComplaints(); setOpen(false); setConfirmOpen(false); setComment("");
                } catch(e) { alert(e.message); } 
              } 
            }} 
            color={confirmAction?.includes("REJECT") ? "error" : "primary"} 
            variant="contained"
            disabled={confirmAction?.includes("REJECT") && !comment.trim()}
          >
            Confirm {confirmAction?.includes("REJECT") ? "Rejection" : ""}
          </Button>
        </DialogActions>
      </Dialog>
      
      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Assign to Contractor</DialogTitle>
          <DialogContent>
                <TextField select fullWidth label="Select Contractor" margin="normal" value={selectedContractor} onChange={e => setSelectedContractor(e.target.value)}>
                    {contractors.map(c => <MenuItem key={c.id} value={c.id}>{c.companyName}</MenuItem>)}
                </TextField>
                <TextField fullWidth label="Estimated Cost (₹)" type="number" margin="normal" value={estCost} onChange={e => setEstCost(e.target.value)} />
                <TextField fullWidth label="Due Date" type="date" margin="normal" InputLabelProps={{ shrink: true }} value={dueDate} onChange={e => setDueDate(e.target.value)} />
                <TextField fullWidth label="Work Description" multiline rows={3} margin="normal" value={workDesc} onChange={e => setWorkDesc(e.target.value)} />
          </DialogContent>
          <DialogActions>
              <Button onClick={() => setAssignOpen(false)}>Cancel</Button>
              <Button onClick={submitAssignment} variant="contained" color="primary">Assign to Contractor</Button>
          </DialogActions>
      </Dialog>
    </Box>
  );
}




