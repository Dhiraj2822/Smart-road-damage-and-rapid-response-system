import { Outlet } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  IconButton,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  List as ListIcon,
  Map,
  Assessment,
  Logout,
  Business,
  Engineering,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../store/authSlice";

const drawerWidth = 240;

export default function Layout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/" },
    { text: "Complaints", icon: <ListIcon />, path: "/complaints" },
    { text: "Contractors", icon: <Engineering />, path: "/contractors" },
    { text: "Map View", icon: <Map />, path: "/map" },
    { text: "Analytics", icon: <Assessment />, path: "/analytics" },
  ];

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            SMC Official Dashboard
          </Typography>
          <IconButton
            color="inherit"
            onClick={() => {
              dispatch(logout());
              navigate("/login");
            }}
          >
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" },
        }}
      >
        <Toolbar />
        <List>
          {menuItems.map((item) => (
            <ListItem
              button
              key={item.text}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}