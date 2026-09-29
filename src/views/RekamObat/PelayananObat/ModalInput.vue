<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useStore } from "vuex";
import {
  X,
  Check,
  Trash2,
  Download,
  Loader2,
  RotateCcw,
  Plus,
} from "lucide-vue-next";
import Alert from "../../../utils/Alert";

const props = defineProps({
  resep: Object,
});

const emit = defineEmits(["close", "saved"]);

const store = useStore();

const listObat = ref([]);
const listDaftar = ref([]);
const obatOptions = ref({});
const loadingObat = ref({});
const loadingRow = ref({});
const loadingDelete = ref({});
const isLoadingDaftar = ref(false);
const isLoadingPxid = ref(false);
const ImportData = ref([]);
const hasImportData = computed(() => ImportData.value.length > 0);

const obatRSOptions = ref({});
const loadingObatRS = ref({});
const debounceTimersRS = {};

const pxid = computed({
  get: () => store.state.pxid,
  set: (val) => store.dispatch("setPxid", val),
});

let uidSeed = 0;
const generateUid = () => `row-${++uidSeed}`;

const listObatResep = (o) => ({
  id: o.id ?? 0,
  invoice_id: o.inv_id ?? "",
  racikan: String(o.tipeobat ?? "").toUpperCase(),
  nama_obat_rs: o.namaobat ?? "",
  kode_obat_rs: o.kodeobat ?? "",
  kode_obat_dpho: o.kode_obat_dpho ?? "",
  harga: Number(o.harga) || 0,
  signa1: Number(o.signa1) || 0,
  signa2: Number(o.signa2) || 0,
  hari: Number(o.hari) || 0,
  jumlah_rs: Number(o.jumlah) || 0,
  tipeobat: o.tipeobat ?? "",
  kodeobat: o.kodeobat ?? "",
  dokter_id: o.dokter_id,
});

const formImport = (o) => {
  const qty = Number(o.qty) || 0;
  const { signa1, signa2 } = getSignaFromQty(qty);
  return {
    _uid: generateUid(),
    id: 0,
    invoice_id: o.inv_id ?? "",
    racikan: o.puyer != 1 ? false : true,
    nama_obat_rs: o.nama_obat_im ?? "",
    kode_obat_rs: o.kode_obat_im ?? "",
    kode_obat_dpho: o.kode_obat_dpho ?? "",
    nama_obat_dpho: o.nama_obat_dpho ?? "",
    dokter_id: o.dokter_id || 0,
    price: Number(o.price) || 0,
    signa1,
    signa2,
    hari: 30,
    permintaan: 0,
    sedia: 0,
    jumlah_rs: qty,
    catkhsobt: o.catkhsobt ?? "",
    db_tahun: o.dbase || 0,
    tanggal_invoice: o.invoice_date ?? "",
  };
};

const handleTambahBaris = () => {
  const data = ImportData.value[0];
  listObat.value.push({
    _uid: generateUid(),
    id: 0,
    invoice_id: data?.inv_id ?? "",
    dokter_id: data?.dokter_id || 0,
    db_tahun: data?.dbase || 0,
    tanggal_invoice: data?.invoice_date ?? "",
    racikan: false,
    nama_obat_rs: "",
    kode_obat_rs: "",
    kode_obat_dpho: "",
    nama_obat_dpho: "",
    price: 0,
    signa1: 1,
    signa2: 1,
    hari: 30,
    permintaan: 0,
    sedia: 0,
    jumlah_rs: 0,
    catkhsobt: "",
  });
};

const SIGNA_MAP = {
  12: { signa1: 1, signa2: 0.4 },
  15: { signa1: 1, signa2: 0.5 },
  20: { signa1: 1, signa2: 0.7 },
  30: { signa1: 1, signa2: 1 },
  42: { signa1: 2, signa2: 0.7 },
  45: { signa1: 3, signa2: 0.5 },
  48: { signa1: 2, signa2: 0.8 },
  60: { signa1: 2, signa2: 1 },
  90: { signa1: 3, signa2: 1 },
};

const getSignaFromQty = (qty) => {
  const mapped = SIGNA_MAP[Number(qty)];
  return mapped ?? { signa1: 1, signa2: 1 };
};

const toRp = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const isRacikan = (tipe) => tipe === true;

const jumlahRacikan = (o) =>
  (Number(o.signa1) || 0) * (Number(o.signa2) || 0) * (Number(o.hari) || 0);

