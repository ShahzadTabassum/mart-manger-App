import axios from "axios";
const API = axios.create({ baseURL: "http://localhost:8000" });
API.interceptors.request.use(config => {
  const token = localStorage.getItem("shop_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export const shopRegister        = (data)  => API.post("/shop/auth/register", data);
export const shopLogin           = (data)  => API.post("/shop/auth/login", data);
export const shopGetMe           = ()      => API.get("/shop/auth/me");
export const getShopProducts     = (params)=> API.get("/shop/products/", { params });
export const getShopProduct      = (id)    => API.get(`/shop/products/${id}`);
export const getShopCategories   = ()      => API.get("/shop/products/categories");
export const getFeaturedProducts = ()      => API.get("/shop/products/featured");
export const placeOrder          = (data)  => API.post("/shop/orders/", data);
export const trackOrder          = (num)   => API.get(`/shop/orders/track/${num}`);
export const getMyOrders         = ()      => API.get("/shop/orders/my-orders");
