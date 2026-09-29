<script setup>
import { ref, computed, reactive, watch } from "vue";
import { useStore } from "vuex";
import { Search, Save, RotateCcw, Loader2 } from "lucide-vue-next";
import Alert from "../../../utils/Alert";
import { normalizeDateTime, getDateTimeLocal } from "../../../utils/moment";
import CariSEP from "../PelayananObat/CariSEP.vue";
import BaseButton from "../../../components/BaseButton.vue";

const emit = defineEmits(["update:collapsedMain"]);
const props = defineProps({ collapsedMain: Boolean });

const store = useStore();

const dataPeserta = ref([]);
const dataPoli = ref("");
const riwayatResep = ref([]);
const pxid = computed(() => store.state.pxid);

const isBpjsDown = ref(false);
const isActive = ref(false);
const isPRB = ref(false);
const jnspelayanan = ref("");
const namaPx = ref("");

const isLoadingCariSEP = ref(false);
const isLoadingNoResep = ref(false);
const isLoadingSimpanResep = ref(false);
const dateOnly = getDateTimeLocal().slice(0, 10);
const toApiFormat = (val) => (val ? val.slice(0, 10) + " 00:00:00" : "");

const poliSearchOptions = ref([]);
const isLoadingPoli = ref(false);
let poliDebounceTimer = null;

const formData = reactive({
  tglsjp: "",
  refasalsjp: "",
  polirsp: "",
  kdjnsobat: "",
  noresep: "",
  idusersjp: "",
  tglrsp: "",
  // tglpelrsp: "",
  kddokter: "",
  iterasi: "",
  pxid: "",
});

const riwayatSEP = computed(
  () => store.state.detailSep?.response?.riwayat?.resep ?? [],
);

watch(dataPeserta, (val) => {
  isPRB.value =
    (val.flagprb == "1" || val.peserta.potensiPRB == "True") && !!val.noSep;
  jnspelayanan.value = val.jnsPelayanan || "";
  namaPx.value = val?.peserta?.nama;
});

const isLimitResepSEP = computed(() => {
  const noSep = dataPeserta.value?.noSep;

  console.log("SEP Peserta:", noSep);
  console.log("Riwayat Resep:", riwayatResep.value);

  if (!noSep || !Array.isArray(riwayatResep.value)) return false;

  const matchedResep = riwayatResep.value.filter(
    (item) => item.no_sep === noSep,
  );

  console.log("Resep dengan SEP yang sama:", matchedResep);
  console.log("Jumlah resep SEP yang sama:", matchedResep.length);

  return matchedResep.length >= 3;
});

const cariNoResep = async () => {
  try {
    isLoadingNoResep.value = true;
    const result = await store.dispatch("getNoResep");
    if (result?.metaData?.code == 200) {
      formData.noresep = result.response || "";
    } else {
      Alert.Error("Gagal mendapatkan nomor resep");
    }
  } catch (err) {
    console.error("Error fetching nomor resep:", err);
    Alert.Error("Terjadi kesalahan saat mengambil nomor resep");
  } finally {
    isLoadingNoResep.value = false;
  }
};

const FetchSEP = async () => {
  if (!formData.refasalsjp.trim())
    return Alert.Warn("No SEP tidak boleh kosong");

  isBpjsDown.value = false;
  isLoadingCariSEP.value = true;
  try {
    const result = await store.dispatch("fetchSEP", formData.refasalsjp);
    console.log("Fetch SEP Result:", result);

    if (!result || Object.keys(result).length === 0 || !result.metaData) {
      isBpjsDown.value = true;
      Alert.Warn("Mohon maaf server BPJS sedang down");
      return;
    }

    const meta = result?.metaData;

    if (meta?.code == 200) {
      dataPeserta.value = result?.response?.sep?.response;
      dataPoli.value = result?.response?.sep?.response?.poli;
      const riwayatRaw = result.response?.riwayat;
      riwayatResep.value =
        Array.isArray(riwayatRaw) && riwayatRaw.length > 0
          ? riwayatRaw
          : (result.response?.riwayat_bpjs ?? []);

      isActive.value = result.response?.peserta?.keterangan === "AKTIF";

      Alert.Success(meta.message || "Data ditemukan");

      const dokter = result?.response?.dokter;
      formData.tglsjp = getDateTimeLocal();
      // formData.tglpelrsp = dateOnly + " 00:00:00";
      formData.tglrsp = dateOnly + " 00:00:00";
      formData.idusersjp = "0211R004hermawan";
      formData.kddokter = dokter.kode_dokter;
      formData.pxid = pxid.value;
      formData.kdjnsobat = "2";
      await cariNoResep();
      await cariPoli();
      if (riwayatResep.value.length > 0) emit("update:collapsedMain", true);
      if (isActive.value) {
        Alert.Success("Status peserta aktif");
      } else {
        Alert.Warn("Status peserta tidak aktif");
      }
    } else {
      Alert.Error(meta?.message ?? result?.message ?? "Terjadi kesalahan");
    }
  } catch {
    Alert.Error("Gagal mengambil SEP");
  } finally {
    isLoadingCariSEP.value = false;
  }
};