const jumlahAkhirRacikan = (o) => {
  const sedia = Number(o.sedia) || 0;
  if (sedia <= 0) return 0;
  const permintaan = Number(o.permintaan) || 0;
  return Math.round((permintaan * jumlahRacikan(o)) / sedia);
};

const getNetto = (o) =>
  (isRacikan(o.racikan) ? jumlahAkhirRacikan(o) : Number(o.jumlah_rs) || 0) *
  (Number(o.price) || 0);

const totalTagihan = computed(() =>
  listObat.value.reduce((s, o) => s + getNetto(o), 0),
);

const totalDaftar = computed(() =>
  listDaftar.value.reduce((s, o) => s + o.harga, 0),
);

watch(
  () => props.resep,
  (val) => {
    if (!val) return;
    listDaftar.value = (val.listObatRaw ?? []).map(listObatResep);
  },
  { immediate: true },
);

watch(
  pxid,
  async (val) => {
    if (!val || val.trim().length < 7) return;
    const trimmed = val.trim();
    localStorage.setItem("pxid", trimmed);
    isLoadingPxid.value = true;
    try {
      const res = await store.dispatch("importResep", trimmed);
      ImportData.value = res.response ?? [];
      listObat.value = ImportData.value.map(formImport);
      obatOptions.value = {};
    } catch {
      ImportData.value = [];
    } finally {
      isLoadingPxid.value = false;
    }
  },
  { immediate: false },
);

watch(
  listObat,
  (val) => {
    val.forEach((o) => {
      if (isRacikan(o.racikan)) {
        const sedia = Number(o.sedia) || 0;
        if (sedia <= 0) return;
        o.jumlah_rs = jumlahAkhirRacikan(o);
      } else {
        o.jumlah_rs = Math.round(jumlahRacikan(o));
      }
    });
  },
  { deep: true },
);

const helperNamaObat = (nama) => {
  const kata = String(nama ?? "")
    .trim()
    .split(/\s+/)[0];
  return kata.charAt(0).toUpperCase() + kata.slice(1).toLowerCase();
};

const findObatByUid = (uid) => listObat.value.find((o) => o._uid === uid);

const fetchObat = async (uid, filter) => {
  if (loadingObat.value[uid]) return;
  loadingObat.value[uid] = true;
  try {
    const res = await store.dispatch("findObat", {
      kd_jenis_obat: props.resep?.kd_jenis_obat || "",
      tgl_resep: props.resep?.tanggal_resep || "",
      filter,
    });
    const list = res?.response?.list ?? [];
    obatOptions.value[uid] = list;

    const target = findObatByUid(uid);
    if (!target) return;

    const currentKode = target.kode_obat_dpho;
    const exactMatch = currentKode
      ? list.find((o) => o.kode === currentKode)
      : null;

    if (exactMatch) {
      target.nama_obat_dpho = exactMatch.nama;
      target.price = Number(exactMatch.harga) || target.price;
    } else if (list.length === 1) {
      target.kode_obat_dpho = list[0].kode;
      target.nama_obat_dpho = list[0].nama;
      target.price = Number(list[0].harga) || target.price;
    }
  } catch {
    obatOptions.value[uid] = [];
  } finally {
    loadingObat.value[uid] = false;
  }
};

const debounceTimers = {};

const handleFocusKodeBpjs = (uid) => {
  const obat = findObatByUid(uid);
  if (!obat) return;

  if (loadingObat.value[uid]) return;
  if (obatOptions.value[uid]?.length) return;

  const sudahLengkap =
    obat.kode_obat_dpho?.trim() && obat.nama_obat_dpho?.trim();
  if (sudahLengkap) return;

  const keyword =
    obat.kode_obat_dpho?.trim() || helperNamaObat(obat.nama_obat_rs);
  if (keyword) fetchObat(uid, keyword);
};

const handleInputKodeBpjs = (uid, nilai) => {
  const obat = findObatByUid(uid);
  if (!obat) return;

  obat.kode_obat_dpho = nilai;
  clearTimeout(debounceTimers[uid]);

  const match = (obatOptions.value[uid] ?? []).find((o) => o.kode === nilai);
  if (match) {
    obat.nama_obat_dpho = match.nama;
    obat.price = Number(match.harga) || obat.price;
    return;
  }

  const keyword = nilai.trim();
  if (keyword.length <= 3) {
    obatOptions.value[uid] = [];
    return;
  }

  debounceTimers[uid] = setTimeout(() => {
    delete debounceTimers[uid];
    fetchObat(uid, keyword);
  }, 400);
};

