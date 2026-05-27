import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Box, Typography, TextField, Button, Paper, Grid, FormControl, InputLabel, Select, MenuItem, Alert, CircularProgress, IconButton, ImageList, ImageListItem, ImageListItemBar } from "@mui/material";
import { CameraAlt, MyLocation, Delete } from "@mui/icons-material";
import { toast } from "react-toastify";
import { createComplaint, clearSubmitSuccess } from "../store/complaintsSlice";

export default function ReportComplaint() {
  const [formData, setFormData] = useState({ title: "", description: "", latitude: "", longitude: "", address: "", ward: "", roadType: "RESIDENTIAL" });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, submitSuccess } = useSelector((state) => state.complaints);

  useEffect(() => {
    if (submitSuccess) {
      toast.success("Complaint submitted successfully!");
      dispatch(clearSubmitSuccess());
      navigate("/my-complaints");
    }
  }, [submitSuccess, navigate, dispatch]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageCapture = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 5) { toast.error("Maximum 5 images allowed"); return; }
    setImages([...images, ...files]);
    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...previews]);
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) { toast.error("Geolocation is not supported by your browser"); return; }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setFormData({ ...formData, latitude: latitude.toString(), longitude: longitude.toString() });
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          if (data && data.display_name) { setFormData((prev) => ({ ...prev, address: data.display_name })); }
        } catch (err) { console.error("Geocoding error:", err); }
        setLocationLoading(false);
        toast.success("Location captured successfully");
      },
      (error) => { setLocationLoading(false); toast.error("Unable to get location: " + error.message); }
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (images.length === 0) { toast.error("Please add at least one photo"); return; }
    if (!formData.latitude || !formData.longitude) { toast.error("Please capture your location"); return; }
    const submitData = new FormData();
    Object.keys(formData).forEach(key => submitData.append(key, formData[key]));
    images.forEach((image) => submitData.append("images", image));
    dispatch(createComplaint(submitData));
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Report Road Damage</Typography>
      <Paper sx={{ p: 3, mt: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField required fullWidth label="Title" name="title" value={formData.title} onChange={handleChange} placeholder="e.g., Large pothole" />
            </Grid>
            <Grid item xs={12}>
              <TextField required fullWidth multiline rows={4} label="Description" name="description" value={formData.description} onChange={handleChange} placeholder="Describe the damage..." />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField required fullWidth label="Ward" name="ward" value={formData.ward} onChange={handleChange} placeholder="e.g., Ward 12" />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Road Type</InputLabel>
                <Select name="roadType" value={formData.roadType} onChange={handleChange} label="Road Type">
                  <MenuItem value="HIGHWAY">Highway</MenuItem>
                  <MenuItem value="MAIN_ROAD">Main Road</MenuItem>
                  <MenuItem value="RESIDENTIAL">Residential</MenuItem>
                  <MenuItem value="INTERNAL">Internal</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <Button variant="outlined" startIcon={locationLoading ? <CircularProgress size={20} /> : <MyLocation />} onClick={getCurrentLocation} disabled={locationLoading}>
                  {locationLoading ? "Getting Location..." : "Capture Location"}
                </Button>
                {formData.latitude && formData.longitude && <Typography variant="body2" color="success.main">Location captured</Typography>}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField required fullWidth label="Address" name="address" value={formData.address} onChange={handleChange} placeholder="Address" />
            </Grid>
            <Grid item xs={12}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>📸 Add Damage Photos (Required, max 5)</Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {/* Camera button — opens device camera directly */}
                  <input
                    accept="image/*"
                    capture="environment"
                    style={{ display: "none" }}
                    id="camera-capture"
                    multiple
                    type="file"
                    onChange={handleImageCapture}
                  />
                  <label htmlFor="camera-capture">
                    <Button
                      variant="contained"
                      component="span"
                      startIcon={<CameraAlt />}
                      disabled={images.length >= 5}
                      color="primary"
                    >
                      Take Photo
                    </Button>
                  </label>

                  {/* Upload button — opens file picker (gallery / local files) */}
                  <input
                    accept="image/*"
                    style={{ display: "none" }}
                    id="file-upload"
                    multiple
                    type="file"
                    onChange={handleImageCapture}
                  />
                  <label htmlFor="file-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<CameraAlt />}
                      disabled={images.length >= 5}
                    >
                      Upload from Gallery
                    </Button>
                  </label>
                </Box>
                {images.length > 0 && (
                  <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: "block" }}>
                    {images.length}/5 photos added
                  </Typography>
                )}
              </Box>
            </Grid>
            {imagePreviews.length > 0 && (
              <Grid item xs={12}>
                <ImageList cols={3} gap={8}>
                  {imagePreviews.map((preview, index) => (
                    <ImageListItem key={index}>
                      <img src={preview} alt={`Preview ${index + 1}`} loading="lazy" />
                      <ImageListItemBar actionIcon={<IconButton sx={{ color: "rgba(255, 255, 255, 0.8)" }} onClick={() => removeImage(index)}><Delete /></IconButton>} />
                    </ImageListItem>
                  ))}
                </ImageList>
              </Grid>
            )}
            <Grid item xs={12}>
              <Button type="submit" variant="contained" size="large" fullWidth disabled={loading || images.length === 0 || !formData.latitude || !formData.longitude}>
                {loading ? "Submitting..." : "Submit Complaint"}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
}

