import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_WS_BASE_URL,
});

const apiRs = axios.create({
  baseURL: import.meta.env.VITE_API_RS_BASE_URL,
});

const apiFarmasi = axios.create({
  baseURL: import.meta.env.VITE_API_FARMASI_BASE_URL,
});

const apiFarmasiV2 = axios.create({
  baseURL: import.meta.env.VITE_API_FARMASI_V2_BASE_URL,
});

const apiEsign = axios.create({
  baseURL: import.meta.env.VITE_API_ESIGN_BASE_URL,
});
export { api, apiRs, apiFarmasi, apiFarmasiV2, apiEsign };
