import { useState, useEffect } from "react";
import { Box, Typography, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { departmentAPI } from "../services/api";

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [formData, setFormData] = useState({ name: "", code: "", description: "", contactEmail: "", contactPhone: "" });
  const [error, setError] = useState("");

  const fetchDepartments = () => {
    setLoading(true);
    departmentAPI.getAll()
      .then(res => setDepartments(res.data.departments))
      .catch(() => setError("Failed to fetch departments."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleOpen = (dept = null) => {
    setIsEditing(!!dept);
    setSelectedDept(dept);
    setFormData(dept ? { ...dept } : { name: "", code: "", description: "", contactEmail: "", contactPhone: "" });
    setOpen(true);
    setError("");
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedDept(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.code) {
      setError("Department Name and Code are required.");
      return;
    }
    try {
      if (isEditing) {
        await departmentAPI.update(selectedDept.id, formData);
      } else {
        await departmentAPI.create(formData);
      }
      fetchDepartments();
      handleClose();
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${isEditing ? 'update' : 'create'} department.`);
    }
  };

  const columns = [
    { field: "name", headerName: "Name", width: 200 },
    { field: "code", headerName: "Code", width: 150 },
    { field: "contactEmail", headerName: "Contact Email", width: 250 },
    { field: "contactPhone", headerName: "Contact Phone", width: 150 },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      renderCell: (params) => (
        <Button onClick={() => handleOpen(params.row)}>Edit</Button>
      ),
    },
  ];

  return (
    <Box sx={{ height: 650, width: "100%" }}>
      <Typography variant="h4" gutterBottom>Department Management</Typography>
      <Button variant="contained" onClick={() => handleOpen()} sx={{ mb: 2 }}>
        Add Department
      </Button>
      <Paper sx={{ p: 2, height: 600 }}>
        <DataGrid rows={departments} columns={columns} pageSize={10} loading={loading} />
      </Paper>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditing ? "Edit Department" : "Add New Department"}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField autoFocus margin="dense" name="name" label="Department Name" type="text" fullWidth value={formData.name} onChange={handleChange} />
          <TextField margin="dense" name="code" label="Department Code" type="text" fullWidth value={formData.code} onChange={handleChange} />
          <TextField margin="dense" name="description" label="Description" type="text" fullWidth multiline rows={3} value={formData.description} onChange={handleChange} />
          <TextField margin="dense" name="contactEmail" label="Contact Email" type="email" fullWidth value={formData.contactEmail} onChange={handleChange} />
          <TextField margin="dense" name="contactPhone" label="Contact Phone" type="tel" fullWidth value={formData.contactPhone} onChange={handleChange} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">{isEditing ? "Save Changes" : "Create"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
