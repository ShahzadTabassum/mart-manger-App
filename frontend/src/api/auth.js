import axios from "axios";

const API = axios.create({ baseURL: "http://127.0.0.1:8000" });

API.interceptors.request.use(config => {
  const token = localStorage.getItem("mm_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const login        = (data)        => API.post("/auth/login", data);
export const getMe        = ()            => API.get("/auth/me");
export const getUsers     = ()            => API.get("/auth/users");
export const createUser   = (data)        => API.post("/auth/users", data);
export const updateUser   = (id, data)    => API.put(`/auth/users/${id}`, data);
export const deleteUser   = (id)          => API.delete(`/auth/users/${id}`);
export const changePassword = (data)      => API.post("/auth/change-password", data);
export const forgotPassword = (data) =>
  API.post("/auth/forgot-password", data);
export const resendResetOTP = (data) =>
  API.post("/auth/resend-reset-otp", data);

export const verifyResetOTP = (data) =>
  API.post("/auth/verify-reset-otp", data);
export default API;
