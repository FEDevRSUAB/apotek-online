<script setup>
import { ref, computed, onMounted } from "vue";
import { X, Check } from "lucide-vue-next";
import DataTable from "../../../components/DataTable.vue";
import { useStore } from "vuex";
import Alert from "../../../utils/Alert";

const store = useStore();

const props = defineProps({
  search: String,
});

const recipes = computed(() => store.state.referensiObat || []);
const isLoading = ref(false);

const columns = [
  { text: "Kode Obat", value: "kodeobat" },
  { text: "Nama Obat", value: "namaobat" },
  { text: "Obat PRB", value: "prb" },
  { text: "Obat Kronis", value: "kronis" },
  { text: "Obat Kemo", value: "kemo" },
  { text: "Harga", value: "harga" },
  { text: "Restriksi", value: "restriksi" },
  { text: "Generik", value: "generik" },
];

const fetchObat = async () => {
  try {
    isLoading.value = true;
    const result = await store.dispatch("fetchReferensiObat");
    if (result.metaData?.code === "200") {
      Alert.Success(result.metaData?.message || "Data ditemukan");
    } else {
      Alert.Error(result.message || "Terjadi kesalahan");
    }
  } catch (error) {
    console.error("Gagal fetch obat:", error);
    Alert.Error("Gagal memuat data");
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  if (!recipes.value || recipes.value.length === 0) {
    fetchObat();
  }
});
</script>

<template>
  <div class="max-w-full pb-6">
    <DataTable
      :headers="columns"
      :items="recipes"
      :search-value="search"
      :loading="isLoading"
      :isHeader="true"
      :no-sort-keys="['prb', 'kronis', 'kemo', 'restriksi']"
      alternating
    >
      <template #item-prb="{ prb }">
        <div class="flex items-center justify-center">
          <Check v-if="prb === 'True'" class="w-4 h-4 text-green-500" />
          <X v-else class="w-4 h-4 text-red-400" />
        </div>
      </template>

      <template #item-kronis="{ kronis }">
        <div class="flex items-center justify-center">
          <Check v-if="kronis === 'True'" class="w-4 h-4 text-green-500" />
          <X v-else class="w-4 h-4 text-red-400" />
        </div>
      </template>

      <template #item-kemo="{ kemo }">
        <div class="flex items-center justify-center">
          <Check v-if="kemo === 'True'" class="w-4 h-4 text-green-500" />
          <X v-else class="w-4 h-4 text-red-400" />
        </div>
      </template>

      <template #item-restriksi="{ restriksi }">
        <span
          v-if="!restriksi || restriksi === 'Null'"
          class="text-slate-300 italic text-xs"
        >
          —
        </span>
        <span v-else class="text-xs text-slate-700">{{ restriksi }}</span>
      </template>
    </DataTable>
  </div>
</template>
