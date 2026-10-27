<script setup>
import { ref, computed, onMounted } from "vue";
import { useStore } from "vuex";
import DataTable from "../../../components/DataTable.vue";
import Alert from "../../../utils/Alert";
import loading from "../../../components/Loader.vue";

const props = defineProps({
  search: String,
});

const store = useStore();

const spesialisList = computed(() => store.state.spesialis || []);
const isLoading = ref(false);

const fetchSpesialis = async () => {
  try {
    isLoading.value = true;

    const result = await store.dispatch("fetchSpesialis");

    if (result.metaData?.code === "200") {
      Alert.Success(result.metaData?.message || "Data ditemukan");
    } else {
      Alert.Error(result.message || "Terjadi kesalahan");
    }
  } catch (error) {
    Alert.Error("Gagal memuat data");
  } finally {
    isLoading.value = false;
  }
};

const columns = [
  { text: "KODE", value: "kode" },
  { text: "NAMA", value: "nama" },
];

onMounted(() => {
  if (!spesialisList.value || spesialisList.value.length === 0) {
    fetchSpesialis();
  }
});
</script>

<template>
  <div class="max-w-md pb-4">
    <DataTable
      :headers="columns"
      :items="spesialisList"
      :search-value="search"
      :rows-per-page="15"
      :loading="isLoading"
      :isHeader="true"
    >
      <template #item-kode="{ kode }">
        <div class="flex items-center">
          <span class="text-xs font-semibold text-slate-700">{{ kode }}</span>
        </div>
      </template>
    </DataTable>
  </div>
</template>
