<script setup>
import { ref, watch, reactive, computed } from "vue";
import { useStore } from "vuex";
import Alert from "../utils/Alert";
import BaseButton from "./BaseButton.vue";
import { useDebounceFn } from "@vueuse/core";

const props = defineProps({
  resepData: Object,
  mode: {
    type: String,
    default: "non",
  },
});
const emit = defineEmits(["saved", "reset"]);

const store = useStore();
const isLoading = ref(false);
const activeTab = ref(props.mode);

//Obat
const daftarObat = computed(() => store.state.obat);
const selectedObat = ref(null);
const showDropdown = ref(false);
const focusedIndex = ref(-1);
const itemRefs = ref([]);
const lastSelected = ref("");

const namaObat = ref("");
const kodeObat = ref("");
const hargaObat = ref();
const isSearching = ref(false);
const isSearched = ref(false);

const payloadObat = reactive({
  kd_jenis_obat: props.resepData?.kd_jenis_obat || "",
  tgl_resep: props.resepData?.tgl_resep || "",
  filter: "",
});

watch(
  () => props.resepData,
  (val) => {
    if (val) {
      payloadObat.kd_jenis_obat = val.kd_jenis_obat || "";
      payloadObat.tgl_resep = val.tgl_resep || "";
    }
  },
  { deep: true }
);

const resetObatState = () => {
  isSearched.value = false;
  showDropdown.value = false;
  selectedObat.value = null;
  namaObat.value = "";
  kodeObat.value = "";
  hargaObat.value = "";
  focusedIndex.value = -1;
};

const findObat = async () => {
  isSearching.value = true;
  await store.dispatch("findObat", payloadObat);
  isSearching.value = false;
  isSearched.value = true;
};

const debouncedSearch = useDebounceFn(() => {
  if (payloadObat.filter.trim().length >= 3) {
    findObat();
  } else {
    isSearched.value = false;
  }
}, 300);

watch(
  () => payloadObat.filter,
  (val) => {
    const trimmed = val.trim();

    if (!trimmed) {
      resetObatState();
      return;
    }

    if (trimmed !== lastSelected.value) {
      isSearched.value = false;
      showDropdown.value = true;
      focusedIndex.value = 0;
      debouncedSearch();
    }
  }
);

// Watch daftarObat update
watch(daftarObat, (list) => {
  itemRefs.value = [];
  focusedIndex.value = list.length > 0 ? 0 : -1;
});

// Scroll to focused item
watch(focusedIndex, (i) => {
  itemRefs.value[i]?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
});

const selectObat = (obat) => {
  if (!obat) return;
  isSearched.value = true;
  selectedObat.value = obat;
  payloadObat.filter = obat.nama;
  namaObat.value = obat.nama;
  kodeObat.value = obat.kode;
  hargaObat.value = obat.harga;
  showDropdown.value = false;
  lastSelected.value = obat.nama;
};

// NON RACIKAN
const signa = ref(1);
const signa2 = ref(1);
const hari = ref(30);
const catatan = ref("");
const jumlahObat = computed(
  () => Number(signa.value) * Number(signa2.value) * Number(hari.value)
);
const tagihan = computed(
  () => (Number(hargaObat.value) || 0) * jumlahObat.value
);

const payloadNon = reactive({
  nosjp: props.resepData?.no_apotek || "",
  noresep: props.resepData?.noresep || "",
  kdobat: "",
  nmobat: "",
  signa_satu: "",
  signa_dua: "",
  jmlobat: "",
  jho: "",
  catkhsobt: "",
  nosep: props.resepData?.no_sep || "",
  user_id: props.resepData?.user_id || "",
  apol_resep_detail_id: props.resepData?.apol_resep_id || "",
  harga: "",
});

watch(
  () => props.resepData,
  (val) => {
    if (val) {
      payloadNon.nosjp = val.no_apotek || "";
      payloadNon.noresep = val.noresep || "";
      payloadNon.nosep = val.no_sep || "";
      payloadNon.user_id = val.user_id || "";
      payloadNon.apol_resep_detail_id = val.apol_resep_id || "";
    }
  },
  { deep: true }
);

