<script setup>
import { ref, computed, reactive, watch } from "vue";
import { useStore } from "vuex";
import ObatForm from "../../../components/ObatForm.vue";
import ObatTable from "../../../components/ObatTable.vue";
import Alert from "../../../utils/Alert";

const props = defineProps({
  data: Object,
});

const store = useStore();
const activeTab = ref("non");

const tabs = [
  { label: "Non Racikan", value: "non" },
  { label: "Racikan", value: "racikan" },
];

const payloadNon = reactive({
  nosjp: "",
  noresep: "",
  kdobat: "",
  nmobat: "",
  signa_satu: "",
  signa_dua: "",
  jmlobat: "",
  jho: "",
  catkhsobt: "",
  nosep: "",
  user_id: "",
  jumlah_racikan: "",
  jho: "",
  catkhsobt: "",
  nosep: "",
  user_id: "",
  harga: "",
  jnsrobt: 0,
  kdobat: 0,
  nmobat: "",
  apol_resep_detail_id: 0,
});

const SimpanObatRacikan = async () => {
  Object.assign(payloadRacikan, {
    signa_satu: signaRacikan.value,
    signa_dua: signa2Racikan.value,
    jmlobat: jumlahObatRacikan.value,
    permintaan: permintaanRacikan.value,
    sedia: sedia.value,
    jumlah_racikan: jumlahRacikan.value,
    jho: hariRacikan.value,
    catkhsobt: catatanRacikan.value,
    nmobat: namaObat.value,
    kdobat: kodeObat.value,
    jnsrobt: jnsrobat.value,
    harga: String(tagihanRacikan.value),
  });

  try {
    const result = await store.dispatch("SimpanObatRacikan", payloadRacikan);
    if (result.metaData?.code === "200") {
      resetForm();
      listObat.value = result.response || [];
      Alert.Success(
        result.metaData?.message || "Obat racikan berhasil disimpan"
      );
    } else {
      Alert.Error(result.metaData?.message || "Gagal menyimpan obat racikan");
    }
  } catch (err) {
    Alert.Error("Terjadi kesalahan saat menyimpan racikan");
    console.error("[RACIKAN] Gagal simpan:", err);
  }
};

// RESET
const resetCommon = () => {
  namaObat.value = "";
  kodeObat.value = "";
  hargaObat.value = 0;
  selectedObat.value = null;
  payloadObat.filter = "";
};

const resetNonRacikan = () => {
  resetCommon();
  signa.value = 1;
  signa2.value = 1;
  hari.value = 30;
  keterangan.value = "";
  catatan.value = "";

  Object.assign(payloadNon, {
    kdobat: "",
    nmobat: "",
    signa_satu: "",
    signa_dua: "",
    jmlobat: "",
    jho: "",
    catkhsobt: "",
    harga: "",
  });
};

const resetRacikan = () => {
  resetCommon();
  signaRacikan.value = 1;
  signa2Racikan.value = 1;
  hariRacikan.value = 30;
  permintaanRacikan.value = 1;
  sedia.value = 1;
  jnsrobat.value = "";
  catatanRacikan.value = "";

  Object.assign(payloadRacikan, {
    signa_satu: "",
    signa_dua: "",
    jmlobat: "",
    permintaan: "",
    sedia: "",
    jumlah_racikan: "",
    jho: "",
    catkhsobt: "",
    harga: "",
    jnsrobt: "",
    kdobat: "",
    nmobat: "",
  });
};

const resetForm = () => {
  if (activeTab.value === "non") {
    resetNonRacikan();
  } else {
    resetRacikan();
  }
};

const nosjp = ref("");
const noresepp = ref("");
const listObat = ref([]);
watch(
  () => store.state.listObat.listobat,
  (val) => {
    listObat.value = val || [];
  },
  { immediate: true }
);

const findList = () => {
  store.dispatch("findListObat", { nomor_kunjungan: nosjp.value });
};

const deleteObat = async (index) => {
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
  const obat = listObat.value[index];
  if (!obat) {
    Alert.Warn("Data obat tidak lengkap untuk dihapus");
    return;
  }
  const payloadDelete = {
    id: obat.id || 0,
    nosepapotek: nosjp.value || "",
    noresep: obat.noresep || noresepp.value,
    kodeobat: obat.kodeobat,
    tipeobat: obat.tipeobat || "nonracikan",
  };
  try {
    const result = await store.dispatch("deleteObat", payloadDelete);
    if (result.metaData?.code == "200") {
      listObat.value = result.response || [];
      Alert.Success(result.metaData?.message || "Obat berhasil dihapus");
    } else {
      Alert.Error(result.message || "Gagal menghapus obat");
    }
  } catch (err) {
    Alert.Error("Terjadi kesalahan saat menghapus obat");
    console.error("[DELETE OBAT ERROR]", err);
  }
};

const onObatSaved = (list) => {
  listObat.value = list || [];
};

watch(
  () => props.data,
  (val) => {
    if (!val) return;
    nosjp.value = val.no_apotek || "";
    noresepp.value = val.noresep || "";
    if (nosjp.value) {
      findList();
    }
  },
  { immediate: true }
);
</script>

<template>
  <!-- Input OBAT-->
  <div class="bg-white rounded-xl shadow-sm p-4 space-y-4">
    <h2
      class="text-lg font-semibold text-gray-700 border-b border-gray-300 pb-2"
    >
      Input Obat No Resep {{ props.data?.noresep }}
    </h2>
    <ObatForm :resepData="props.data" @saved="onObatSaved" />
  </div>

  <!-- TABEL -->
  <ObatTable :list="listObat" @delete="deleteObat" />
</template>
