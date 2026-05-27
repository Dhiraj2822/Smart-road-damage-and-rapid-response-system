import { useState, useEffect } from "react";
import { Box, Typography, Paper, CircularProgress, Chip } from "@mui/material";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { complaintAPI } from "../services/api";

// Fix Leaflet's default icon path issues with Webpack/Vite
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function MapView() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    complaintAPI
      .getAll()
      .then((res) => setComplaints(res.data.complaints))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  // City coordinates
  const position = [17.6599, 75.9064];

  return (
    <Box sx={{ height: "80vh", width: "100%" }}>
      <Typography variant="h4" gutterBottom>
        Complaint Map
      </Typography>
      <Paper sx={{ height: "100%", width: "100%" }}>
        <MapContainer center={position} zoom={13} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {complaints.map((complaint) => (
             complaint.latitude && complaint.longitude && (
                <Marker 
                    key={complaint.id} 
                    position={[complaint.latitude, complaint.longitude]}
                >
                  <Popup>
                    <Box sx={{ width: 200 }}>
                        <Typography variant="subtitle2" gutterBottom>{complaint.title}</Typography>
                        <Chip 
                            label={complaint.status} 
                            size="small" 
                            color={complaint.status === 'RESOLVED' ? 'success' : 'primary'} 
                            sx={{ mb: 1 }}
                        />
                        <Typography variant="body2" noWrap>{complaint.address}</Typography>
                        {complaint.images && complaint.images.length > 0 && (
                            <Box sx={{ mt: 1, height: 100, overflow: 'hidden', borderRadius: 1 }}>
                                <img 
                                    src={`http://localhost:3000${complaint.images[0].imageUrl}`} 
                                    alt="damage" 
                                    style={{ width: "100%", objectFit: "cover" }} 
                                />
                            </Box>
                        )}
                    </Box>
                  </Popup>
                </Marker>
             )
          ))}
        </MapContainer>
      </Paper>
    </Box>
  );
}
