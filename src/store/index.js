import { createStore } from "vuex";
import createPersistedState from "vuex-persistedstate";
import axios from "axios";
import { api, apiEsign, apiRs, apiFarmasi, apiFarmasiV2 } from "../utils/Api";

const store = createStore({
  // plugins: [
  //   createPersistedState({
  //     key: "apotek-online",
  //     storage: window.localStorage,
  //   }),
  // ],
  state: () => ({
    loading: false,
    error: null,
    allPasien: [],
    pasienData: [],
    sepPdf: null,
    resepPdf: null,
    billing: null,
    penyerahanStatus: null,
    klaimDokumenUrl: null,
    referensiObat: [],
    detailSep: [],
    filter: [],
    filterResep: {},
    riwayatPel: [],
    faskes: [],
    spesialis: [],
    apotek: [],
    poli: [],
    daftarResep: [],
    obat: [],
    listObat: [],
    dataMonitoring: [],
    selectedResep: {},
    pxid: localStorage.getItem("pxid")?.trim() || "0",
  }),

  mutations: {
    setLoading(state, loading) {
      state.loading = loading;
    },
    setError(state, error) {
      state.error = error;
    },

    setSelectedResep(state, resep) {
      state.selectedResep = resep;
    },
    setFilter(state, payload) {
      state.filter = payload;
    },
    setAllPasien(state, payload) {
      state.allPasien = payload;
    },
    setPasienData(state, payload) {
      state.pasienData = payload;
    },
    setSepPdf(state, payload) {
      state.sepPdf = payload;
    },
    setResepPdf(state, payload) {
      state.resepPdf = payload;
    },
    setBilling(state, payload) {
      state.billing = payload;
    },
    setPenyerahanStatus(state, payload) {
      state.penyerahanStatus = payload;
    },
    setKlaimDokumenUrl(state, payload) {
      state.klaimDokumenUrl = payload;
    },
    setReferensiObat(state, payload) {
      state.referensiObat = payload;
    },
    setDetailSep(state, payload) {
      state.detailSep = payload;
    },
    setRiwayatPel(state, payload) {
      state.riwayatPel = payload;
    },
    setFaskes(state, payload) {
      state.faskes = payload;
    },
    setSpesialis(state, payload) {
      state.spesialis = payload;
    },
    setApotek(state, payload) {
      state.apotek = payload;
    },
    setPoli(state, payload) {
      state.poli = payload;
    },
    setDaftarResep(state, payload) {
      state.daftarResep = payload;
    },
    setObat(state, payload) {
      state.obat = payload;
    },
    setList(state, payload) {
      state.listObat = payload;
    },
    setFilterResep(state, payload) {
      state.filterResep = payload;
    },
    setDaftarMonitoring(state, payload) {
      state.dataMonitoring = payload;
    },
    set_pxid(state, val) {
      state.pxid = val;
      localStorage.setItem("pxid", val);
    },
  },

  actions: {
    setPxid({ commit }, val) {
      commit("set_pxid", val);
    },
    async fetchAllPasien({ commit }, tanggal) {
      commit("setLoading", true);
      commit("setError", null);
      try {
        const response = await apiFarmasiV2.get("list-pasien", {
          params: { tanggal: tanggal },
        });
        commit("setAllPasien", response.data);
      } catch (error) {
        commit("setError", error.response?.data?.message || error.message);
      } finally {
        commit("setLoading", false);
      }
    },

    async fetchPasienData({ commit }, id) {
      commit("setError", null);
      try {
        const response = await apiFarmasiV2.get("list-pasien-by-id", {
          params: { pxid: id },
        });
        const cleanData = Array.isArray(response.data)
          ? response.data.filter(Boolean)
          : [];
        commit("setPasienData", cleanData);
        return response.data;
      } catch (error) {
        commit("setPasienData", []);
        commit("setError", error.response?.data?.message || error.message);
      }
    },

    async generateSEP({ commit }, pxid) {
      try {
        const response = await apiFarmasi.get(`dokumen/sep?pxid=${pxid}`);
        commit("setSepPdf", response.data);
        return response.data;
      } catch (error) {
        commit("setError", "Gagal membuat SEP: " + error.message);
      }
    },

    async generateResep({ commit }, pxid) {
      try {
        const response = await apiFarmasi.get(
          `dokumen/resep-farmasi?pxid=${pxid}`,
        );
        commit("setResepPdf", response.data);
        return response.data;
      } catch (error) {
        commit("setError", "Gagal membuat resep: " + error.message);
      }
    },
    async billingFarmasi({ commit }, pxid) {
      try {
        const response = await apiFarmasi.get(
          `dokumen/billing-farmasi?pxid=${pxid}`,
        );
        commit("setBilling", response.data);
        return response.data;
      } catch (error) {
        commit("setError", "Gagal membuat billing farmasi: " + error.message);
      }
    },

    async cekPenyerahanObat({ commit }, pxid) {
      try {
        const response = await apiFarmasi.get("dokumen/serah-obat", {
          params: { pxid },
        });
        commit("setPenyerahanStatus", response.data);
        return response.data;
      } catch (error) {
        commit("setError", "Gagal cek penyerahan obat: " + error.message);
        return (
          error.response?.data || { status: "error", message: error.message }
        );
      }
    },
    async fetchKlaimDokumen({ commit }, { pxid }) {
      try {
        if (!pxid) throw new Error("pxid tidak boleh kosong");

        const response = await apiFarmasi.get("dokumen/dokumen-klaim-farmasi", {
          params: { pxid },
          responseType: "blob",
        });
        commit("setKlaimDokumenData", response.data);
        return response.data;
      } catch (error) {
        commit("setKlaimDokumenData", null);
        commit("setError", "Gagal ambil dokumen klaim: " + error.message);
        return null;
      }
    },

    async fetchSEPList({ commit }, norm) {
      try {
        const response = await apiFarmasiV2.get(`riwayat-sep?norm=${norm}`);
        return response.data;
      } catch (error) {
        throw new Error("Gagal fetch SEP list: " + error.message);
      }
    },

    async insertSEP(_, payload) {
      try {
        const response = await apiFarmasiV2.post("insert-sep", payload);
        return response.data;
      } catch (error) {
        console.log(error);
        throw error;
      }
    },

    async fetchSEP({ commit }, nomor_kunjungan) {
      commit("setLoading", true);
      commit("setError", null);

      try {
        const response = await api.get("apotek/utils/cari-sep", {
          params: { nomor_kunjungan },
        });

        const data = response.data?.response || {};
        const bpjsData = Array.isArray(data?.riwayat_bpjs)
          ? data.riwayat_bpjs
          : [];
        const rsData = Array.isArray(data?.riwayat) ? data.riwayat : [];

        const rsMap = new Map(rsData.map((item) => [item.no_apotek, item]));
        bpjsData.forEach((item) => {
          if (!rsMap.has(item.no_apotek)) rsMap.set(item.no_apotek, item);
        });

        commit("setDetailSep", [...rsMap.values()]);
        return response.data;
      } catch (error) {
        commit("setApotek", []);
        commit("setError", error.message);
      } finally {
        commit("setLoading", false);
      }
    },

    async importResep(_, pxid) {
      try {
        const response = await apiRs.get(`farmasi/import-resep?pxid=${pxid}`);
        return response.data;
      } catch (error) {
        console.log(error);
        throw error;
      }
    },

    async daftarObatResep(_, nomor_kunjungan) {
      try {
        const response = await api.get(
          `apotek/pelayanan-obat/daftar-pelayanan-obat?nomor_kunjungan=${nomor_kunjungan}`,
        );
        return response.data;
      } catch (error) {
        console.log(error);
        throw error;
      }
    },

    async getNoResep(_) {
      try {
        const response = await apiRs.get("farmasi/get-noresep");
        return response.data;
      } catch (error) {
        console.log(error);
        throw error;
      }
    },

    async upsertResep(_, payload) {
      try {
        const response = await apiRs.post("farmasi/upsert-resep", payload);
        return response.data;
      } catch (error) {
        console.log(error);
        throw error;
      }
    },

    async insertObatNonRacikan(_, payload) {
      try {
        const response = await api.post(
          "apotek/obat/obat-non-racikan",
          payload,
        );
        return response.data;
      } catch (error) {
        console.log(error);
        throw error;
      }
    },

    async insertObatRacikan(_, payload) {
      try {
        const response = await api.post("apotek/obat/obat-racikan", payload);
        return response.data;
      } catch (error) {
        console.log(error);
        throw error;
      }
    },

    async insertEsign(_, payload) {
      try {
        const response = await apiEsign.post(
          "dokumen/serah-obat-insert",
          payload,
          {
            responseType: "blob",
          },
        );

        const contentType = response.headers?.["content-type"] || "";

        if (contentType.includes("application/json")) {
          const text = await response.data.text();
          const json = JSON.parse(text);
          throw new Error(
            json?.response || json?.message || "Gagal menyimpan tanda tangan",
          );
        }

        return response.data;
      } catch (error) {
        console.log(error);
        throw error;
      }
    },

    async findObatRS(_, nama) {
      try {
        const response = await apiRs.get(`farmasi/cari-obat?obat=${nama}`);
        return response.data;
      } catch (error) {
        console.log(error);
        throw error;
      }
    },

    //Resep
    async SimpanResep({ commit }, payload) {
      commit("setError", null);

      try {
        const response = await api.post("apotek/resep/simpan-resep", payload);
        return response.data;
      } catch (error) {
        const errMsg = error.response?.data?.message || error.message;
        commit("setError", errMsg);
      }
    },

    async fetchDaftarResep({ commit }, payload) {
      commit("setError", null);
      try {
        const response = await api.post("apotek/resep/daftar-resep", payload);
        commit("setDaftarResep", response.data.response);
        return response.data;
      } catch (error) {
        commit("setDaftarResep", []);
        commit("setError", error.message);
        console.error("Gagal fetch daftar resep:", error);
      }
    },
    async deleteResep({ commit }, payload) {
      commit("setError", null);
      try {
        const response = await api.delete("apotek/resep/hapus-resep", {
          params: payload,
        });
        return response.data;
      } catch (error) {
        const errMsg = error.response?.data?.message || error.message;
        commit("setError", errMsg);
        return {
          code: error.response?.data?.code || "500",
          message: errMsg,
        };
      }
    },

    //Referensi
    async fetchReferensiObat({ commit }) {
      commit("setError", null);
      try {
        const response = await api.get("apotek/referensi/dpho");
        commit("setReferensiObat", response.data?.response?.list || []);
        return response.data;
      } catch (error) {
        commit("setApotek", []);
        commit("setError", error.message);
        console.error("Gagal fetch Obat:", error);
      }
    },

    async RiwayatPelayanan({ commit }, params) {
      commit("setLoading", true);
      commit("setError", null);

      try {
        const response = await api.get(
          "apotek/pelayanan-obat/riwayat-pelayanan-obat",
          {
            params,
          },
        );
        commit("setRiwayatPel", response.data?.response?.list || []);
        return response.data;
      } catch (error) {
        commit("setRiwayatPel", []);
        commit("setError", error.message);
      } finally {
        commit("setLoading", false);
      }
    },

    async cariFaskes({ commit }, params) {
      commit("setError", null);
      try {
        const response = await api.get("apotek/referensi/fasilitas-kesehatan", {
          params,
        });
        commit("setFaskes", response.data?.response?.list || []);
        return response.data;
      } catch (error) {
        commit("setFaskes", []);
        commit("setError", error.message);
      }
    },

    async fetchSpesialis({ commit }) {
      commit("setError", "");

      try {
        const response = await api.get("apotek/referensi/spesialistik");
        commit("setSpesialis", response.data?.response?.list || []);
        return response.data;
      } catch (error) {
        commit("setSpesialis", []);
        commit("setError", error.message);
        console.error("Gagal fetch spesialis:", error);
      }
    },

    async fetchApotek({ commit }, params) {
      commit("setError", null);
      try {
        const response = await api.get("apotek/referensi/setting-apotek", {
          params,
        });
        commit("setApotek", response.data?.response || {});
        return response.data;
      } catch (error) {
        commit("setApotek", []);
        commit("setError", error.message);
        console.error("Gagal fetch apotek:", error);
      }
    },

    async fetchPoli({ commit }, params) {
      commit("setError", null);

      try {
        const response = await api.get("apotek/referensi/poli", {
          params,
        });
        commit("setPoli", response.data?.response?.list || []);
        return response.data;
      } catch (error) {
        commit("setApotek", []);
        commit("setError", error.message);
        console.error("Gagal fetch poli:", error);
      }
    },

    updateFilter({ commit }, payload) {
      commit("setFilter", payload);
    },

    // Obat
    async findObat({ commit }, payload) {
      commit("setError", null);
      try {
        const response = await api.get("apotek/referensi/obat", {
          params: payload,
        });
        commit("setObat", response.data?.response?.list || []);
        return response.data;
      } catch (error) {
        commit("setObat", []);
        commit("setError", error.message);
      }
    },
    async SimpanObatNon({ commit }, payload) {
      commit("setError", null);
      try {
        const response = await api.post(
          "apotek/obat/obat-non-racikan",
          payload,
        );
        return response.data;
      } catch (error) {
        const errMsg = error.response?.data?.message || error.message;
        commit("setError", errMsg);
      }
    },
    async SimpanObatRacikan({ commit }, payload) {
      commit("setError", null);
      try {
        const response = await api.post("apotek/obat/obat-racikan", payload);
        return response.data;
      } catch (error) {
        const errMsg = error.response?.data?.message || error.message;
        commit("setError", errMsg);
      }
    },
    async findListObat({ commit }, payload) {
      commit("setError", null);
      try {
        const response = await api.get(
          "apotek/pelayanan-obat/daftar-pelayanan-obat",
          { params: payload },
        );
        commit("setList", response.data?.response || []);
        return response.data;
      } catch (error) {
        commit("setList", []);
        commit("setError", error.message);
      }
    },
    async deleteObat({ commit }, payload) {
      commit("setError", null);
      try {
        const response = await api.delete(
          "apotek/pelayanan-obat/hapus-pelayanan-obat",
          { data: payload },
        );
        return response.data;
      } catch (error) {
        const errMsg = error.response?.data?.message || error.message;
        commit("setError", errMsg);
        return {
          code: error.response?.data?.code || "500",
          message: errMsg,
        };
      }
    },

    //Klaim Monitoring
    async fetchMonitoring({ commit }, payload) {
      try {
        const response = await api.get("apotek/utils/monitoring", {
          params: payload,
        });
        commit("setDaftarMonitoring", response.data?.response?.listsep || []);
        return response.data;
      } catch (error) {
        const errMsg = error.response?.data?.message || error.message;
        commit("setError", errMsg);
      }
    },
  },
});

export default store;