const fetchObatRS = async (uid, filter) => {
  if (loadingObatRS.value[uid]) return;
  loadingObatRS.value[uid] = true;
  try {
    const res = await store.dispatch("findObatRS", filter);
    console.log("fetchObatRS", res);
    obatRSOptions.value[uid] = res ?? [];
  } catch {
    obatRSOptions.value[uid] = [];
  } finally {
    loadingObatRS.value[uid] = false;
  }
};

const handleFocusNamaObatRs = (uid) => {
  const obat = findObatByUid(uid);
  if (!obat) return;
  if (loadingObatRS.value[uid]) return;
  if (obatRSOptions.value[uid]?.length) return;

  const keyword = obat.nama_obat_rs?.trim();
  if (keyword && keyword.length > 2) fetchObatRS(uid, keyword);
};

const handleInputNamaObatRs = (uid, nilai) => {
  const obat = findObatByUid(uid);
  if (!obat) return;

  obat.nama_obat_rs = nilai;
  clearTimeout(debounceTimersRS[uid]);

  const match = (obatRSOptions.value[uid] ?? []).find((o) => o.nama === nilai);
  if (match) {
    obat.nama_obat_rs = match.nama;
    obat.kode_obat_rs = match.kode;
    return;
  }

  const keyword = nilai.trim();
  if (keyword.length <= 2) {
    obatRSOptions.value[uid] = [];
    return;
  }

  debounceTimersRS[uid] = setTimeout(() => {
    delete debounceTimersRS[uid];
    fetchObatRS(uid, keyword);
  }, 400);
};

const handleImport = () => {
  listObat.value = ImportData.value.map(formImport);
  obatOptions.value = {};
};

const PayloadBase = (obat) => ({
  nosjp: props.resep?.no_apotek ?? "",
  noresep: props.resep?.noresep ?? "",
  nosep: props.resep?.no_sep ?? "",
  user_id: props.resep?.user_id ?? "",
  apol_resep_detail_id: props.resep?.apol_resep_id ?? "",
  kdobat: obat.kode_obat_dpho ?? "",
  nmobat: obat.nama_obat_dpho ?? "",
  harga: String(obat.price ?? 0),
  jho: String(obat.hari ?? 0),
  catkhsobt: obat.catkhsobt ?? "",
  id: obat.id ?? 0,
  pxid: pxid.value ?? "",
  invoice_id: obat.invoice_id ?? "",
  kode_obat_rs: obat.kode_obat_rs ?? "",
  nama_obat_rs: obat.nama_obat_rs ?? "",
  kode_obat_dpho: obat.kode_obat_dpho ?? "",
  nama_obat_dpho: obat.nama_obat_dpho ?? "",
  signa1: obat.signa1 ?? 0,
  signa2: obat.signa2 ?? 0,
  signa_satu: obat.signa1 ?? 0,
  signa_dua: obat.signa2 ?? 0,
  racikan: obat.racikan,
  dokter_id: obat.dokter_id ?? "",
  jumlah_rs: obat.jumlah_rs ?? 0,
  db_tahun: obat.db_tahun ?? 0,
  tanggal_invoice: obat.tanggal_invoice ?? "",
});

const PayloadNonRacikan = (obat) => ({
  ...PayloadBase(obat),
  jmlobat: String(obat.jumlah_rs ?? 0),
  jnsrobt: "N",
});

const PayloadRacikan = (obat) => ({
  ...PayloadBase(obat),
  jnsrobt: "R.01",
  permintaan: String(obat.permintaan ?? 0),
  sedia: String(obat.sedia ?? 0),
  jmlobat: String(obat.jumlah_rs ?? 0),
});

const handleSimpanRow = async (obat) => {
  const uid = obat._uid;
  if (loadingRow.value[uid]) return;

  if (!obat.kode_obat_dpho?.trim()) {
    Alert.Warn("Kode Obat BPJS belum diisi, harap isi terlebih dahulu");
    return;
  }

  loadingRow.value[uid] = true;
  try {
    const racikan = isRacikan(obat.racikan);
    const action = racikan ? "insertObatRacikan" : "insertObatNonRacikan";
    const payload = racikan ? PayloadRacikan(obat) : PayloadNonRacikan(obat);
    const res = await store.dispatch(action, payload);
    if (res?.metaData?.code == 200) {
      obat.id = res.response?.id ?? obat.id;
      listDaftar.value = (res.response ?? []).map(listObatResep);
      Alert.Success("Berhasil simpan obat");
    } else {
      Alert.Error(res?.metaData?.message || "Gagal insert resep");
    }
  } catch (err) {
    Alert.Error(`[SIMPAN ROW] ${obat.nama_obat_rs}`, err);
  } finally {
    loadingRow.value[uid] = false;
  }
};

