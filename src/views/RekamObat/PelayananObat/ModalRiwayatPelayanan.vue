<script setup>
import { ref, computed } from "vue";
import { useStore } from "vuex";
import dayjs from "dayjs";
import { X, Loader2, Pencil, Check, Search } from "lucide-vue-next";
import DataTable from "../../../components/DataTable.vue";
import Alert from "../../../utils/Alert";
import { formatTanggal } from "../../../utils/moment";

const props = defineProps({ show: Boolean, pasienData: Object });
const emit = defineEmits(["close"]);

const store = useStore();

const riwayat = computed(() => store.state.riwayatPel?.history || []);
const dataPasien = computed(() => store.state.riwayatPel);

const noKartu = ref("");
const isLoading = ref(false);
const hasData = ref(false);
const isEditingAwal = ref(false);
const searchObat = ref("");

const formatDate = (date) => dayjs(date).format("YYYY-MM-DD");
const today = formatDate(new Date());
const sixMonthsAgo = formatDate(dayjs().subtract(6, "month").toDate());
const periodeAwal = ref(sixMonthsAgo);
const periodeAkhir = ref(today);

const periodeLabel = computed(
  () =>
    `${formatTanggal(periodeAwal.value)} — ${formatTanggal(periodeAkhir.value)}`,
);

const columns = [
  { text: "NO RESEP", value: "noresep" },
  { text: "TGL PELAYANAN", value: "tglpelayanan" },
  { text: "NO SJP", value: "nosjp" },
  { text: "KODE OBAT", value: "kodeobat" },
  { text: "NAMA OBAT", value: "namaobat" },
  { text: "JML OBAT", value: "jmlobat" },
];

const filteredRiwayat = computed(() => {
  const kw = searchObat.value.trim().toLowerCase();
  const data = kw
    ? riwayat.value.filter((r) => (r.namaobat || "").toLowerCase().includes(kw))
    : riwayat.value;

  return [...data].sort(
    (a, b) => dayjs(b.tglpelayanan).valueOf() - dayjs(a.tglpelayanan).valueOf(),
  );
});

const fetchRiwayat = async () => {
  console.log("data pasien", props.pasienData);
  try {
    isLoading.value = true;
    const result = await store.dispatch("RiwayatPelayanan", {
      nokartu: noKartu.value,
      tanggal_awal: periodeAwal.value,
      tanggal_akhir: periodeAkhir.value,
    });
    if (result.metaData?.code === "200") {
      hasData.value = true;
    } else {
      hasData.value = false;
      Alert.Error(result.metaData?.message || "Terjadi kesalahan");
    }
  } catch (err) {
    hasData.value = false;
    Alert.Error(err.message || "Gagal memuat data");
  } finally {
    isLoading.value = false;
  }
};

const confirmEditAwal = () => {
  isEditingAwal.value = false;
  fetchRiwayat();
};

const open = (nokartu) => {
  noKartu.value = nokartu;
  hasData.value = false;
  isEditingAwal.value = false;
  searchObat.value = "";
  periodeAwal.value = sixMonthsAgo;
  periodeAkhir.value = today;
  fetchRiwayat();
};

defineExpose({ open });
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      @click.self="emit('close')"
    >
      <div
        class="bg-white rounded-2xl shadow-xl w-full max-w-3/4 mx-4 flex flex-col max-h-[90vh] overflow-hidden"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0"
        >
          <h3 class="text-sm font-semibold text-slate-700">
            Riwayat Pelayanan Obat
          </h3>
          <button
            @click="emit('close')"
            class="text-slate-400 hover:text-slate-600"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Loading state -->
        <div
          v-if="isLoading"
          class="flex flex-col items-center justify-center py-16 gap-3"
        >
          <Loader2 class="w-6 h-6 animate-spin text-[#00366b]" />
          <p class="text-xs text-slate-500">Memuat riwayat pelayanan...</p>
        </div>

        <div v-else class="overflow-y-auto p-5 space-y-4">
          <!-- Info Pasien -->
          <div class="text-xs text-slate-700 space-y-1">
            <div class="grid grid-cols-[90px_12px_1fr]">
              <span class="font-medium">Nama</span>
              <span>:</span>
              <span>{{
                dataPasien?.namapeserta ?? props.pasienData?.[0]?.Nama
              }}</span>
            </div>
            <div class="grid grid-cols-[90px_12px_1fr]">
              <span class="font-medium">Nomor Kartu</span>
              <span>:</span>
              <span>{{
                dataPasien?.nokartu ?? props.pasienData?.[0]?.NoKartuBpjs ?? "-"
              }}</span>
            </div>
            <div class="grid grid-cols-[90px_12px_1fr]">
              <span class="font-medium">Tgl Lahir</span>
              <span>:</span>
              <span>{{ formatTanggal(dataPasien?.tgllhr) || "-" }}</span>
            </div>
            <div class="grid grid-cols-[90px_12px_1fr] items-center">
              <span class="font-medium">Periode</span>
              <span>:</span>
              <div class="flex items-center gap-2">
                <template v-if="!isEditingAwal">
                  <span
                    class="group flex items-center gap-1.5 cursor-pointer w-fit"
                    @click="isEditingAwal = true"
                    title="Ubah tanggal awal"
                  >
                    <span class="group-hover:text-blue-600 transition">{{
                      periodeLabel
                    }}</span>
                    <Pencil
                      class="w-3 h-3 text-slate-300 group-hover:text-blue-500 transition"
                    />
                  </span>
                </template>
                <template v-else>
                  <input
                    type="date"
                    v-model="periodeAwal"
                    :max="periodeAkhir"
                    class="px-2 py-1 border border-slate-300 rounded text-xs outline-none"
                    autofocus
                  />
                  <span class="text-slate-400">—</span>
                  <span>{{ formatTanggal(periodeAkhir) }}</span>
                  <button
                    type="button"
                    @click="confirmEditAwal"
                    class="flex items-center justify-center w-6 h-6 rounded bg-[#00366b] hover:bg-[#00295a] text-white transition"
                    title="Terapkan"
                  >
                    <Check class="w-3 h-3" />
                  </button>
                </template>
              </div>
            </div>
          </div>

          <!-- Warning + Search -->
          <div class="flex items-center justify-between gap-3">
            <div
              class="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 p-3 text-xs rounded-md flex-1"
            >
              *) Pelayanan paling lama dapat dicari 2 tahun kebelakang.
            </div>
            <div v-if="hasData" class="relative shrink-0 w-56">
              <Search
                class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2"
              />
              <input
                type="text"
                v-model="searchObat"
                placeholder="Cari nama obat..."
                class="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-md text-xs outline-none focus:border-[#00366b]"
              />
            </div>
          </div>

          <!-- Tabel -->
          <DataTable
            v-if="hasData"
            :headers="columns"
            :items="filteredRiwayat"
            :loading="isLoading"
          >
            <template #item-tglpelayanan="{ tglpelayanan }">
              <div>
                {{ formatTanggal(tglpelayanan) }}
              </div>
            </template>
          </DataTable>
          <div
            v-else
            class="flex flex-col items-center justify-center py-10 text-center"
          >
            <div
              class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3"
            >
              <span class="text-xl">📭</span>
            </div>
            <p class="text-sm font-semibold text-slate-600">
              Data tidak ditemukan
            </p>
            <p class="text-xs text-slate-400 mt-1">
              Coba ubah periode untuk memperluas pencarian.
            </p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
