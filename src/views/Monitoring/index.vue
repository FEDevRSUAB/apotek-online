<script setup>
import { ref, computed } from "vue";
import { useStore } from "vuex";
import { SlidersHorizontal, ShieldCheck, Loader2 } from "lucide-vue-next";
import DataTable from "../../components/DataTable.vue";
import Alert from "../../utils/Alert";
import ExportExcel from "../../components/ExportExcel.vue";

const props = defineProps({
  search: String,
  collapsedMain: Boolean,
});

const store = useStore();
const data = computed(() => store.state.dataMonitoring || []);
const isLoading = ref(false);
const isVerifLoading = ref(false);
const hasFetched = ref(false);

const selectedBulan = ref(String(new Date().getMonth() + 1).padStart(2, "0"));
const selectedTahun = ref(String(new Date().getFullYear()));
const jnsobat = ref("2");
const status = ref("0");

const selectedRows = ref([]);

const currentPage = ref(1);
const rowsPerPage = ref(25);

const totalByTag = ref("");
const totalByVerif = ref("");
const totalResep = ref("");

const bulanOptions = [
  { label: "Januari", value: "01" },
  { label: "Februari", value: "02" },
  { label: "Maret", value: "03" },
  { label: "April", value: "04" },
  { label: "Mei", value: "05" },
  { label: "Juni", value: "06" },
  { label: "Juli", value: "07" },
  { label: "Agustus", value: "08" },
  { label: "September", value: "09" },
  { label: "Oktober", value: "10" },
  { label: "November", value: "11" },
  { label: "Desember", value: "12" },
];

const columns = [
  { text: "NO. SEP APOTIK", value: "nosepapotek" },
  { text: "REF ASAL SEP", value: "nosepaasal" },
  { text: "NAMA", value: "nmpst" },
  { text: "NO. RESEP", value: "noresep" },
  { text: "JENIS OBAT", value: "nmjnsobat" },
  { text: "BIAYA PENGAJUAN", value: "biayapengajuan" },
  { text: "BIAYA DISETUJUI", value: "biayasetujui" },
];

const formatRupiah = (value) => {
  const num = Number(value);
  if (isNaN(num)) return "-";
  return "Rp " + num.toLocaleString("id-ID");
};

const fetchDaftarMonitoring = async (page = 1) => {
  try {
    isLoading.value = true;
    selectedRows.value = [];

    const result = await store.dispatch("fetchMonitoring", {
      bulan: selectedBulan.value,
      tahun: selectedTahun.value,
      jenis_obat: jnsobat.value,
      status: status.value,
      page,
      limit: rowsPerPage.value,
    });

    if (result?.metaData?.code == "200") {
      hasFetched.value = true;
      totalResep.value = result?.response?.jumlahdata ?? data.value.length;
      totalByTag.value = result?.response?.totalbiayapengajuan ?? "";
      totalByVerif.value = result?.response?.totalbiayasetuju ?? "";
      Alert.Success(result?.metaData?.message || "Data berhasil dimuat");
    } else {
      Alert.Error(
        result?.metaData?.message || "Gagal mengambil data monitoring",
      );
    }
  } catch (error) {
    console.error("[FETCH MONITORING] Error:", error);
    Alert.Error("Gagal memuat data");
  } finally {
    isLoading.value = false;
  }
};

const onTerapkan = () => {
  currentPage.value = 1;
  fetchDaftarMonitoring(1);
};

const onPageChange = (page) => {
  currentPage.value = page;
  fetchDaftarMonitoring(page);
};

const onRowsPerPageChange = (limit) => {
  rowsPerPage.value = limit;
  currentPage.value = 1;
  fetchDaftarMonitoring(1);
};

const handleVerif = async () => {
  if (selectedRows.value.length === 0) return;

  const confirm = await Alert.Confirm({
    title: `Verifikasi ${selectedRows.value.length} data?`,
    text: "Data yang dipilih akan diverifikasi sekaligus.",
    confirmButtonText: "Ya, verifikasi",
    cancelButtonText: "Batal",
  });
  if (!confirm.isConfirmed) return;

  try {
    isVerifLoading.value = true;
    const payload = selectedRows.value.map((r) => r.nosepapotek);
    const result = await store.dispatch("verifikasiMonitoringBulk", payload);

    if (result?.metaData?.code == "200") {
      Alert.Success(result?.metaData?.message || "Verifikasi berhasil");
      selectedRows.value = [];
      fetchDaftarMonitoring(currentPage.value);
    } else {
      Alert.Error(result?.metaData?.message || "Gagal verifikasi");
    }
  } catch (err) {
    console.error("[BULK VERIFY] Error:", err);
    Alert.Error("Terjadi kesalahan saat verifikasi");
  } finally {
    isVerifLoading.value = false;
  }
};
</script>

