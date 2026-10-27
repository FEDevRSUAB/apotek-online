<script setup>
import { ref, computed, reactive, onMounted, watch } from "vue";
import { useStore } from "vuex";
import {
  Trash2,
  PencilLine,
  SlidersHorizontal,
  Loader2,
} from "lucide-vue-next";
import DataTable from "../../../components/DataTable.vue";
import ModalInputObat from "../PelayananObat/ModalInput.vue";
import Alert from "../../../utils/Alert";
import { formatTanggal, jenisObatLabel } from "../../../utils/moment";

const props = defineProps({
  search: String,
});

const store = useStore();

const isLoading = ref(false);
const rowsPerPage = ref(25);
const selectedResep = ref(null);
const isLoadingImport = ref("");

const formatTanggalLokal = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getAwalBulanIni = () => {
  const now = new Date();
  return formatTanggalLokal(new Date(now.getFullYear(), now.getMonth(), 1));
};

const getAkhirBulanIni = () => {
  const now = new Date();
  return formatTanggalLokal(new Date(now.getFullYear(), now.getMonth() + 1, 0));
};

const formData = reactive({
  kdppk: "0211A010",
  KdJnsObat: "2",
  JnsTgl: "TGLPELSJP",
  TglMulai: getAwalBulanIni(),
  TglAkhir: getAkhirBulanIni(),
});

const filterState = computed(() => store.state.filter);
const daftarResep = computed(() =>
  Array.isArray(store.state.daftarResep) ? store.state.daftarResep : [],
);

watch(
  () => store.state.filterResep,
  (val) => {
    if (!val || Object.keys(val).length === 0) return;
    Object.assign(formData, {
      kdppk: val.kdppk || "0211A010",
      KdJnsObat: val.KdJnsObat || "2",
      JnsTgl: val.JnsTgl || "TGLPELSJP",
      TglMulai: val.TglMulai || getAwalBulanIni(),
      TglAkhir: val.TglAkhir || getAkhirBulanIni(),
    });
  },
  { immediate: true, deep: true },
);

watch(
  filterState,
  (val) => {
    Object.assign(formData, val);
    applyFilter();
  },
  { deep: true },
);

const applyFilter = async () => {
  store.commit("setFilterResep", { ...formData });
  try {
    isLoading.value = true;
    const result = await store.dispatch("fetchDaftarResep", { ...formData });
    if (result.metaData?.code === "200") {
      Alert.Success(result.metaData.message);
    } else if (result.code === "201") {
      Alert.Error(result.message);
    } else {
      Alert.Error("Gagal mengambil data resep");
    }
  } catch {
    Alert.Error("Terjadi kesalahan saat menyimpan");
  } finally {
    isLoading.value = false;
  }
};

const onTerapkan = () => {
  applyFilter();
};

const inputObat = async (resep) => {
  if (!resep?.NORESEP) return;
  isLoadingImport.value = resep.NORESEP;

  try {
    const resObat = await store.dispatch("daftarObatResep", resep.NOAPOTIK);
    selectedResep.value = {
      ...resep,
      noresep: resep.NORESEP,
      no_apotek: resep.NOAPOTIK,
      no_sep: resep.NOSEP_KUNJUNGAN,
      kd_jenis_obat: resep.KDJNSOBAT,
      kode_jenis_obat: resep.KDJNSOBAT,
      tanggal_resep: resep.TGLRESEP,
      tgl_entry: resep.TGLENTRY,
      tgl_pelayanan: resep.TGLPELRSP,
      apol_resep_id: resep.apol_resep_id ?? resep.apol_id ?? null,
      listObatRaw: resObat.response?.listobat ?? [],
    };
  } catch {
    Alert.Error("Gagal memuat data obat resep");
    selectedResep.value = null;
  } finally {
    isLoadingImport.value = "";
  }
};

const onModalClose = () => {
  selectedResep.value = null;
};

const onModalSaved = () => {
  selectedResep.value = null;
};

const deleteResep = async (resep) => {
  const confirm = await Alert.Confirm({
    title: "Apakah anda yakin?",
    text: "Resep akan dihapus dari daftar.",
    confirmButtonText: "Ya, hapus",
    cancelButtonText: "Batal",
  });
  if (!confirm.isConfirmed) return Alert.Info("Penghapusan dibatalkan");
  if (!resep) return Alert.Error("Data resep tidak ditemukan");

  const payload = {
    nosjp: resep.NOAPOTIK || 0,
    refasalsjp: resep.NOSEP_KUNJUNGAN || "",
    noresep: resep.NORESEP || "",
  };
  try {
    const result = await store.dispatch("deleteResep", payload);
    if (result.metaData?.code === "200") {
      applyFilter();
      Alert.Success(result.metaData.message || "Resep berhasil dihapus");
    } else {
      Alert.Error(result.message || "Gagal menghapus resep");
    }
  } catch (err) {
    Alert.Error("Terjadi kesalahan saat menghapus resep");
    console.error("[DELETE OBAT ERROR]", err);
  }
};