const SimpanObatNonRacikan = async () => {
  Object.assign(payloadNon, {
    signa_satu: signa.value,
    signa_dua: signa2.value,
    jmlobat: jumlahObat.value,
    jho: hari.value,
    catkhsobt: catatan.value,
    nmobat: namaObat.value,
    kdobat: kodeObat.value,
    harga: String(tagihan.value),
  });
  try {
    isLoading.value = true;
    const result = await store.dispatch("SimpanObatNon", payloadNon);
    if (result.metaData?.code == "200") {
      resetForm();
      emit("saved", result.response || []);
      Alert.Success(result.metaData?.message);
    } else {
      Alert.Error(result.metaData?.message);
    }
  } catch (err) {
    Alert.Error("Gagal simpan obat non racikan");
  } finally {
    isLoading.value = false;
  }
};

// RACIKAN
const signaRacikan = ref(1);
const signa2Racikan = ref(1);
const hariRacikan = ref(30);
const permintaanRacikan = ref(1);
const sedia = ref(1);
const jnsrobat = ref("R.01");
const catatanRacikan = ref("");
const jumlahRacikan = computed(
  () =>
    Number(signaRacikan.value) *
    Number(signa2Racikan.value) *
    Number(hariRacikan.value)
);
const jumlahObatRacikan = computed(
  () => Number(permintaanRacikan.value) * Number(jumlahRacikan.value)
);
const tagihanRacikan = computed(
  () => (Number(hargaObat.value) || 0) * jumlahObatRacikan.value
);

const payloadRacikan = reactive({
  nosjp: props.resepData?.no_apotek || "",
  noresep: props.resepData?.noresep || "",
  signa_satu: "",
  signa_dua: "",
  jmlobat: "",
  permintaan: "",
  sedia: "",
  jumlah_racikan: "",
  jho: "",
  catkhsobt: "",
  nosep: props.resepData?.no_sep || "",
  user_id: props.resepData?.user_id || "",
  harga: "",
  jnsrobt: jnsrobat.value,
  kdobat: kodeObat.value,
  nmobat: namaObat.value,
  apol_resep_detail_id: props.resepData?.apol_resep_id || 0,
});

watch(
  () => props.resepData,
  (val) => {
    if (val) {
      payloadRacikan.nosjp = val.no_apotek || "";
      payloadRacikan.noresep = val.noresep || "";
      payloadRacikan.nosep = val.no_sep || "";
      payloadRacikan.user_id = val.user_id || "";
      payloadRacikan.apol_resep_detail_id = val.apol_resep_id || 0;
    }
  },
  { deep: true }
);

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
    isLoading.value = true;
    const result = await store.dispatch("SimpanObatRacikan", payloadRacikan);
    if (result.metaData?.code === "200") {
      resetForm();
      emit("saved", result.response || []);
      Alert.Success(
        result.metaData?.message || "Obat racikan berhasil disimpan"
      );
    } else {
      Alert.Error(result.metaData?.message || "Gagal menyimpan obat racikan");
    }
  } catch (err) {
    Alert.Error("Terjadi kesalahan saat menyimpan racikan");
  } finally {
    isLoading.value = false;
  }
};

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
  emit("reset");
};
function handleKeydown(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    if (activeTab.value === "non") {
      SimpanObatNonRacikan();
    } else {
      SimpanObatRacikan();
    }
  }
  if (e.key === "Shift" && !e.repeat) {
    resetForm();
  }
}
</script>

