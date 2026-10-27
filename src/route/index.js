import { createRouter, createWebHistory } from "vue-router";
import Dashboard from "../pages/Dashboard.vue";
import DaftarResep from "../views/RekamObat/DaftarResep/index.vue"
import Obat from "../views/RekamObat/DaftarResep/Obat.vue";
import ReferensiObat from "../views/Referensi/ReferensiObat/index.vue"
import Login from "../pages/Login.vue";
import RiwayatPasien from "../views/Referensi/RiwayatPelayanan/index.vue"
import Monitoring from "../views/Monitoring/index.vue"
import Faskes from "../views/Referensi/ReferensiFaskes/index.vue"
import Spesialis from "../views/Referensi/ReferensiSpesialis/index.vue"
import Apotek from "../views/Referensi/ReferensiApotek/index.vue"
import Poli from "../views/Referensi/ReferensiPoli/index.vue"
import Pelayanan from "../views/RekamObat/PelayananObat/index.vue"
import Daftar from "../views/RekamObat/PelayananObat/Daftar.vue";
import index from "../views/index.vue";

const routes = [
  {
    path: "/",
    component: Dashboard, 
    children: [
      {
        path: "/",
        components: {
          main: DaftarResep
        }
      },
      {
        path: "/pelayanan-obat",
        components: {
          main: Pelayanan,
          side: Daftar
        }
      },
      {
        path: "/daftar-resep-masuk",
        components: {
          main: DaftarResep,
          // side: Obat
        },
      },
      {
        path : "/referensi-obat",
        components : {
          main : ReferensiObat
        }
      },
      {
        path: "/riwayat-pelayanan",
        components: {
          main: RiwayatPasien
        }
      },
      {
        path: "/monitoring",
        components: {
          main: Monitoring
        }
      },
      {
        path: "/faskes",
        components: {
          main: Faskes
        }
      },
      {
        path: "/spesialis",
        components: {
          main: Spesialis
        }
      },
      {
        path: "/apotek",
        components: {
          main: Apotek
        }
      },
      {
        path: "/poli",
        components: {
          main: Poli
        }
      }

    ],
  },
  {
    path: "/login",
    component: Login,}
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
