import { useState, useEffect } from "react";
import { Box, Typography, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { contractorAPI } from "../services/api";

export default function ContractorManagement() {
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState(null);
  const [contractorDetails, setContractorDetails] = useState(null);
  const [formData, setFormData] = useState({ name: "", companyName: "", email: "", phone: "", address: "", licenseNumber: "", password: "" });
  const [error, setError] = useState("");

  const fetchContractors = () => {
    setLoading(true);
    contractorAPI.getAll()
      .then(res => setContractors(res.data.contractors))
      .catch(() => setError("Failed to fetch contractors."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchContractors();
  }, []);

  const handleOpen = (contractor = null) => {
    setIsEditing(!!contractor);
    setSelectedContractor(contractor);
    setFormData(contractor ? { ...contractor, password: "" } : { name: "", companyName: "", email: "", phone: "", address: "", licenseNumber: "", password: "" });
    setOpen(true);
    setError("");
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedContractor(null);
  };

  const handleViewDetails = async (contractor) => {
    try {
        setLoading(true);
        const res = await contractorAPI.getById(contractor.id);
        setContractorDetails(res.data.contractor);
        setDetailsOpen(true);
    } catch (err) {
        alert("Failed to load contractor details.");
    } finally {
        setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.companyName || !formData.licenseNumber) {
      setError("Name, Company, Email, and License Number are required.");
      return;
    }
    try {
      if (isEditing) {
        await contractorAPI.update(selectedContractor.id, formData);
      } else {
        await contractorAPI.create(formData);
      }
      fetchContractors();
      handleClose();
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${isEditing ? 'update' : 'create'} contractor.`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this contractor? This action cannot be undone and will fail if the contractor has active jobs.")) {
        try {
            await contractorAPI.delete(id);
            fetchContractors();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to delete contractor.");
        }
    }
  };

  const columns = [
    { field: "name", headerName: "Primary Contact", width: 180 },
    { field: "companyName", headerName: "Company", width: 200 },
    { field: "email", headerName: "Email", width: 200 },
    { field: "licenseNumber", headerName: "License No", width: 150 },
    { field: "phone", headerName: "Phone", width: 120 },
    { field: "activeJobs", headerName: "Active Jobs", width: 130, type: 'number' },
    { field: "completedJobs", headerName: "Completed", width: 130, type: 'number' },
    {
      field: "actions",
      headerName: "Actions",
      width: 250,
      renderCell: (params) => (
        <Box>
            <Button size="small" variant="outlined" sx={{ mr: 1 }} onClick={() => handleViewDetails(params.row)}>View</Button>
            <Button size="small" onClick={() => handleOpen(params.row)}>Edit</Button>
            <Button size="small" color="error" onClick={() => handleDelete(params.row.id)}>Delete</Button>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ height: 650, width: "100%" }}>
      <Typography variant="h4" gutterBottom>Contractor Management</Typography>
      <Button variant="contained" onClick={() => handleOpen()} sx={{ mb: 2 }}>
        Add Contractor
      </Button>
      <Paper sx={{ p: 2, height: 600 }}>
        <DataGrid rows={contractors} columns={columns} pageSize={10} loading={loading} />
      </Paper>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditing ? "Edit Contractor" : "Add New Contractor"}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField autoFocus margin="dense" name="name" label="Primary Contact Person" type="text" fullWidth value={formData.name} onChange={handleChange} />
          <TextField margin="dense" name="companyName" label="Company Name" type="text" fullWidth value={formData.companyName} onChange={handleChange} />
          <TextField margin="dense" name="licenseNumber" label="License Number" type="text" fullWidth value={formData.licenseNumber} onChange={handleChange} />
          <TextField margin="dense" name="email" label="Email" type="email" fullWidth value={formData.email} onChange={handleChange} />
          <TextField margin="dense" name="phone" label="Phone" type="tel" fullWidth value={formData.phone} onChange={handleChange} />
          <TextField margin="dense" name="address" label="Address" type="text" fullWidth value={formData.address} onChange={handleChange} />
          {!isEditing && (
            <TextField margin="dense" name="password" label="Initial Password" type="password" fullWidth value={formData.password} onChange={handleChange} helperText="Leave blank for default: Contractor@123" />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">{isEditing ? "Save Changes" : "Create"}</Button>
        </DialogActions>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Contractor Profile: {contractorDetails?.companyName}</DialogTitle>
        <DialogContent dividers>
            {contractorDetails && (
                <Box>
                    <Typography variant="subtitle1" gutterBottom><b>Contact Person:</b> {contractorDetails.name}</Typography>
                    <Typography variant="subtitle1" gutterBottom><b>License:</b> {contractorDetails.licenseNumber}</Typography>
                    <Typography variant="subtitle1" gutterBottom><b>Contact:</b> {contractorDetails.email} | {contractorDetails.phone}</Typography>
                    <Typography variant="subtitle1" gutterBottom><b>Stats:</b> {contractorDetails.activeJobs} Active Jobs, {contractorDetails.completedJobs} Completed</Typography>
                    
                    <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Work History</Typography>
                    {contractorDetails.workOrders?.length > 0 ? (
                        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                            {contractorDetails.workOrders.map(wo => (
                                <Paper key={wo.id} sx={{ p: 1, mb: 1, border: '1px solid #eee' }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body2"><b>Order:</b> {wo.orderNumber || 'Legacy'}</Typography>
                                        <Typography variant="body2" sx={{ color: wo.status === 'COMPLETED' ? 'success.main' : 'info.main' }}>
                                            {wo.status}
                                        </Typography>
                                    </Box>
                                    <Typography variant="caption" color="textSecondary">Created: {new Date(wo.createdAt).toLocaleDateString()}</Typography>
                                </Paper>
                            ))}
                        </Box>
                    ) : (
                        <Typography color="textSecondary">No work orders found.</Typography>
                    )}
                </Box>
            )}
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