<template>
  <div class="w-full">
    <div class="flex flex-wrap items-start gap-4 mb-4">
      <!-- Filter -->
      <div
        class="bg-white border border-slate-200 rounded-xl shadow-sm px-4 pt-4 pb-3 w-fit flex flex-col gap-3"
      >
        <div class="flex flex-wrap items-end gap-3">
          <div class="flex flex-col">
            <label
              class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1"
            >
              Bulan
            </label>
            <select
              v-model="selectedBulan"
              class="bg-white px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:border-blue-400 transition w-32"
            >
              <option v-for="b in bulanOptions" :key="b.value" :value="b.value">
                {{ b.label }}
              </option>
            </select>
          </div>

          <div class="flex flex-col">
            <label
              class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1"
            >
              Tahun
            </label>
            <input
              type="number"
              v-model="selectedTahun"
              class="bg-white px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:border-blue-400 transition w-24"
            />
          </div>

          <div class="flex flex-col">
            <label
              class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1"
            >
              Jenis Obat
            </label>
            <select
              v-model="jnsobat"
              class="bg-white px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:border-blue-400 transition w-36"
            >
              <option value="0">Semua</option>
              <option value="1">PRB</option>
              <option value="2">Kronis</option>
              <option value="3">Kemoterapi</option>
            </select>
          </div>

          <div class="flex flex-col">
            <label
              class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1"
            >
              Status
            </label>
            <select
              v-model="status"
              class="bg-white px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:border-blue-400 transition w-36"
            >
              <option value="0">Belum Verifikasi</option>
              <option value="1">Verifikasi</option>
            </select>
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

          <!-- Export Excel -->
          <ExportExcel
            v-if="hasFetched"
            :columns="columns"
            :data="data"
            :file-name="`monitoring-${selectedBulan}-${selectedTahun}.xlsx`"
            sheet-name="Monitoring"
            class="ml-auto self-end"
          />
        </div>
      </div>

      <!-- Summary Cards -->
      <div v-if="hasFetched" class="flex flex-wrap gap-3 ml-4">
        <div
          class="bg-white border border-slate-200 rounded-xl shadow-sm px-4 py-3"
        >
          <p
            class="text-[10px] font-semibold uppercase tracking-wider text-slate-400"
          >
            Total Resep
          </p>
          <p class="text-lg font-bold text-slate-800 mt-1">
            {{ totalResep }}
          </p>
        </div>

        <div
          class="bg-white border border-slate-200 rounded-xl shadow-sm px-4 py-3"
        >
          <p
            class="text-[10px] font-semibold uppercase tracking-wider text-slate-400"
          >
            Total Biaya Pengajuan
          </p>
          <p class="text-lg font-bold text-slate-800 mt-1">
            {{ formatRupiah(totalByTag) }}
          </p>
        </div>

        <div
          class="bg-white border border-slate-200 rounded-xl shadow-sm px-4 py-3"
        >
          <p
            class="text-[10px] font-semibold uppercase tracking-wider text-slate-400"
          >
            Total Biaya Disetujui
          </p>
          <p class="text-lg font-bold text-emerald-600 mt-1">
            {{ formatRupiah(totalByVerif) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Tabel -->
    <div v-if="!props.collapsedMain" class="pb-14">
      <DataTable
        v-if="hasFetched"
        :headers="columns"
        :items="data"
        :search-value="search"
        :loading="isLoading"
        :no-sort-keys="['verifikasi']"
        alternating
      >
      </DataTable>

      <div
        v-else
        class="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col items-center justify-center gap-2 py-10 text-slate-400"
      >
        <SlidersHorizontal class="w-8 h-8" />
        <span class="text-xs">Pilih filter lalu klik Terapkan</span>
      </div>
    </div>
  </div>
</template>
