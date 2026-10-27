<script setup>
import { ref, computed } from "vue";
import { useStore } from "vuex";
import { PencilLine } from "lucide-vue-next";
import DataTable from "../../../components/DataTable.vue";
import ModalInputObat from "./ModalInput.vue";
import { formatTanggal, jenisObatLabel } from "../../../utils/moment";

const props = defineProps({
  search: String,
  collapsedMain: Boolean,
});

const store = useStore();
const daftarResep = computed(() => store.state.detailSep ?? []);

const selectedResep = ref(null);
const isLoadingImport = ref("");

const inputObat = async (resep) => {
  if (!resep?.noresep) return;
  isLoadingImport.value = resep.noresep;
  try {
    const resObat = await store.dispatch("daftarObatResep", resep.no_apotek);
    selectedResep.value = {
      ...resep,
      listObatRaw: resObat.response?.listobat ?? [],
    };
  } catch {
    selectedResep.value = { ...resep, listObatRaw: [] };
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

const columns = [
  { text: "AKSI", value: "obat" },
  { text: "NO RESEP", value: "noresep" },
  { text: "NO SEP / KUNJUNGAN", value: "no_sep" },
  { text: "NO APOTEK", value: "no_apotek" },
  { text: "KODE JENIS OBAT", value: "kd_jenis_obat" },
  { text: "TGL ENTRY", value: "tanggal_entry" },
  { text: "TGL RESP", value: "tanggal_resep" },
  { text: "TGL PELAYANAN RESP", value: "tanggal_per_resep" },
];
</script>

<template>
  <div class="max-w-full pl-4 space-y-4">
    <div v-if="!props.collapsedMain">
      <DataTable
        :headers="columns"
        :items="daftarResep"
        :search-value="search"
        alternating
      >
        <template #item-tanggal_entry="{ tanggal_entry }">
          <div class="whitespace-nowrap">
            {{ formatTanggal(tanggal_entry) }}
          </div>
        </template>

        <template #item-tanggal_resep="{ tanggal_resep }">
          <div class="whitespace-nowrap">
            {{ formatTanggal(tanggal_resep) }}
          </div>
        </template>

        <template #item-tanggal_per_resep="{ tanggal_per_resep }">
          <div class="whitespace-nowrap">
            {{ formatTanggal(tanggal_per_resep) }}
          </div>
        </template>

        <template #item-kd_jenis_obat="{ kd_jenis_obat }">
          <div class="whitespace-nowrap">
            {{ jenisObatLabel(kd_jenis_obat) }}
          </div>
        </template>

        <template #item-obat="row">
          <button
            @click="inputObat(row)"
            :disabled="isLoadingImport === row.noresep"
            class="text-[#00366b] hover:text-[#0a529b] transition-transform duration-200 hover:scale-110 disabled:opacity-40 disabled:cursor-wait"
            title="Input Obat"
          >
            <PencilLine class="w-4 h-4" />
          </button>
        </template>
      </DataTable>
    </div>

    <ModalInputObat
      v-if="selectedResep"
      :resep="selectedResep"
      :import-data="importData"
      @close="onModalClose"
      @saved="onModalSaved"
    />

    <!-- <InputObat
      v-if="selectedResep"
      :resep="selectedResep"
      @close="onModalClose"
      @saved="onModalSaved"
    /> -->
  </div>
</template>
