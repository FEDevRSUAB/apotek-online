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
const kodePoli = ref("");
const hasFetched = ref(false);

const poliList = computed(() => store.state.poli || []);
const isLoading = ref(false);

const columns = [
  { text: "KODE", value: "kode" },
  { text: "NAMA", value: "nama" },
];

const cariPoli = async () => {
  const kode = kodePoli.value?.toString().trim();
  if (!kode) return Alert.Warn("Kode poli tidak boleh kosong");

  try {
    isLoading.value = true;
    const result = await store.dispatch("fetchPoli", { poli: kode });
    if (result.metaData?.code === "200") {
      hasFetched.value = true;
      Alert.Success(result.metaData?.message || "Data ditemukan");
    } else {
      Alert.Error(result.message || "Terjadi kesalahan");
    }
  } catch (error) {
    console.error("Gagal fetch poli:", error);
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
              Kode Poli
            </label>
            <input
              v-model="kodePoli"
              type="text"
              placeholder="cth: PAR"
              class="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition placeholder:text-slate-300"
              @keyup.enter="cariPoli"
            />
          </div>
        </div>
        <button
          :disabled="isLoading"
          @click="cariPoli"
          class="w-full flex items-center justify-center gap-1.5 py-1.5 bg-[#00366b] hover:bg-[#00295a] disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition"
        >
          <Search class="w-3.5 h-3.5" />
          Cari Poli
        </button>
      </div>

      <DataTable
        v-if="hasFetched"
        :headers="columns"
        :items="poliList"
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
        class="flex flex-col items-center justify-center gap-2 py-10 text-slate-300"
      >
        <Search class="w-8 h-8" />
        <span class="text-xs">Masukkan kode poli lalu klik Cari</span>
      </div>
    </div>
  </div>
</template>
