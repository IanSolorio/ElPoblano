import axios from "axios";

const API_URL = import.meta.env.VITE_ENDPOINT_BASE || "http://localhost:3000/api";
export const fetchActivePromotions = async () => (await axios.get(`${API_URL}/promociones`, { withCredentials: true })).data;
