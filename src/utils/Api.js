import axios from "axios";

const api = axios.create({
  baseURL: "http://192.168.0.110:8001/ws/",
});

const apiRs = axios.create({
  baseURL: "http://192.168.0.110:8001/api/",
});

const apiFarmasi = axios.create({
  baseURL: "http://192.168.0.171:7015/api/",
});

const apiFarmasiV2 = axios.create({
  baseURL: "http://192.168.0.110:8001/api/",
});

const apiEsign = axios.create({
  baseURL: "http://192.168.0.110:8002/api/",
});
export { api, apiRs, apiFarmasi, apiFarmasiV2, apiEsign };
