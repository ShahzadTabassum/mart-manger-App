import axios from "axios";
const API = axios.create({ baseURL: "http://localhost:8000" });
export const createSale     = (data)   => API.post("/sales/", data);
export const getSales       = (params) => API.get("/sales/", { params });
export const getSale        = (id)     => API.get(`/sales/${id}`);
export const getDailyReport = ()       => API.get("/sales/report/daily");
export const getTopProducts = ()       => API.get("/sales/report/top-products");
