import axios from "axios";
const API = axios.create({ baseURL: "http://localhost:8000" });
export const getEmployees   = ()       => API.get("/employees/");
export const createEmployee = (data)   => API.post("/employees/", data);
export const updateEmployee = (id,data)=> API.put(`/employees/${id}`, data);
export const deleteEmployee = (id)     => API.delete(`/employees/${id}`);
export const verifyPin      = (pin)    => API.post("/employees/verify-pin", { pin });
