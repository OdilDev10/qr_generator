import axios from "axios";
const { VITE_DEV_URL, VITE_PRODUCTION_URL, VITE_DEBUG } = import.meta.env;
const URL_PETICION = VITE_DEBUG == "true" ? VITE_DEV_URL : VITE_PRODUCTION_URL;

const getToken = () => `Bearer ${localStorage.getItem("access_token")}` || "";

const peticion = axios.create({
  baseURL: URL_PETICION,
  headers: {
    Authorization: `${getToken()}`,
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export default peticion;