const handleHapusImport = (uid) => {
  const idx = listObat.value.findIndex((o) => o._uid === uid);
  if (idx === -1) return;
  listObat.value.splice(idx, 1);

  delete loadingObat.value[uid];
  delete obatOptions.value[uid];
  delete loadingRow.value[uid];
  clearTimeout(debounceTimers[uid]);
  delete debounceTimers[uid];

  delete obatRSOptions.value[uid];
  delete loadingObatRS.value[uid];
  clearTimeout(debounceTimersRS[uid]);
  delete debounceTimersRS[uid];
};

const handleDeleteDaftar = async (idx) => {
  const obat = listDaftar.value[idx];
  if (!obat) return;

  const confirm = await Alert.Confirm({
    title: "Apakah anda yakin?",
    text: "Obat akan dihapus dari daftar.",
    confirmButtonText: "Ya, hapus",
    cancelButtonText: "Batal",
  });
  if (!confirm.isConfirmed) {
    Alert.Info("Penghapusan dibatalkan");
    return;
  }

  loadingDelete.value[idx] = true;
  try {
    const payload = {
      id: obat.id ?? 0,
      nosepapotek: props.resep?.no_apotek ?? "",
      noresep: props.resep?.noresep ?? "",
      kodeobat: obat.kodeobat,
      tipeobat: obat.tipeobat || "nonracikan",
    };
    const result = await store.dispatch("deleteObat", payload);
    if (result.metaData?.code == "200") {
      listDaftar.value = (result.response ?? []).map(listObatResep);
      Alert.Success(result.metaData?.message || "Obat berhasil dihapus");
    } else {
      Alert.Error(result.message || "Gagal menghapus obat");
    }
  } catch {
    Alert.Error("Terjadi kesalahan saat menghapus obat");
  } finally {
    loadingDelete.value[idx] = false;
  }
};

const handleRefreshDaftar = async () => {
  if (!props.resep?.no_apotek) return;
  isLoadingDaftar.value = true;
  try {
    const res = await store.dispatch("daftarObatResep", props.resep.no_apotek);
    listDaftar.value = (res.response?.listobat ?? []).map(listObatResep);
  } catch {
    Alert.Error("Gagal memuat daftar obat");
  } finally {
    isLoadingDaftar.value = false;
  }
};

