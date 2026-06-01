import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const api = axios.create({ baseURL, timeout: 15000 });

// Surface a clean error message from FastAPI's { detail } payload.
export function apiError(err) {
  const d = err?.response?.data?.detail;
  if (Array.isArray(d)) return d.map((e) => e.msg).join(", ");
  if (typeof d === "string") return d;
  return err?.message || "Something went wrong";
}

export const Products = {
  list: () => api.get("/products").then((r) => r.data),
  create: (body) => api.post("/products", body).then((r) => r.data),
  update: (id, body) => api.put(`/products/${id}`, body).then((r) => r.data),
  remove: (id) => api.delete(`/products/${id}`),
};

export const Customers = {
  list: () => api.get("/customers").then((r) => r.data),
  create: (body) => api.post("/customers", body).then((r) => r.data),
  update: (id, body) => api.put(`/customers/${id}`, body).then((r) => r.data),
  remove: (id) => api.delete(`/customers/${id}`),
};

export const Orders = {
  list: () => api.get("/orders").then((r) => r.data),
  create: (body) => api.post("/orders", body).then((r) => r.data),
  setStatus: (id, status) =>
    api.patch(`/orders/${id}/status`, { status }).then((r) => r.data),
};

export const Dashboard = {
  stats: () => api.get("/dashboard").then((r) => r.data),
};

export default api;
