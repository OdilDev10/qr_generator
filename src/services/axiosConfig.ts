import axios from "axios";
const { VITE_DEV_URL, VITE_PRODUCTION_URL, VITE_DEBUG } = import.meta.env;

const getToken = () => `Bearer ${localStorage.getItem("access_token")}` || "";
const URL_PETICION = VITE_DEBUG == "true" ? VITE_DEV_URL : VITE_PRODUCTION_URL;
console.log(
  VITE_DEBUG,
  "VITE_DEBUG",
  URL_PETICION,
  "URL_PETICION",
  VITE_DEV_URL,
  "VITE_DEV_URL",
  VITE_PRODUCTION_URL,
  "VITE_PRODUCTION_URL"
);
const peticion = axios.create({
  baseURL: URL_PETICION,
  headers: {
    Authorization: `${getToken()}`,
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export default peticion;
