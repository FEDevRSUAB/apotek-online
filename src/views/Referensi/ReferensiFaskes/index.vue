<script setup>
import { ref, computed } from "vue";
import { useStore } from "vuex";
import { Search, Loader2 } from "lucide-vue-next";
import DataTable from "../../../components/DataTable.vue";
import Alert from "../../../utils/Alert";

const props = defineProps({
  search: String,
});

const store = useStore();

const jenisFaskes = ref("");
const namaFaskes = ref("");
const hasFetched = ref(false);

const faskesList = computed(() => store.state.faskes || []);
const isLoading = ref(false);

const columns = [
  { text: "KODE", value: "kode" },
  { text: "NAMA", value: "nama" },
];

const cariFaskes = async () => {
  const jenis = jenisFaskes.value.trim();
  const nama = namaFaskes.value.trim();

  if (!jenis) return Alert.Warn("Jenis faskes tidak boleh kosong");
  if (!nama) return Alert.Warn("Nama daerah tidak boleh kosong");

  try {
    isLoading.value = true;
    const result = await store.dispatch("cariFaskes", {
      jenis_faskes: jenis,
      namafaskes: nama,
    });
    if (result.metaData?.code === "200") {
      hasFetched.value = true;
      Alert.Success(result.metaData?.message || "Data ditemukan");
    } else {
      Alert.Error(result.message || "Terjadi kesalahan");
    }
  } catch (error) {
    console.error("Gagal cari faskes:", error);
    Alert.Error("Gagal memuat data");
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="max-w-md">
    <div
      class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
    >
      <!-- Form -->
      <div class="px-4 pt-4 pb-3 border-b border-slate-100 flex flex-col gap-3">
        <div class="flex gap-2">
          <div class="flex flex-col flex-1">
            <label
              class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1"
            >
              Jenis Faskes
            </label>
            <input
              v-model="jenisFaskes"
              type="text"
              placeholder="cth: 1"
              class="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:border-blue-400  transition placeholder:text-slate-300"
            />
          </div>
          <div class="flex flex-col flex-1">
            <label
              class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1"
            >
              Nama Daerah
            </label>
            <input
              v-model="namaFaskes"
              type="text"
              placeholder="cth: blitar"
              class="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:border-blue-400  transition placeholder:text-slate-300"
              @keyup.enter="cariFaskes"
            />
          </div>
        </div>
        <button
          :disabled="isLoading"
          @click="cariFaskes"
          class="w-full flex items-center justify-center gap-1.5 py-1.5 bg-[#00366b] hover:bg-[#00295a] disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition"
        >
          <Search class="w-3.5 h-3.5" />
          Cari Faskes
        </button>
      </div>

      <DataTable
        v-if="hasFetched"
        :headers="columns"
        :items="faskesList"
        :search-value="search"
        :loading="isLoading"
        alternating
      >
        <template #item-kode="{ kode }">
          <div class="flex items-center">
            <span class="text-xs font-semibold text-slate-700">{{ kode }}</span>
          </div>
        </template>
      </DataTable>

      <div
        v-else
        class="flex flex-col items-center justify-center gap-2 py-10 text-slate-400"
      >
        <Search class="w-8 h-8" />
        <span class="text-xs">Masukkan jenis & nama daerah lalu klik Cari</span>
      </div>
    </div>
  </div>
</template>