const handleFetchSEP = async (sepValue) => {
  formData.refasalsjp = sepValue;
  await FetchSEP();
};

const fetchPoliOptions = async (keyword) => {
  isLoadingPoli.value = true;
  try {
    const result = await store.dispatch("fetchPoli", { poli: keyword });
    poliSearchOptions.value = result?.response?.list || [];
  } catch {
    poliSearchOptions.value = [];
  } finally {
    isLoadingPoli.value = false;
  }
};

const cariPoli = async () => {
  const poliNama = dataPoli.value?.trim().toUpperCase();
  if (!poliNama) return;

  if (poliNama === "INSTALASI GAWAT DARURAT") {
    formData.polirsp = "IGD";
    return;
  }

  await fetchPoliOptions(poliNama);

  const match = poliSearchOptions.value.find(
    (p) => p.nama?.trim().toUpperCase() === poliNama,
  );
  if (match) {
    formData.polirsp = match.kode;
  } else if (poliSearchOptions.value.length === 1) {
    formData.polirsp = poliSearchOptions.value[0].kode;
  }
};

const handleFocusPoli = () => {
  if (isLoadingPoli.value) return;
  if (poliSearchOptions.value.length) return;

  const keyword = formData.polirsp?.trim() || dataPoli.value?.trim();
  if (keyword) fetchPoliOptions(keyword);
};

const handleInputPoli = (val) => {
  formData.polirsp = val;
  clearTimeout(poliDebounceTimer);

  const sudahDipilih = poliSearchOptions.value.some((p) => p.kode === val);
  if (sudahDipilih) return;

  const keyword = val.trim();
  if (keyword.length <= 2) {
    poliSearchOptions.value = [];
    return;
  }

  poliDebounceTimer = setTimeout(() => fetchPoliOptions(keyword), 400);
};

const simpanResep = async () => {
  const payload = {
    ...formData,
    tglrsp: toApiFormat(formData.tglrsp),
    tglpelrsp: toApiFormat(formData.tglrsp),
    // tglpelrsp: toApiFormat(formData.tglpelrsp),
    tglsjp: normalizeDateTime(formData.tglsjp),
  };

  if (isLimitResepSEP.value) {
    Alert.Error("Maaf, jumlah resep sudah melebihi batas maksimal (3 resep).");
    return;
  }
  try {
    isLoadingSimpanResep.value = true;
    const result = await store.dispatch("SimpanResep", payload);
    console.log("result simpan", result);
    if (result.response.code == "200") {
      await store.dispatch("fetchSEP", formData.refasalsjp);
      store.dispatch("setPxid", formData.pxid);
      Alert.Success(result.response.message || "Berhasil membuat resep");
      emit("update:collapsedMain", true);
      resetForm();
    } else if (result.response.code == "201") {
      Alert.Error(result.response.message);
    } else {
      Alert.Error(result.response.metaData.message);
    }
  } catch (err) {
    Alert.Error("Terjadi kesalahan saat menyimpan.");
  } finally {
    isLoadingSimpanResep.value = false;
  }
};

const resetForm = () => {
  Object.keys(formData).forEach((key) => (formData[key] = ""));
  isPRB.value = false;
  jnspelayanan.value = "";
  namaPx.value = "";
  poliSearchOptions.value = [];
};
</script>

