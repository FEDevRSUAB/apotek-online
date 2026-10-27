<script setup>
import { ref, computed, onMounted } from "vue";
import dayjs from "dayjs";
import { useStore } from "vuex";
import { useRoute } from "vue-router";
import { Loader2, Search } from "lucide-vue-next";
import DataTable from "../../../components/DataTable.vue";
import Alert from "../../../utils/Alert";
import { formatTanggal } from "../../../utils/moment";

const props = defineProps({
  search: String,
});

const store = useStore();
const route = useRoute();
const riwayat = computed(() => store.state.riwayatPel.history || []);
const dataPasien = computed(() => store.state.riwayatPel);
const noKartu = ref("");
const isLoading = ref(false);
const hasFetched = ref(false);

onMounted(async () => {
  if (route.query.search) {
    noKartu.value = route.query.search;
    await fetchRiwayat();
  }
});

const formatDate = (date) => dayjs(date).format("YYYY-MM-DD");
const today = formatDate(new Date());
const sixMonthsAgo = formatDate(dayjs().subtract(6, "month").toDate());

const periodeAwal = ref(sixMonthsAgo);
const periodeAkhir = ref(today);

const minAwal = computed(() =>
  formatDate(dayjs(periodeAkhir.value).subtract(2, "year").toDate()),
);
const maxAwal = computed(() => periodeAkhir.value);
const minAkhir = computed(() => periodeAwal.value);
const maxAkhir = computed(() =>
  formatDate(dayjs(periodeAwal.value).add(2, "year").toDate()),
);

const columns = [
  { text: "NO RESEP", value: "noresep" },
  { text: "TGL PELAYANAN", value: "tglpelayanan" },
  { text: "NO SJP", value: "nosjp" },
  { text: "KODE OBAT", value: "kodeobat" },
  { text: "NAMA OBAT", value: "namaobat" },
  { text: "JML OBAT", value: "jmlobat" },
];

const fetchRiwayat = async () => {
  const nokartu = noKartu.value?.toString().trim();
  if (!nokartu) return Alert.Warn("Nomor Kartu tidak boleh kosong");
  if (!periodeAwal.value) return Alert.Warn("Tanggal awal tidak boleh kosong");
  if (!periodeAkhir.value)
    return Alert.Warn("Tanggal akhir tidak boleh kosong");

  try {
    isLoading.value = true;
    const result = await store.dispatch("RiwayatPelayanan", {
      nokartu,
      tanggal_awal: periodeAwal.value,
      tanggal_akhir: periodeAkhir.value,
    });
    if (result.metaData?.code === "200") {
      hasFetched.value = true;
      Alert.Success(result.metaData?.message || "Data ditemukan");
    } else {
      Alert.Error(result.message || "Terjadi kesalahan");
    }
  } catch (error) {
    Alert.Error(error.message || "Gagal memuat data");
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="max-w-full space-y-4 pb-14">
    <div
      class="w-full mx-auto p-6 bg-white rounded-xl shadow-md border border-slate-100"
    >
      <!-- Form -->
      <form
        @submit.prevent="fetchRiwayat"
        class="flex flex-wrap items-end gap-4 mb-6"
      >
        <div class="flex flex-col">
          <label class="text-xs font-medium text-slate-700 mb-1"
            >No Kartu</label
          >
          <input
            type="text"
            v-model="noKartu"
            placeholder="Masukkan no kartu"
            class="px-3 py-2 border border-slate-300 rounded-md text-xs outline-none w-48"
          />
        </div>

        <div class="flex flex-col">
          <label class="text-xs font-medium text-slate-700 mb-1">Periode</label>
          <div class="flex gap-2">
            <input
              type="date"
              v-model="periodeAwal"
              :min="minAwal"
              :max="maxAwal"
              class="px-3 py-2 border border-slate-300 rounded-md text-xs outline-none w-36"
            />
            <input
              type="date"
              v-model="periodeAkhir"
              :min="minAkhir"
              :max="maxAkhir"
              class="px-3 py-2 border border-slate-300 rounded-md text-xs outline-none w-36"
            />
          </div>
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="flex items-center gap-1.5 px-4 py-2 bg-[#00366b] hover:bg-[#00295a] disabled:opacity-60 text-white text-xs font-semibold rounded-md transition"
        >
          <Loader2 v-if="isLoading" class="w-4 h-4 animate-spin" />
          <Search v-else class="w-4 h-4" />
          Cari
        </button>
      </form>

      <!-- Info Pasien -->
      <div class="mb-4 text-xs text-slate-700 space-y-1">
        <div class="grid grid-cols-[90px_12px_1fr]">
          <span class="font-medium">Nama</span>
          <span>:</span>
          <span>{{ dataPasien?.namapeserta || "-" }}</span>
        </div>

        <div class="grid grid-cols-[90px_12px_1fr]">
          <span class="font-medium">Nomor Kartu</span>
          <span>:</span>
          <span>{{ dataPasien?.nokartu || "-" }}</span>
        </div>

        <div class="grid grid-cols-[90px_12px_1fr]">
          <span class="font-medium">Tgl Lahir</span>
          <span>:</span>
          <span>{{ formatTanggal(dataPasien?.tgllhr) || "-" }}</span>
        </div>
      </div>

      <!-- Warning -->
      <div
        class="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 p-3 mb-6 text-xs rounded-md"
      >
        *) Pelayanan paling lama dapat dicari 2 tahun kebelakang.
      </div>

      <!-- Tabel -->
    </div>

    <DataTable
      v-if="hasFetched"
      :headers="columns"
      :items="riwayat"
      :search-value="search"
      :loading="isLoading"
    />
  </div>
</template>
