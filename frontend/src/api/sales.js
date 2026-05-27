import axios from "axios";
const API = axios.create({ baseURL: "http://localhost:8000" });
API.interceptors.request.use(config => {
  const token = localStorage.getItem("mm_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export const createSale        = (data)   => API.post("/sales/", data);
export const getSales          = (params) => API.get("/sales/", { params });
export const getSale           = (id)     => API.get(`/sales/${id}`);
export const getDailyReport    = ()       => API.get("/sales/report/daily");
export const getTopProducts    = ()       => API.get("/sales/report/top-products");
export const getDashboardStats = ()       => API.get("/sales/report/dashboard-stats");
