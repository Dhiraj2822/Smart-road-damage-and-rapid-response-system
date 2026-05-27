import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const api = axios.create({ baseURL: API_URL, headers: { "Content-Type": "application/json" } });

api.interceptors.request.use(config => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = "Bearer " + token;
    return config;
}, error => Promise.reject(error));

api.interceptors.response.use(response => response, error => {
    if (error.response && error.response.status === 401 && !window.location.pathname.includes("/login")) {
      localStorage.removeItem("token"); localStorage.removeItem("user"); window.location.href = "/login";
    }
    return Promise.reject(error);
});

export const authAPI = {
  login: (credentials) => api.post("/auth/login/official", credentials),
  logout: () => { localStorage.removeItem("token"); localStorage.removeItem("user"); window.location.href = "/login"; },
};

export const complaintAPI = {
  getAll: (params) => api.get("/complaints", { params }),
  getById: (id) => api.get(`/complaints/${id}`),
  updateStatus: (id, status, comments) => api.put(`/complaints/${id}/status`, { status, comments }),
  verify: (id, data) => api.put(`/complaints/${id}/verify`, data), // Updated signature
  assign: (id, assignedToId, departmentId) => api.put(`/complaints/${id}/assign`, { assignedToId, departmentId }),
  reject: (id, reason) => api.put(`/complaints/${id}/reject`, { reason }),
  getHistory: (id) => api.get(`/complaints/${id}/history`),
};

export const contractorAPI = {
  getAll: () => api.get("/contractors"),
  getById: (id) => api.get(`/contractors/${id}`),
  create: (data) => api.post("/contractors", data),
  update: (id, data) => api.put(`/contractors/${id}`, data),
  assignWorkOrder: (data) => api.post("/contractors/assign", data),
  delete: (id) => api.delete(`/contractors/${id}`),
  getMyOrders: () => api.get("/contractor/my-orders"),
  completeOrder: (id, data) => api.post(`/contractor/orders/${id}/complete`, data),
};

export const departmentAPI = {
  getAll: () => api.get("/departments"),
  create: (data) => api.post("/departments", data),
  update: (id, data) => api.put(`/departments/${id}`, data),
};

export default api;