onMounted(async () => {
  const currentPxid = pxid.value || "0";
  isLoadingPxid.value = true;
  try {
    const res = await store.dispatch("importResep", currentPxid);
    ImportData.value = res.response ?? [];
    listObat.value = ImportData.value.map(formImport);
    obatOptions.value = {};
  } catch {
    ImportData.value = [];
  } finally {
    isLoadingPxid.value = false;
  }
});
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-start pt-14 justify-center bg-black/40 p-4 h-full"
    @click.self="emit('close')"
  >
    <div
      class="bg-white rounded-xl shadow-xl w-full max-w-[88vw] flex flex-col max-h-[90vh] border border-slate-200"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 shrink-0"
      >
        <div>
          <h2 class="text-[13px] font-semibold text-slate-800 leading-tight">
            Input Obat Resep
          </h2>
          <div class="flex items-center gap-3 mt-1">
            <span class="text-[11px] text-slate-500"
              >No. Resep
              <span class="font-semibold text-slate-800">{{
                resep?.noresep ?? "—"
              }}</span></span
            >
            <span class="text-slate-300">|</span>
            <span class="text-[11px] text-slate-500"
              >Apotek
              <span class="font-semibold text-slate-800">{{
                resep?.no_apotek ?? "—"
              }}</span></span
            >
            <span class="text-slate-300">|</span>
            <span class="text-[11px] text-slate-500"
              >SEP
              <span class="font-semibold text-slate-800">{{
                resep?.no_sep ?? "—"
              }}</span></span
            >
            <span class="text-slate-300">|</span>
            <span class="text-[11px] text-slate-500 flex items-center gap-1">
              PxId
              <input
                v-model="pxid"
                type="text"
                placeholder="—"
                class="px-1.5 py-0.5 rounded border border-transparent bg-transparent text-[11px] font-semibold text-slate-800 placeholder-slate-300 w-24 hover:border-slate-200 hover:bg-slate-50 focus:border-slate-300 focus:bg-white focus:outline-none transition"
              />
            </span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button
            v-if="hasImportData"
            @click="handleImport"
            :disabled="isLoadingPxid"
            class="flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition font-medium disabled:opacity-60 disabled:cursor-wait"
          >
            <Loader2 v-if="isLoadingPxid" class="w-3.5 h-3.5 animate-spin" />
            <Download v-else class="w-3.5 h-3.5" />
            Import data ({{ ImportData.length }} obat)
          </button>
          <button
            @click="handleTambahBaris"
            class="flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition font-medium"
          >
            <Plus class="w-3.5 h-3.5" />
            Tambah Baris
          </button>
          <button
            @click="emit('close')"
            class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Tabel import Data -->
      <div class="overflow-auto flex-1 flex flex-col divide-y divide-slate-100">
        <div class="flex flex-col">
          <div class="overflow-x-auto">
            <table
              class="w-max min-w-full text-[12px] border-separate border-spacing-0"
            >
              <thead class="sticky top-0 z-10">
                <tr class="bg-white">
                  <th
                    class="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600 border-b border-slate-200 whitespace-nowrap w-8 text-center"
                  >
                    #
                  </th>
                  <th
                    class="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600 border-b border-slate-200 whitespace-nowrap w-16"
                  >
                    Tipe
                  </th>
                  <th
                    class="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600 border-b border-slate-200 whitespace-nowrap min-w-[180px]"
                  >
                    Nama Obat
                  </th>
                  <th
                    class="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600 border-b border-slate-200 whitespace-nowrap w-28"
                  >
                    Kode Obat
                  </th>
                  <th
                    class="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600 border-b border-slate-200 whitespace-nowrap w-36"
                  >
                    Kd Ob BPJS
                  </th>
                  <th
                    class="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600 border-b border-slate-200 whitespace-nowrap w-36"
                  >
                    Harga
                  </th>
                  <th
                    class="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-600 border-b border-slate-200 whitespace-nowrap w-20"
                  >
                    Signa 1
                  </th>
                  <th
                    class="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-600 border-b border-slate-200 whitespace-nowrap w-20"
                  >
                    Signa 2
                  </th>
                  <th
                    class="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-600 border-b border-slate-200 whitespace-nowrap w-20"
                  >
                    Hari
                  </th>
                  <th
                    class="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-600 border-b border-slate-200 whitespace-nowrap w-24 bg-amber-50"
                  >
                    Permintaan
                  </th>
                  <th
                    class="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-600 border-b border-slate-200 whitespace-nowrap w-24 bg-amber-50"
                  >
                    Sedia
                  </th>
                  <th
                    class="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-600 border-b border-slate-200 whitespace-nowrap w-24 bg-amber-50"
                  >
                    Jml Racikan
                  </th>
                  <th
                    class="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-600 border-b border-slate-200 whitespace-nowrap w-20"
                  >
                    Jml Obat
                  </th>
                  <th
                    class="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-600 border-b border-slate-200 whitespace-nowrap w-30"
                  >
                    Catatan
                  </th>
                  <th
                    class="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-600 border-b border-slate-200 whitespace-nowrap w-32"
                  >
                    Tagihan
                  </th>
                  <th
                    class="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-600 border-b border-slate-200 whitespace-nowrap w-16"
                  >
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(obat, idx) in listObat"
                  :key="obat._uid"
                  class="group transition-colors hover:bg-slate-50/60"
                  :class="idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'"
                >
                  <td
                    class="px-3 py-2 border-b border-slate-100 text-center text-slate-300 font-medium text-[11px]"
                  >
                    {{ idx + 1 }}
                  </td>
                  <td class="px-3 py-2 border-b border-slate-100">
                    <select
                      v-model="obat.racikan"
                      class="w-full px-2 py-1.5 rounded-md border border-transparent bg-transparent text-[12px] text-slate-700 hover:border-slate-200 hover:bg-slate-50 focus:border-slate-300 focus:bg-white focus:outline-none transition"
                    >
                      <option :value="false">N</option>
                      <option :value="true">R</option>
                    </select>
                  </td>
                  <td class="px-3 py-2 border-b border-slate-100">
                    <div class="relative">
                      <input
                        :list="`obat-rs-list-${obat._uid}`"
                        :value="obat.nama_obat_rs"
                        @input="
                          handleInputNamaObatRs(obat._uid, $event.target.value)
                        "
                        @focus="handleFocusNamaObatRs(obat._uid)"
                        type="text"
                        placeholder="Cari Nama Obat"
                        class="w-full px-2 py-1.5 rounded-md border border-transparent bg-transparent text-[12px] text-slate-700 placeholder-slate-300 hover:border-slate-200 hover:bg-slate-50 focus:border-slate-300 focus:bg-white focus:outline-none transition"
                        :class="loadingObatRS[obat._uid] ? 'opacity-50' : ''"
                      />
                      <datalist :id="`obat-rs-list-${obat._uid}`">
                        <option
                          v-for="opt in obatRSOptions[obat._uid] ?? []"
                          :key="opt.kode"
                          :value="opt.nama"
                          :label="`${opt.nama} — Rp${Number(opt.harga_bpjs).toLocaleString('id-ID')}`"
                        />
                      </datalist>
                    </div>
                  </td>
                  <td class="px-3 py-2 border-b border-slate-100">
                    <span class="text-[12px] text-slate-500">{{
                      obat.kode_obat_rs
                    }}</span>
                  </td>
                  <td class="px-3 py-2 border-b border-slate-100">
                    <div class="relative">
                      <input
                        :list="`obat-list-${obat._uid}`"
                        :value="obat.kode_obat_dpho"
                        @input="
                          handleInputKodeBpjs(obat._uid, $event.target.value)
                        "
                        @focus="handleFocusKodeBpjs(obat._uid)"
                        type="text"
                        placeholder="Kode BPJS"
                        class="w-full px-2 py-1.5 rounded-md border border-transparent bg-transparent text-[12px] text-slate-700 placeholder-slate-300 hover:border-slate-200 hover:bg-slate-50 focus:border-slate-300 focus:bg-white focus:outline-none transition"
                        :class="loadingObat[obat._uid] ? 'opacity-50' : ''"
                      />
                      <datalist :id="`obat-list-${obat._uid}`">
                        <option
                          v-for="opt in obatOptions[obat._uid] ?? []"
                          :key="opt.kode"
                          :value="opt.kode"
                          :label="`${opt.nama} — Rp${Number(opt.harga).toLocaleString('id-ID')}`"
                        />
                      </datalist>
                    </div>
                  </td>
                  <td class="px-3 py-2 border-b border-slate-100">
                    <span class="text-[12px] text-slate-700">{{
                      toRp(obat.price)
                    }}</span>
                  </td>
                  <td class="px-3 py-2 border-b border-slate-100">
                    <input
                      v-model.number="obat.signa1"
                      type="number"
                      min="0"
                      class="w-full px-2 py-1.5 rounded-md border border-transparent bg-transparent text-[12px] text-slate-700 text-center hover:border-slate-200 hover:bg-slate-50 focus:border-slate-300 focus:bg-white focus:outline-none transition"
                    />
                  </td>
                  <td class="px-3 py-2 border-b border-slate-100">
                    <input
                      v-model.number="obat.signa2"
                      type="number"
                      min="0"
                      class="w-full px-2 py-1.5 rounded-md border border-transparent bg-transparent text-[12px] text-slate-700 text-center hover:border-slate-200 hover:bg-slate-50 focus:border-slate-300 focus:bg-white focus:outline-none transition"
                    />
                  </td>
                  <td class="px-3 py-2 border-b border-slate-100">
                    <input
                      v-model.number="obat.hari"
                      type="number"
                      min="0"
                      class="w-full px-2 py-1.5 rounded-md border border-transparent bg-transparent text-[12px] text-slate-700 text-center hover:border-slate-200 hover:bg-slate-50 focus:border-slate-300 focus:bg-white focus:outline-none transition"
                    />
                  </td>
                  <td
                    class="px-3 py-2 border-b border-amber-100/50 bg-amber-50/40"
                  >
                    <input
                      v-if="isRacikan(obat.racikan)"
                      v-model.number="obat.permintaan"
                      type="number"
                      min="0"
                      class="w-full px-2 py-1.5 rounded-md border border-transparent bg-transparent text-[12px] text-amber-800 text-center hover:border-amber-200 hover:bg-amber-50 focus:border-amber-300 focus:bg-white focus:outline-none transition"
                    />
                    <span
                      v-else
                      class="flex items-center justify-center h-7 text-slate-300 text-xs"
                      >—</span
                    >
                  </td>
                  <td
                    class="px-3 py-2 border-b border-amber-100/50 bg-amber-50/40"
                  >
                    <input
                      v-if="isRacikan(obat.racikan)"
                      v-model.number="obat.sedia"
                      type="number"
                      min="0"
                      class="w-full px-2 py-1.5 rounded-md border border-transparent bg-transparent text-[12px] text-amber-800 text-center hover:border-amber-200 hover:bg-amber-50 focus:border-amber-300 focus:bg-white focus:outline-none transition"
                    />
                    <span
                      v-else
                      class="flex items-center justify-center h-7 text-slate-300 text-xs"
                      >—</span
                    >
                  </td>
                  <td
                    class="px-3 py-2 border-b border-amber-100/50 bg-amber-50/40 text-center"
                  >
                    <span
                      v-if="isRacikan(obat.racikan)"
                      class="inline-flex items-center justify-center min-w-[32px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[12px]"
                      >{{ jumlahRacikan(obat) }}</span
                    >
                    <span v-else class="text-slate-300 text-xs">—</span>
                  </td>
                  <td class="px-3 py-2 border-b border-slate-100 text-center">
                    <input
                      v-model.number="obat.jumlah_rs"
                      type="number"
                      min="0"
                      class="w-full px-2 py-1.5 rounded-md border border-transparent bg-transparent text-[12px] text-slate-700 text-center font-medium hover:border-slate-200 hover:bg-slate-50 focus:border-slate-300 focus:bg-white focus:outline-none transition"
                    />
                  </td>
                  <td class="px-3 py-2 border-b border-slate-100">
                    <div class="relative">
                      <input
                        v-model="obat.catkhsobt"
                        type="text"
                        placeholder="Catatan Khusus"
                        class="w-full px-2 py-1.5 rounded-md border border-transparent bg-transparent text-[12px] text-slate-700 placeholder-slate-300 hover:border-slate-200 hover:bg-slate-50 focus:border-slate-300 focus:bg-white focus:outline-none transition"
                      />
                    </div>
                  </td>
                  <td class="px-3 py-2 border-b border-slate-100 text-right">
                    <span class="font-semibold text-slate-700 text-[12px]">{{
                      toRp(getNetto(obat))
                    }}</span>
                  </td>
                  <td class="px-3 py-2 border-b border-slate-100">
                    <div class="flex items-center justify-center gap-1.5">
                      <button
                        @click="handleSimpanRow(obat)"
                        :disabled="loadingRow[obat._uid]"
                        class="w-7 h-7 flex items-center justify-center rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 transition disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <Loader2
                          v-if="loadingRow[obat._uid]"
                          class="w-3.5 h-3.5 animate-spin"
                        />
                        <Check v-else class="w-3.5 h-3.5" stroke-width="2.5" />
                      </button>
                      <button
                        @click="handleHapusImport(obat._uid)"
                        class="w-7 h-7 flex items-center justify-center rounded-md bg-rose-50 text-rose-500 border border-rose-200 hover:bg-rose-100 hover:border-rose-300 transition"
                      >
                        <Trash2 class="w-3.5 h-3.5" stroke-width="2.5" />
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="listObat.length === 0">
                  <td
                    colspan="15"
                    class="px-6 py-6 text-center text-slate-300 text-[12px] italic"
                  >
                    Belum ada data import
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="flex flex-col">
          <div
            class="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0"
          >
            <span
              class="text-[11px] font-semibold text-slate-600 uppercase tracking-wide"
            >
              Daftar Obat Tersimpan
            </span>
            <button
              @click="handleRefreshDaftar"
              :disabled="isLoadingDaftar"
              class="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition disabled:opacity-50 disabled:cursor-wait"
            >
              Refresh
              <Loader2 v-if="isLoadingDaftar" class="w-3 h-3 animate-spin" />
              <RotateCcw v-else class="w-3 h-3" />
            </button>
          </div>
          <div class="overflow-x-auto">
            <table
              class="w-max min-w-full text-[12px] border-separate border-spacing-0"
            >
              <thead>
                <tr class="bg-white">
                  <th
                    class="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600 border-b border-slate-200 whitespace-nowrap w-8 text-center"
                  >
                    #
                  </th>
                  <th
                    class="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600 border-b border-slate-200 whitespace-nowrap w-16"
                  >
                    Tipe
                  </th>
                  <th
                    class="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600 border-b border-slate-200 whitespace-nowrap w-44"
                  >
                    Nama Obat
                  </th>
                  <th
                    class="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600 border-b border-slate-200 whitespace-nowrap w-28"
                  >
                    Kode Obat
                  </th>
                  <th
                    class="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-600 border-b border-slate-200 whitespace-nowrap w-20"
                  >
                    Signa 1
                  </th>
                  <th
                    class="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-600 border-b border-slate-200 whitespace-nowrap w-20"
                  >
                    Signa 2
                  </th>
                  <th
                    class="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-600 border-b border-slate-200 whitespace-nowrap w-20"
                  >
                    Hari
                  </th>
                  <th
                    class="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-600 border-b border-slate-200 whitespace-nowrap w-20"
                  >
                    Jml Obat
                  </th>
                  <th
                    class="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-600 border-b border-slate-200 whitespace-nowrap w-30"
                  >
                    Harga
                  </th>
                  <th
                    class="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-600 border-b border-slate-200 whitespace-nowrap w-16"
                  >
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(obat, idx) in listDaftar"
                  :key="idx"
                  class="transition-colors hover:bg-slate-50/60"
                  :class="idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'"
                >
                  <td
                    class="px-3 py-2 border-b border-slate-100 text-center text-slate-300 font-medium text-[11px]"
                  >
                    {{ idx + 1 }}
                  </td>
                  <td class="px-3 py-2 border-b border-slate-100">
                    <span
                      class="inline-flex items-center justify-center px-2 py-0.5 rounded text-[11px] font-semibold"
                      :class="
                        obat.racikan === 'R'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                      "
                    >
                      {{ obat.racikan === "N" ? "N" : "R.01" }}
                    </span>
                  </td>
                  <td class="px-3 py-2 border-b border-slate-100">
                    <span class="text-[12px] text-slate-700">{{
                      obat.nama_obat_rs
                    }}</span>
                  </td>
                  <td class="px-3 py-2 border-b border-slate-100">
                    <span class="text-[12px] text-slate-500">{{
                      obat.kode_obat_rs
                    }}</span>
                  </td>
                  <td class="px-3 py-2 border-b border-slate-100 text-center">
                    <span class="text-[12px] text-slate-700">{{
                      obat.signa1
                    }}</span>
                  </td>
                  <td class="px-3 py-2 border-b border-slate-100 text-center">
                    <span class="text-[12px] text-slate-700">{{
                      obat.signa2
                    }}</span>
                  </td>
                  <td class="px-3 py-2 border-b border-slate-100 text-center">
                    <span class="text-[12px] text-slate-700">{{
                      obat.hari
                    }}</span>
                  </td>
                  <td class="px-3 py-2 border-b border-slate-100 text-center">
                    <span class="text-[12px] font-medium text-slate-700">{{
                      obat.jumlah_rs
                    }}</span>
                  </td>
                  <td class="px-3 py-2 border-b border-slate-100 text-right">
                    <span class="font-semibold text-slate-700 text-[12px]">{{
                      toRp(obat.harga)
                    }}</span>
                  </td>
                  <td class="px-3 py-2 border-b border-slate-100">
                    <div class="flex items-center justify-center">
                      <button
                        @click="handleDeleteDaftar(idx)"
                        :disabled="loadingDelete[idx]"
                        class="w-7 h-7 flex items-center justify-center rounded-md bg-rose-50 text-rose-500 border border-rose-200 hover:bg-rose-100 hover:border-rose-300 transition disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <Loader2
                          v-if="loadingDelete[idx]"
                          class="w-3.5 h-3.5 animate-spin"
                        />
                        <Trash2 v-else class="w-3.5 h-3.5" stroke-width="2.5" />
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="listDaftar.length === 0">
                  <td
                    colspan="11"
                    class="px-6 py-6 text-center text-slate-300 text-[12px] italic"
                  >
                    Belum ada obat tersimpan
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div
        class="flex items-center justify-end px-5 py-3 border-t border-slate-100 bg-slate-50/60 rounded-b-xl shrink-0"
      >
        <p class="text-[11px] text-slate-400">
          Tersimpan
          <span class="font-semibold text-slate-600">{{
            listDaftar.length
          }}</span>
          obat
          <span class="mx-1.5 text-slate-200">·</span>
          Total tagihan
          <span class="font-semibold text-slate-700">{{
            toRp(totalDaftar)
          }}</span>
        </p>
      </div>
    </div>
  </div>
</template>
