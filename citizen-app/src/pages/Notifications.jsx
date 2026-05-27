import { useState, useEffect } from "react";
import { Box, Typography, Paper, List, ListItem, ListItemText, ListItemIcon, Chip, CircularProgress, Alert, IconButton, Divider } from "@mui/material";
import { Notifications as NotifIcon, CheckCircle, Info, Warning, Error as ErrorIcon, MarkEmailRead } from "@mui/icons-material";
import api from "../services/api";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get("/notifications/my");
      setNotifications(res.data.notifications || []);
    } catch (err) {
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, readAt: new Date() } : n));
    } catch (err) {
      console.error("Failed to mark as read");
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "VERIFICATION": return <CheckCircle color="success" />;
      case "ASSIGNMENT": return <Info color="info" />;
      case "STATUS_UPDATE": return <Warning color="warning" />;
      case "REJECTION": return <ErrorIcon color="error" />;
      default: return <NotifIcon color="primary" />;
    }
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = (now - d) / 1000 / 60; // minutes
    if (diff < 60) return `${Math.floor(diff)} min ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)} hours ago`;
    return d.toLocaleDateString();
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <NotifIcon /> Notifications
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ mt: 2 }}>
        {notifications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <NotifIcon sx={{ fontSize: 60, color: "grey.400", mb: 2 }} />
            <Typography color="textSecondary">No notifications yet</Typography>
            <Typography variant="body2" color="textSecondary">
              You'll receive updates here when your complaints are processed
            </Typography>
          </Box>
        ) : (
          <List>
            {notifications.map((notif, index) => (
              <Box key={notif.id}>
                <ListItem
                  sx={{
                    bgcolor: notif.readAt ? "transparent" : "action.hover",
                    "&:hover": { bgcolor: "action.selected" }
                  }}
                  secondaryAction={
                    !notif.readAt && (
                      <IconButton edge="end" onClick={() => markAsRead(notif.id)} title="Mark as read">
                        <MarkEmailRead />
                      </IconButton>
                    )
                  }
                >
                  <ListItemIcon>{getIcon(notif.type)}</ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: notif.readAt ? "normal" : "bold" }}>
                          {notif.title}
                        </Typography>
                        {!notif.readAt && <Chip label="New" size="small" color="primary" />}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                          {notif.message}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {formatTime(notif.sentAt || notif.createdAt)}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                {index < notifications.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
}
