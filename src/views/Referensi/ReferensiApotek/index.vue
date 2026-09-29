<script setup>
import { ref, computed } from "vue";
import { useStore } from "vuex";
import { Search, Loader2 } from "lucide-vue-next";
import Alert from "../../../utils/Alert";

const store = useStore();
const kodeApotek = ref("");
const hasFetched = ref(false);
const isLoading = ref(false);

const apotekDetail = computed(() => store.state.apotek);
const isEmpty = computed(() => !apotekDetail.value?.kode);

const fields = [
  { label: "Kode", key: "kode" },
  { label: "Nama Apoteker", key: "namaapoteker" },
  { label: "Nama Kepala", key: "namakepala" },
  { label: "Jabatan Kepala", key: "jabatankepala" },
  { label: "NIP Kepala", key: "nipkepala" },
  { label: "SIUP", key: "siup" },
  { label: "Alamat", key: "alamat" },
  { label: "Kota", key: "kota" },
  { label: "Nama Verifikator", key: "namaverifikator" },
  { label: "NPP Verifikator", key: "nppverifikator" },
  { label: "Nama Petugas Apotek", key: "namapetugasapotek" },
  { label: "NIP Petugas Apotek", key: "nippetugasapotek" },
  { label: "Check Stock", key: "checkstock" },
];

const cariApotek = async () => {
  const kode = kodeApotek.value?.trim();
  if (!kode) return Alert.Warn("Kode apotek tidak boleh kosong");

  try {
    isLoading.value = true;
    const result = await store.dispatch("fetchApotek", { kode_apotek: kode });
    if (result.metaData?.code === "200") {
      hasFetched.value = true;
      Alert.Success(result.metaData?.message || "Data ditemukan");
    } else {
      Alert.Error(result.message || "Terjadi kesalahan");
    }
  } catch (error) {
    console.error("Gagal fetch apotek:", error);
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
        <div class="flex flex-col">
          <label
            class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1"
          >
            Kode Apotek
          </label>
          <input
            v-model="kodeApotek"
            type="text"
            placeholder="cth: 0211A010"
            class="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:border-blue-400 transition placeholder:text-slate-300"
            @keyup.enter="cariApotek"
          />
        </div>
        <button
          :disabled="isLoading"
          @click="cariApotek"
          class="w-full flex items-center justify-center gap-1.5 py-1.5 bg-[#00366b] hover:bg-[#00295a] disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition"
        >
          <Search class="w-3.5 h-3.5" />
          Cari Apotek
        </button>
      </div>

      <!-- Hasil -->
      <div v-if="hasFetched">
        <!-- Loading -->
        <div
          v-if="isLoading"
          class="flex items-center justify-center gap-2 py-10 text-slate-400"
        >
          <Loader2 class="w-5 h-5 animate-spin" />
          <span class="text-xs">Memuat data...</span>
        </div>

        <!-- Empty -->
        <div
          v-else-if="isEmpty"
          class="flex flex-col items-center justify-center gap-2 py-10 text-slate-300"
        >
          <Search class="w-8 h-8" />
          <span class="text-xs">Data tidak ditemukan</span>
        </div>

        <!-- Detail -->
        <div v-else class="divide-y divide-slate-50">
          <div
            v-for="field in fields"
            :key="field.key"
            class="flex items-start justify-between px-4 py-2.5"
          >
            <span
              class="text-[11px] font-semibold text-slate-400 uppercase tracking-wide w-2/5"
            >
              {{ field.label }}
            </span>
            <span class="text-xs text-slate-700 text-right w-3/5">
              {{ apotekDetail[field.key] || "-" }}
            </span>
          </div>
        </div>
      </div>

      <!-- Placeholder sebelum fetch -->
      <div
        v-else
        class="flex flex-col items-center justify-center gap-2 py-10 text-slate-300"
      >
        <Search class="w-8 h-8" />
        <span class="text-xs">Masukkan kode apotek lalu klik Cari</span>
      </div>
    </div>
  </div>
</template>