<template>
  <div @keydown="handleKeydown">
    <!-- Tabs -->
    <div class="flex border-b border-gray-200 text-sm font-medium mb-4">
      <template
        v-for="tab in [
          { label: 'Non Racikan', value: 'non' },
          { label: 'Racikan', value: 'racikan' },
        ]"
        :key="tab.value"
      >
        <button
          @click="activeTab = tab.value"
          :class="[
            'flex-1 text-center py-2 rounded-t-lg transition',
            activeTab === tab.value
              ? 'border-b-2 border-[#00366b] text-[#00366b] font-semibold bg-blue-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
          ]"
        >
          {{ tab.label }}
        </button>
      </template>
    </div>

    <!-- NON RACIKAN -->
    <template v-if="activeTab === 'non'">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="text-sm font-medium text-gray-700 mb-1 block"
            >Jenis Racikan</label
          >
          <input
            type="text"
            value="Non Racikan"
            readonly
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-100 text-gray-600 cursor-not-allowed focus:outline-none"
          />
        </div>
        <div class="relative">
          <label class="text-sm font-medium text-gray-700 mb-1 block"
            >Nama Obat</label
          >
          <input
            type="text"
            v-model="payloadObat.filter"
            placeholder="Ketik nama obat..."
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none"
            @focus="
              showDropdown = true;
              focusedIndex = 0;
            "
            @blur="setTimeout(() => (showDropdown = false), 200)"
            @keydown.up.prevent="focusedIndex = Math.max(focusedIndex - 1, 0)"
            @keydown.down.prevent="
              focusedIndex = Math.min(focusedIndex + 1, daftarObat.length - 1)
            "
            @keydown.space.prevent="selectObat(daftarObat[focusedIndex])"
          />
          <ul
            v-if="showDropdown && isSearched && !isSearching"
            class="absolute z-10 bg-white border border-gray-200 rounded-md shadow-md mt-1 w-full max-h-60 overflow-auto text-sm"
          >
            <li
              v-if="daftarObat.length === 0"
              class="px-3 py-2 text-gray-500 italic"
            >
              Obat tidak ditemukan
            </li>
            <li
              v-for="(obat, index) in daftarObat"
              :key="obat.kode"
              :ref="(el) => (itemRefs[index] = el)"
              @click="selectObat(obat)"
              :class="[
                'px-3 py-2 cursor-pointer',
                index === focusedIndex ? 'bg-blue-100' : 'hover:bg-blue-50',
              ]"
            >
              {{ obat.nama }}
            </li>
          </ul>
        </div>
        <div class="grid grid-cols-3 gap-3 items-end">
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block"
              >Signa</label
            >
            <input
              type="number"
              v-model="signa"
              min="1"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none"
            />
          </div>
          <div>
            <input
              type="number"
              v-model="signa2"
              min="1"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none"
            />
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block"
              >Hari</label
            >
            <input
              type="number"
              v-model="hari"
              min="1"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label class="text-sm font-medium text-gray-700 mb-1 block"
            >Jumlah Obat</label
          >
          <input
            type="number"
            v-model="jumlahObat"
            readonly
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-100 text-gray-600 cursor-not-allowed focus:outline-none"
          />
        </div>
        <div>
          <label class="text-sm font-medium text-gray-700 mb-1 block"
            >By Tagihan</label
          >
          <input
            type="text"
            v-model="tagihan"
            readonly
            placeholder="Rp "
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none"
          />
        </div>
        <div>
          <label
            class="text-sm font-medium border-gray-300 text-gray-700 mb-1 block"
            >Catatan Khusus</label
          >
          <input
            type="text"
            v-model="catatan"
            placeholder="Masukkan catatan tambahan (opsional)"
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none"
          />
        </div>
      </div>
    </template>

    <!-- RACIKAN -->
    <template v-else>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="text-sm font-medium text-gray-700 mb-1 block"
            >Jenis Racikan</label
          >
          <input
            type="text"
            value="Racikan"
            readonly
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-100 text-gray-600 cursor-not-allowed focus:outline-none"
          />
        </div>
        <div class="relative">
          <label class="text-sm font-medium text-gray-700 mb-1 block"
            >Nama Obat</label
          >
          <input
            type="text"
            v-model="payloadObat.filter"
            placeholder="Ketik nama obat..."
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none"
            @focus="
              showDropdown = true;
              focusedIndex = 0;
            "
            @blur="setTimeout(() => (showDropdown = false), 200)"
            @keydown.up.prevent="focusedIndex = Math.max(focusedIndex - 1, 0)"
            @keydown.down.prevent="
              focusedIndex = Math.min(focusedIndex + 1, daftarObat.length - 1)
            "
            @keydown.space.prevent="selectObat(daftarObat[focusedIndex])"
          />
          <ul
            v-if="showDropdown && isSearched && !isSearching"
            class="absolute z-10 bg-white border border-gray-200 rounded-md shadow-md mt-1 w-full max-h-60 overflow-auto text-sm"
          >
            <li
              v-if="daftarObat.length === 0"
              class="px-3 py-2 text-gray-500 italic"
            >
              Obat tidak ditemukan
            </li>
            <li
              v-for="(obat, index) in daftarObat"
              :key="obat.kode"
              :ref="(el) => (itemRefs[index] = el)"
              @click="selectObat(obat)"
              :class="[
                'px-3 py-2 cursor-pointer',
                index === focusedIndex ? 'bg-blue-100' : 'hover:bg-blue-50',
              ]"
            >
              {{ obat.nama }}
            </li>
          </ul>
        </div>
        <div class="grid grid-cols-3 gap-3 items-end">
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block"
              >Signa</label
            >
            <input
              type="number"
              v-model="signaRacikan"
              min="1"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none"
            />
          </div>
          <div>
            <input
              type="number"
              v-model="signa2Racikan"
              min="1"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none"
            />
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block"
              >Hari</label
            >
            <input
              type="number"
              v-model="hariRacikan"
              min="1"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none"
            />
          </div>
        </div>
        <div class="grid grid-cols-3 gap-3 items-end">
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block"
              >Permintaan Racikan</label
            >
            <input
              type="number"
              v-model="permintaanRacikan"
              min="1"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none"
            />
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block"
              >Sedia</label
            >
            <input
              type="number"
              v-model="sedia"
              readonly
              min="1"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-100 text-gray-600 cursor-not-allowed focus:outline-none"
            />
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block"
              >Jumlah Racikan</label
            >
            <input
              type="number"
              v-model="jumlahRacikan"
              readonly
              min="1"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-100 text-gray-600 cursor-not-allowed focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label class="text-sm font-medium text-gray-700 mb-1 block"
            >Jumlah Obat</label
          >
          <input
            type="number"
            v-model="jumlahObatRacikan"
            readonly
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-100 text-gray-600 cursor-not-allowed focus:outline-none"
          />
        </div>
        <div>
          <label class="text-sm font-medium text-gray-700 mb-1 block"
            >By Tagihan</label
          >
          <input
            type="text"
            v-model="tagihanRacikan"
            readonly
            placeholder="Rp "
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none"
          />
        </div>
        <div>
          <label class="text-sm font-medium text-gray-700 mb-1 block"
            >Catatan Khusus</label
          >
          <input
            type="text"
            v-model="catatanRacikan"
            placeholder="Masukkan catatan tambahan (opsional)"
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none"
          />
        </div>
        <div>
          <label class="text-sm font-medium text-gray-700 mb-1 block"
            >Jenis Racikan Obat</label
          >
          <input
            type="text"
            v-model="jnsrobat"
            placeholder="Masukkan jenis racikan (opsional)"
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none"
          />
        </div>
      </div>
    </template>

    <!-- Tombol -->
    <div class="flex gap-3 mt-6">
      <template v-if="activeTab === 'non'">
        <BaseButton
          :loading="isLoading"
          @click="SimpanObatNonRacikan"
          type="submit"
          label="Simpan Non Racikan"
          variant="primary"
          class="flex-1"
        />
      </template>
      <template v-else>
        <BaseButton
          :loading="isLoading"
          @click="SimpanObatRacikan"
          type="submit"
          label="Simpan Racikan"
          variant="primary"
          class="flex-1"
        />
      </template>
      <BaseButton
        @click="resetForm"
        type="submit"
        label="Reset"
        variant="slate"
        class="flex-1"
      />
    </div>
  </div>
</template>