<template>
  <div class="flex flex-row gap-4 transition-all duration-300">
    <div class="flex flex-col gap-4 pb-4 pl-4 transition-all duration-300">
      <!-- Atas -->
      <div
        v-show="!collapsedMain"
        class="w-full md:max-w-lg space-y-4 transition-all duration-300"
      >
        <!-- Cari SEP Pasien -->
        <CariSEP @fetch-sep="handleFetchSEP" />
      </div>

      <!-- Bawah -->
      <div
        :class="[
          !collapsedMain ? 'max-w-lg' : 'w-full',
          'bg-white shadow-lg rounded-2xl p-4 transition-all duration-300',
        ]"
      >
        <form
          @submit.prevent="simpanResep"
          class="grid grid-cols-2 gap-x-3 gap-y-2.5"
        >
          <span
            v-if="jnspelayanan"
            class="col-span-2 -mt-1 mb-1 text-xs text-right text-slate-700"
          >
            <span class="text-red-500 font-bold">*</span>
            Jenis Pasien:
            <span class="ml-1 font-semibold text-blue-700">{{
              jnspelayanan
            }}</span>
          </span>

          <!-- No SEP -->
          <div>
            <label
              class="block text-[11px] font-medium text-slate-600 mb-1 uppercase tracking-wide"
              >No SEP</label
            >
            <div class="flex gap-1.5">
              <input
                v-model="formData.refasalsjp"
                type="text"
                placeholder="Masukkan No SEP"
                class="w-full border border-slate-200 rounded-md px-2.5 h-8 text-[12.5px] outline-none focus:ring focus:ring-[#00366b]/30"
              />
              <button
                type="button"
                @click="FetchSEP"
                :disabled="isLoadingCariSEP"
                class="items-center gap-1.5 px-2.5 h-8 bg-[#00366b] hover:bg-[#00488f] disabled:opacity-60 text-white text-[12.5px] font-medium rounded-md transition-colors"
              >
                <Loader2
                  v-if="isLoadingCariSEP"
                  :size="13"
                  class="animate-spin"
                />
                <Search v-else :size="13" />
              </button>
            </div>
          </div>

          <!-- Nama -->
          <div>
            <label
              class="block text-[11px] font-medium text-slate-600 mb-1 uppercase tracking-wide"
              >Nama Pasien</label
            >
            <input
              v-model="namaPx"
              type="text"
              class="w-full border border-slate-200 rounded-md px-2.5 h-8 text-[12.5px] text-slate-700 outline-none focus:ring focus:ring-[#00366b]/30"
            />
          </div>

          <!-- Tanggal SJP -->
          <div>
            <label
              class="block text-[11px] font-medium text-slate-600 mb-1 uppercase tracking-wide"
              >Tanggal SJP</label
            >
            <input
              type="datetime-local"
              v-model="formData.tglsjp"
              class="w-full border border-slate-200 rounded-md px-2.5 h-8 text-[12.5px] outline-none focus:ring focus:ring-[#00366b]/30"
            />
          </div>

          <!-- Id User -->
          <div>
            <label
              class="block text-[11px] font-medium text-slate-600 mb-1 uppercase tracking-wide"
              >Id User</label
            >
            <input
              v-model="formData.idusersjp"
              type="text"
              class="w-full border border-slate-200 rounded-md px-2.5 h-8 text-[12.5px] text-slate-700 outline-none focus:ring focus:ring-[#00366b]/30"
            />
          </div>

          <!-- Nomor Resep -->
          <div>
            <label
              class="block text-[11px] font-medium text-slate-600 mb-1 uppercase tracking-wide"
              >Nomor Resep</label
            >
            <div class="flex gap-1.5">
              <input
                v-model="formData.noresep"
                type="text"
                class="w-full border border-slate-200 rounded-md px-2.5 h-8 text-[12.5px] text-slate-700 outline-none focus:ring focus:ring-[#00366b]/30"
              />
              <button
                type="button"
                @click="cariNoResep"
                :disabled="isLoadingNoResep"
                class="items-center gap-1.5 px-2.5 h-8 bg-[#00366b] hover:bg-[#00488f] disabled:opacity-60 text-white text-[12.5px] font-medium rounded-md transition-colors"
              >
                <Loader2
                  v-if="isLoadingNoResep"
                  :size="13"
                  class="animate-spin"
                />
                <RotateCcw v-else :size="13" />
              </button>
            </div>
          </div>

          <!-- Tanggal Resep -->
          <div>
            <label
              class="block text-[11px] font-medium text-slate-600 mb-1 uppercase tracking-wide"
              >Tanggal Resep</label
            >
            <input
              type="datetime-local"
              v-model="formData.tglrsp"
              class="w-full border border-slate-200 rounded-md px-2.5 h-8 text-[12.5px] text-slate-700 outline-none focus:ring focus:ring-[#00366b]/30"
            />
          </div>

          <!-- Tanggal Pelayanan Resep -->
          <div>
            <label
              class="block text-[11px] font-medium text-slate-600 mb-1 uppercase tracking-wide"
              >Tanggal Pelayanan Resep</label
            >
            <input
              type="datetime-local"
              v-model="formData.tglrsp"
              class="w-full border border-slate-200 rounded-md px-2.5 h-8 text-[12.5px] text-slate-700 outline-none focus:ring focus:ring-[#00366b]/30"
            />
          </div>

          <!-- Poli -->
          <div>
            <label
              class="block text-[11px] font-medium text-slate-600 mb-1 uppercase tracking-wide"
              >Poli</label
            >
            <input
              list="poli-datalist"
              :value="formData.polirsp"
              @input="handleInputPoli($event.target.value)"
              @focus="handleFocusPoli"
              type="text"
              placeholder="Klik untuk cari poli"
              autocomplete="off"
              class="w-full border border-slate-200 rounded-md px-2.5 h-8 text-[12.5px] text-slate-700 outline-none focus:ring focus:ring-[#00366b]/30"
              :class="isLoadingPoli ? 'opacity-60' : ''"
            />
            <datalist id="poli-datalist">
              <option
                v-for="poli in poliSearchOptions"
                :key="poli.kode"
                :value="poli.kode"
                :label="poli.nama"
              />
            </datalist>
          </div>

          <!-- Jenis Resep -->
          <div>
            <label
              class="block text-[11px] font-medium text-slate-600 mb-1 uppercase tracking-wide"
            >
              Jenis Resep
              <span
                v-if="isPRB"
                class="normal-case text-[10px] text-blue-600 ml-1"
                >*) Potensi PRB</span
              >
            </label>
            <select
              v-model="formData.kdjnsobat"
              class="w-full border border-slate-200 rounded-md px-2.5 h-8 text-[12.5px] text-slate-700 outline-none focus:ring focus:ring-[#00366b]/30"
            >
              <option value="1">Obat PRB</option>
              <option value="2">Obat Kronis Belum Stabil</option>
              <option value="3">Obat Kemoterapi</option>
            </select>
          </div>

          <!-- Kode Dokter -->
          <div>
            <label
              class="block text-[11px] font-medium text-slate-600 mb-1 uppercase tracking-wide"
              >Kode Dokter</label
            >
            <input
              v-model="formData.kddokter"
              type="text"
              class="w-full border border-slate-200 rounded-md px-2.5 h-8 text-[12.5px] text-slate-700 outline-none focus:ring focus:ring-[#00366b]/30"
            />
          </div>

          <!-- Iterasi -->
          <div>
            <label
              class="block text-[11px] font-medium text-slate-600 mb-1 uppercase tracking-wide"
              >Iterasi</label
            >
            <select
              v-model="formData.iterasi"
              class="w-full border border-slate-200 rounded-md px-2.5 h-8 text-[12.5px] text-slate-700 outline-none focus:ring focus:ring-[#00366b]/30"
            >
              <option value="0">Tanpa Iterasi</option>
              <option value="1">Iterasi</option>
            </select>
          </div>

          <!-- PX Id -->
          <div>
            <label
              class="block text-[11px] font-medium text-slate-600 mb-1 uppercase tracking-wide"
              >PX Id</label
            >
            <input
              v-model="formData.pxid"
              type="text"
              class="w-full border border-slate-200 rounded-md px-2.5 h-8 text-[12.5px] text-slate-700 focus:outline-none focus:ring focus:ring-[#00366b]/30"
            />
          </div>

          <!-- Tombol Aksi -->
          <div class="col-span-2 flex justify-end gap-2 mt-3">
            <BaseButton
              type="submit"
              :disabled="isLoadingSimpanResep"
              label="Simpan"
              variant="primary"
              :loading="isLoadingSimpanResep"
            />
            <BaseButton
              type="button"
              @click="resetForm"
              label="Reset"
              variant="slate"
            />
          </div>
        </form>

        <!-- Info Box -->
        <div
          class="mt-3 bg-blue-50 border border-blue-200 p-3 rounded-xl text-slate-700"
        >
          <p class="text-[11px] font-semibold mb-1.5">ℹ️ Keterangan:</p>
          <ul class="space-y-0.5 list-disc ml-4 text-[10.5px]">
            <li>
              <strong>Tgl Entry:</strong> Tanggal resep dientri/dicetak ke
              aplikasi
            </li>
            <li>
              <strong>Tgl Resep:</strong> Tanggal tertera pada lembar resep
            </li>
            <li>
              <strong>Tgl Pelayanan:</strong> Tanggal saat resep dilayani oleh
              Apotek
            </li>
            <li>
              <strong>Validasi:</strong> Tgl SEP -
              <span class="text-blue-600 font-semibold">15 Hari</span> ≤ Tgl RSP
              ≤ Tgl SEP
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
