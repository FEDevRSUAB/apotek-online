<script setup>
import { ref, watch, computed, onMounted } from "vue";
import { useStore } from "vuex";
import Alert from "../../../utils/Alert";
import { useRoute, useRouter } from "vue-router";
import { jenisObatLabel, formatTanggal } from "../../../utils/moment";
import ObatForm from "../../../components/ObatForm.vue";
import ObatTable from "../../../components/ObatTable.vue";

const store = useStore();
const route = useRoute();
const router = useRouter();

const noresep = computed(() => route.query.noresep || "");
const noApotek = computed(() => route.query.no_apotek || "");
const noSep = computed(() => route.query.no_sep || "");
const kdJenisObat = computed(() => route.query.kd_jenis_obat || "");
const nama = computed(() => route.query.nama || "");
const noKartu = computed(() => route.query.no_kartu || "");
const tglEntry = computed(() => route.query.tgl_entry || "");
const tglResep = computed(() => route.query.tgl_resep || "");
const tglPelayanan = computed(() => route.query.tgl_pelayanan || "");
const apol_id = computed(() => route.query.apol_id || "");
const listObat = ref([]);

const resepDataFallback = computed(() => {
  if (noresep.value && noApotek.value) {
    return {
      noresep: noresep.value,
      no_apotek: noApotek.value,
      no_sep: noSep.value,
      kd_jenis_obat: kdJenisObat.value,
      nama: nama.value,
      no_kartu: noKartu.value,
      tgl_entry: tglEntry.value,
      tgl_resep: tglResep.value,
      tgl_pelayanan: tglPelayanan.value,
      apol_resep_id: apol_id.value,
    };
  }
  // Fallback ke store.state.selectedResep jika query kosong
  const resep = store.state.selectedResep;
  if (resep && resep.NORESEP && resep.NOAPOTIK) {
    const fallbackData = {
      noresep: resep.NORESEP,
      no_apotek: resep.NOAPOTIK,
      no_sep: resep.NOSEP_KUNJUNGAN || "",
      kd_jenis_obat: resep.KDJNSOBAT || "",
      nama: resep.NAMA || "",
      no_kartu: resep.NOKARTU || "",
      tgl_entry: resep.TGLENTRY || "",
      tgl_resep: resep.TGLRESEP || "",
      tgl_pelayanan: resep.TGLPELRSP || "",
      apol_resep_id: resep.apol_resep_id || "",
    };
    return fallbackData;
  }
  return {};
});

onMounted(() => {
  if (!noresep.value || !noApotek.value) {
    const resep = store.state.selectedResep;
    if (resep && resep.NORESEP && resep.NOAPOTIK) {
      router.replace({
        path: "/daftar-resep-masuk",
        query: {
          noresep: resep.NORESEP,
          no_apotek: resep.NOAPOTIK,
          no_sep: resep.NOSEP_KUNJUNGAN,
          kd_jenis_obat: resep.KDJNSOBAT,
          nama: resep.NAMA,
          no_kartu: resep.NOKARTU,
          tgl_entry: resep.TGLENTRY,
          tgl_resep: resep.TGLRESEP,
          tgl_pelayanan: resep.TGLPELRSP,
          apol_id: resep.apol_resep_id,
        },
      });
    } else {
      console.error(
        "Data resep tidak ditemukan. Silakan pilih resep dari daftar."
      );
    }
  }
});

watch(
  () => store.state.listObat.listobat,
  (val) => {
    listObat.value = val || [];
  },
  { immediate: true }
);

const findList = () => {
  store.dispatch("findListObat", { nomor_kunjungan: noApotek.value });
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
    nosepapotek: noApotek.value || "",
    noresep: noresep.value || "",
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
  () => noApotek.value,
  (val) => {
    if (val) {
      findList();
    }
  },
  { immediate: true }
);
</script>

<template>
  <div class="space-y-8 min-h-screen">
    <!--DATA SEP-->
    <div class="bg-white rounded-2xl shadow-sm p-6 space-y-3">
      <h2
        class="text-lg font-semibold text-gray-700 border-b border-gray-300 pb-2"
      >
        Data SEP
      </h2>
      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 text-sm text-gray-700"
      >
        <div><strong>No SEP/Kunjungan:</strong> {{ noSep }}</div>
        <div><strong>No Resep:</strong> {{ noresep }}</div>
        <div><strong>No Kartu:</strong> {{ noKartu }}</div>
        <div><strong>Nama:</strong> {{ nama }}</div>
        <div>
          <strong>Jenis Resep:</strong> {{ jenisObatLabel(kdJenisObat) }}
        </div>
        <div>
          <strong>Tgl Pelayanan:</strong> {{ formatTanggal(tglPelayanan) }}
        </div>
        <div><strong>Tgl Resep:</strong> {{ formatTanggal(tglResep) }}</div>
      </div>
    </div>

    <!-- INPUT OBAT  -->
    <div class="bg-white rounded-2xl shadow-sm p-6 space-y-6">
      <h2
        class="text-lg font-semibold text-gray-700 border-b border-gray-300 pb-2"
      >
        Input Obat No Resep {{ noresep }}
      </h2>
      <ObatForm :resepData="resepDataFallback" @saved="onObatSaved" />
    </div>

    <!-- TABEL OBAT -->
    <ObatTable :list="listObat" @delete="deleteObat" />
  </div>
</template>
