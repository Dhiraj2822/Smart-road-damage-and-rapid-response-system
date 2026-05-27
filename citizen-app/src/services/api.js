import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = "Bearer " + token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  getProfile: () => api.get("/auth/me"),
  updateProfile: (data) => api.put("/auth/me", data),
};

// Complaint APIs
export const complaintAPI = {
  create: (formData) => {
    // Always use multipart/form-data for complaints (images required)
    return api.post("/complaints", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  getAll: (params) => api.get("/complaints", { params }),
  getMy: (params) => api.get("/complaints/my-complaints", { params }),
  getById: (id) => api.get("/complaints/" + id),
  getHistory: (id) => api.get("/complaints/" + id + "/history"),
};

export default api;
