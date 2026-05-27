import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ComplaintManagement from './pages/ComplaintManagement';
import MapView from './pages/MapView';
import Analytics from './pages/Analytics';
import DepartmentManagement from './pages/DepartmentManagement';
import ContractorManagement from './pages/ContractorManagement';

function PrivateRoute({ children }) {
  const { isAuthenticated } = useSelector((state) => state.auth);
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="complaints" element={<PrivateRoute><ComplaintManagement /></PrivateRoute>} />
          <Route path="departments" element={<PrivateRoute><DepartmentManagement /></PrivateRoute>} />
          <Route path="contractors" element={<PrivateRoute><ContractorManagement /></PrivateRoute>} />
          <Route path="map" element={<PrivateRoute><MapView /></PrivateRoute>} />
          <Route path="analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
        </Route>
      </Routes>
      <ToastContainer position="bottom-right" autoClose={3000} />
    </>
  );
}

export default App;