const columns = [
  { text: "NO RESEP", value: "NORESEP" },
  { text: "NO APOTIK", value: "NOAPOTIK" },
  { text: "NO SEP / KUNJUNGAN", value: "NOSEP_KUNJUNGAN" },
  { text: "NO KARTU", value: "NOKARTU" },
  { text: "NAMA", value: "NAMA" },
  { text: "TGL ENTRY", value: "TGLENTRY" },
  { text: "TGL RESEP", value: "TGLRESEP" },
  { text: "TGL PELAYANAN RESP", value: "TGLPELRSP" },
  { text: "KODE JENIS OBAT", value: "KDJNSOBAT" },
  { text: "AKSI", value: "aksi" },
];

onMounted(() => {
  if (filterState.value && Object.keys(filterState.value).length > 0) {
    Object.assign(formData, filterState.value);
  }
  if (!daftarResep.value || daftarResep.value.length === 0) {
    applyFilter();
  }
});
</script>

<template>
  <div class="max-w-full pl-4">
    <!-- Filter -->
    <div
      class="bg-white border border-slate-200 rounded-xl shadow-sm px-4 pt-4 pb-3 mb-4 w-fit"
    >
      <div class="flex flex-wrap items-end gap-3">
        <div class="flex flex-col">
          <label
            class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1"
            >KDPPK</label
          >
          <input
            type="text"
            v-model="formData.kdppk"
            class="bg-white px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:border-blue-400 transition w-32"
          />
        </div>

        <div class="flex flex-col">
          <label
            class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1"
            >Jenis Obat</label
          >
          <select
            v-model="formData.KdJnsObat"
            class="bg-white px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:border-blue-400 transition w-44"
          >
            <option value="1">Obat PRB</option>
            <option value="2">Obat Kronis Blm Stabil</option>
            <option value="3">Obat Kemoterapi</option>
          </select>
        </div>

        <div class="flex flex-col">
          <label
            class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1"
            >Jenis Tanggal</label
          >
          <select
            v-model="formData.JnsTgl"
            class="bg-white px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:border-blue-400 transition w-52"
          >
            <option value="TGLPELSJP">Tanggal Pelayanan SJP</option>
            <option value="TGLRSP">Tanggal Resep</option>
          </select>
        </div>

        <div class="flex flex-col">
          <label
            class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1"
            >Tanggal Pelayanan</label
          >
          <div class="flex gap-2">
            <input
              type="date"
              v-model="formData.TglMulai"
              class="bg-white px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:border-blue-400 transition"
            />
            <input
              type="date"
              v-model="formData.TglAkhir"
              class="bg-white px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:border-blue-400 transition"
            />
          </div>
        </div>

        <button
          :disabled="isLoading"
          @click="onTerapkan"
          class="flex items-center gap-1.5 px-3 py-1.5 bg-[#00366b] hover:bg-[#00295a] disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition self-end"
        >
          <Loader2 v-if="isLoading" class="w-3.5 h-3.5 animate-spin" />
          <SlidersHorizontal v-else class="w-3.5 h-3.5" />
          Terapkan
        </button>
      </div>
    </div>

    <!-- Tabel -->
    <div class="pb-14">
      <DataTable
        :headers="columns"
        :items="daftarResep"
        :search-value="search"
        :loading="isLoading"
        :no-sort-keys="['aksi']"
        :rows-per-page-options="[10, 25, 50, 100]"
        :rows-per-page="rowsPerPage"
        alternating
        is-header
      >
        <template #item-NORESEP="row">
          <div class="flex items-center gap-2 whitespace-nowrap">
            <span>{{ row.NORESEP }}</span>
            <span
              v-if="row.FLAGITER === 'True'"
              class="inline-block w-2 h-2 rounded-full bg-red-500"
              title="Resep Iterasi"
            />
          </div>
        </template>

        <template #item-TGLENTRY="row">
          <span class="whitespace-nowrap">{{
            formatTanggal(row.TGLENTRY)
          }}</span>
        </template>

        <template #item-TGLRESEP="row">
          <span class="whitespace-nowrap">{{
            formatTanggal(row.TGLRESEP)
          }}</span>
        </template>

        <template #item-TGLPELRSP="row">
          <span class="whitespace-nowrap">{{
            formatTanggal(row.TGLPELRSP)
          }}</span>
        </template>

        <template #item-KDJNSOBAT="row">
          <span class="whitespace-nowrap">{{
            jenisObatLabel(row.KDJNSOBAT)
          }}</span>
        </template>

        <template #item-aksi="row">
          <div class="flex items-center gap-3">
            <button
              @click="inputObat(row)"
              :disabled="isLoadingImport === row.NORESEP"
              class="text-[#00366b] hover:text-[#0a529b] hover:scale-110 transition-transform duration-200 disabled:opacity-40 disabled:cursor-wait"
              title="Input Obat"
            >
              <PencilLine class="w-4 h-4" />
            </button>
            <button
              @click="deleteResep(row)"
              class="text-slate-400 hover:text-red-600 hover:scale-110 transition-transform duration-200"
              title="Hapus Resep"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </template>
      </DataTable>

      <ModalInputObat
        v-if="selectedResep"
        :resep="selectedResep"
        :import-data="importData"
        @close="onModalClose"
        @saved="onModalSaved"
      />
    </div>
  </div>
</template>
