<script setup>
import { ref, computed, watch, onMounted, nextTick } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import {
  Pill,
  Download,
  ClipboardPaste,
  ClipboardList,
  ReceiptText,
  X,
  SquareArrowDownRight,
  PenLine,
} from "lucide-vue-next";
import SignaturePad from "signature_pad";
import Alert from "../../../utils/Alert";
import BaseButton from "../../../components/BaseButton.vue";
import Loader from "../../../components/Loader.vue";
import ModalRiwayatPelayanan from "./ModalRiwayatPelayanan.vue";
import { getTodayFormat } from "../../../utils/moment.js";

const emit = defineEmits(["fetch-sep"]);

const store = useStore();
const router = useRouter();
const pasienData = computed(() => store.state.pasienData || []);
const error = computed(() => store.state.error);

const id = ref("");
const isSearching = ref(false);
const isLoading = ref(false);
const isDownloadingKlaim = ref(false);
const isLoadingSEPList = ref(false);
const SEPList = ref([]);
const showSEPModal = ref(false);
const selectedPxId = ref(null);

const showRiwayatModal = ref(false);
const riwayatModalRef = ref(null);

const showSignModal = ref(false);
const signaturePad = ref(null);
const signPxId = ref(null);
const isSubmittingSign = ref(false);

const showPdfModal = ref(false);
const pdfUrl = ref("");

const openRiwayatPelayanan = (nokartu) => {
  router.push({
    path: "/riwayat-pelayanan",
    query: { search: nokartu },
  });
};

const copyToClipboard = async (text) => {
  if (!text) return Alert.Warn("Tidak ada teks yang bisa disalin.");
  try {
    await navigator.clipboard.writeText(text);
    Alert.Success("Nomor SEP berhasil disalin.");
  } catch (err) {
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    Alert.Success(text + " berhasil disalin");
  }
};

const safeParse = (data) => {
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

const parsedPasien = (p) => {
  const parsed = safeParse(p.data);
  return {
    nama: parsed?.peserta?.nama || p.Nama || "Nama tidak tersedia",
    sep: parsed?.noSep || p.nomor || "-",
    kartu: parsed?.peserta?.noKartu || p.NoKartuBpjs || "-",
    rm: parsed?.peserta?.noMr || p.Register || "-",
    tglSep: parsed?.tglSep || "-",
    jnsPelayanan: parsed?.jnsPelayanan || "-",
  };
};

const fetchSEPList = async (norm) => {
  isLoadingSEPList.value = true;
  try {
    const result = await store.dispatch("fetchSEPList", norm);
    if (result) {
      SEPList.value = result;
    } else {
      throw new Error("Gagal fetch SEP list");
    }
  } catch (err) {
    console.error("[FETCH SEP LIST] Error:", err);
    throw err;
  } finally {
    isLoadingSEPList.value = false;
  }
};

const openSEPModal = async (rm, pxId) => {
  selectedPxId.value = pxId;
  await fetchSEPList(rm);
  showSEPModal.value = true;
};

const insertSEP = async (nomor) => {
  const confirm = await Alert.Confirm({
    title: "Insert SEP",
    text: `Apa anda yakin menginsert SEP dengan nomor ${nomor} ?`,
    confirmButtonText: "Ya, Insert",
    cancelButtonText: "Batal",
  });

  if (!confirm.isConfirmed) return;
  const payload = {
    pxid: id.value,
    nosep: nomor,
  };
  try {
    const res = await store.dispatch("insertSEP", payload);
    if (res?.code == 200) {
      await FetchSep();
      Alert.Success(res?.response || "Berhasil insert SEP");
    }
  } catch (error) {
    console.error(error);
    Alert.Error("Terjadi kesalahan saat insert SEP");
  } finally {
    showSEPModal.value = false;
  }
};

const FetchSep = async () => {
  if (!id.value) return;
  isLoading.value = true;
  isSearching.value = true;

  try {
    const result = await store.dispatch("fetchPasienData", id.value);
    const hasData = Array.isArray(result)
      ? result.length > 0 && result.some((r) => r !== null)
      : result !== null && result !== undefined;

    if (hasData) {
      store.dispatch("setPxid", id.value.trim());
    }
  } catch (err) {
    console.error("[FETCH PASIEN] Error:", err);
  } finally {
    isLoading.value = false;
  }
};

watch(id, () => {
  isSearching.value = false;
});

const generateSEP = async (pxid) => {
  try {
    const result = await store.dispatch("generateSEP", pxid);
    result?.response?.code == 200 && result.response
      ? Alert.Success("SEP berhasil digenerate ke PDF")
      : Alert.Error(result?.metadata?.message || "Gagal generate SEP");
  } catch {
    Alert.Error("Terjadi kesalahan saat generate SEP");
  }
};

const getBillingFarmasi = async (pxid) => {
  try {
    const result = await store.dispatch("billingFarmasi", pxid);
    result?.response?.code == 200 && result.response
      ? Alert.Success("Billing Farmasi berhasil digenerate ke PDF")
      : Alert.Error(
          result?.metadata?.message || "Gagal mengambil billing farmasi",
        );
  } catch {
    Alert.Error("Terjadi kesalahan saat mengambil billing farmasi");
  }
};

const generateResep = async (pxid) => {
  try {
    const result = await store.dispatch("generateResep", pxid);
    result?.response?.code == 200 && result.response
      ? Alert.Success("Resep berhasil digenerate ke PDF")
      : Alert.Error(result?.metadata?.message || "Gagal generate resep");
  } catch {
    Alert.Error("Terjadi kesalahan saat generate resep");
  }
};

const cekPenyerahanObat = async (pxid) => {
  try {
    const result = await store.dispatch("cekPenyerahanObat", pxid);
    if (result === null) {
      Alert.Warn("Penyerahan obat belum ditandatangani");
    } else if (result?.code === 200) {
      Alert.Success("Status penyerahan obat sudah ditanda-tangani");
    }
  } catch {
    Alert.Error("Terjadi kesalahan saat cek penyerahan obat.");
  }
};

const downloadKlaim = async (pxid) => {
  if (!pxid) {
    Alert.Warn("PXID tidak boleh kosong");
    return;
  }

  isDownloadingKlaim.value = true;

  try {
    await store.dispatch("generateSEP", pxid);
    await store.dispatch("billingFarmasi", pxid);
    await store.dispatch("generateResep", pxid);
    await store.dispatch("cekPenyerahanObat", pxid);

    const blob = await store.dispatch("fetchKlaimDokumen", { pxid });

    if (blob) {
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } else {
      Alert.Error("Dokumen klaim masih belum tersedia setelah generate");
    }
  } catch (error) {
    Alert.Error("Gagal mengambil dokumen klaim: " + error.message);
  } finally {
    isDownloadingKlaim.value = false;
  }
};

const openRiwayatModal = (nokartu) => {
  showRiwayatModal.value = true;
  nextTick(() => riwayatModalRef.value?.open(nokartu));
};

const resizeCanvas = (canvas) => {
  const ratio = Math.max(window.devicePixelRatio || 1, 1);
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;
  canvas.getContext("2d").scale(ratio, ratio);
};

const canvasInit = () => {
  const canvas = document.querySelector("#sign-canvas");
  resizeCanvas(canvas);
  return new SignaturePad(canvas, {
    dotSize: 3.2,
    minWidth: 3,
    penColor: "rgb(15, 23, 42)",
  });
};

const openSignModal = (pxid) => {
  signPxId.value = pxid;
  showSignModal.value = true;
  nextTick(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        signaturePad.value = canvasInit();
      });
    });
  });
};

const clearSignature = () => {
  signaturePad.value?.clear();
};

const trimCanvas = (canvas) => {
  const ctx = canvas.getContext("2d");
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  let top = null,
    bottom = null,
    left = null,
    right = null;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = pixels[(y * width + x) * 4 + 3];
      if (alpha > 0) {
        if (top === null) top = y;
        bottom = y;
        if (left === null || x < left) left = x;
        if (right === null || x > right) right = x;
      }
    }
  }

  if (top === null) return canvas;

  const trimmedWidth = right - left + 1;
  const trimmedHeight = bottom - top + 1;

  const trimmedCanvas = document.createElement("canvas");
  trimmedCanvas.width = trimmedWidth;
  trimmedCanvas.height = trimmedHeight;
  trimmedCanvas
    .getContext("2d")
    .putImageData(
      ctx.getImageData(left, top, trimmedWidth, trimmedHeight),
      0,
      0,
    );

  return trimmedCanvas;
};

const uploadSignature = async () => {
  if (!signaturePad.value || signaturePad.value.isEmpty()) {
    Alert.Warn("Tanda tangan belum diisi.");
    return;
  }

  const originalCanvas = document.querySelector("#sign-canvas");
  const trimmedCanvas = trimCanvas(originalCanvas);

  const ttd = trimmedCanvas
    .toDataURL("image/png")
    .replace("data:image/png;base64,", "");

  isSubmittingSign.value = true;

  try {
    const blob = await store.dispatch("insertEsign", {
      pxid: signPxId.value,
      tanggal: getTodayFormat("DD-MM-YYYY"),
      ttd,
    });

    console.log("insertEsign:", blob);

    if (!blob) {
      Alert.Error("Gagal menyimpan tanda tangan");
      return;
    }

    pdfUrl.value = URL.createObjectURL(blob);
    showSignModal.value = false;
    showPdfModal.value = true;
    Alert.Success("Tanda tangan berhasil disimpan");
  } catch (error) {
    Alert.Error(
      error?.message || "Terjadi kesalahan saat menyimpan tanda tangan",
    );
  } finally {
    isSubmittingSign.value = false;
  }
};
</script>

<template>
  <!-- Form Pencarian -->
  <form @submit.prevent="FetchSep" class="bg-white shadow-lg rounded-2xl p-4">
    <label class="block text-sm font-medium text-slate-600 mb-1">
      ID Pasien
    </label>
    <div class="flex flex-col sm:flex-row gap-2">
      <input
        v-model="id"
        type="text"
        placeholder="Masukkan ID Pasien"
        class="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[13px] text-slate-700 focus:outline-none"
      />
      <BaseButton
        :disabled="isLoading"
        label="Cari SEP"
        variant="primary"
        :loading="isLoading"
      />
    </div>

    <!-- State Handling -->
    <div v-if="!isSearching"></div>

    <div
      v-else-if="isLoading"
      class="text-center text-slate-500 py-6 bg-white rounded-xl shadow-sm"
    >
      Memuat data...
    </div>

    <div
      v-else-if="error"
      class="text-center text-red-500 py-6 bg-white rounded-xl shadow-sm"
    >
      {{ error }}
    </div>

    <div
      v-else-if="pasienData.length === 0"
      class="p-4 text-sm text-slate-400 italic"
    >
      Data pasien dengan pxid {{ id }} tidak ditemukan.
    </div>
    <div v-else class="flex flex-col">
      <div v-for="p in pasienData" :key="p.px_id" class="p-4 bg-white">
        <div>
          <h2 class="font-semibold text-gray-900 text-sm truncate">
            {{ parsedPasien(p).nama }}
          </h2>
          <p
            class="text-gray-500 text-xs mt-1 flex items-center gap-2 transition"
          >
            SEP:
            <span
              v-if="parsedPasien(p).sep && parsedPasien(p).sep !== '-'"
              class="truncate font-medium cursor-pointer hover:text-blue-600"
              @click="copyToClipboard(parsedPasien(p).sep)"
            >
              {{ parsedPasien(p).sep }}
            </span>
            <button
              v-if="parsedPasien(p).sep && parsedPasien(p).sep !== '-'"
              type="button"
              @click.stop="emit('fetch-sep', parsedPasien(p).sep)"
              class="inline-flex text-[#00366b] hover:text-[#054a8f] transition"
              title="Cari Data SEP"
            >
              <SquareArrowDownRight :size="14" />
            </button>
            <button
              v-else
              type="button"
              @click.stop="openSEPModal(parsedPasien(p).rm, p.px_id)"
              :disabled="isLoadingSEPList"
              class="text-xs font-medium text-blue-600 hover:text-blue-800 underline underline-offset-2 transition disabled:opacity-50"
            >
              {{
                isLoadingSEPList && selectedPxId === p.px_id
                  ? "Memuat..."
                  : "Cari SEP"
              }}
            </button>
          </p>
          <p class="text-gray-500 text-xs flex items-center gap-2 transition">
            Nomor Kartu:
            <span
              @click="copyToClipboard(parsedPasien(p).kartu)"
              class="truncate font-medium cursor-pointer hover:text-blue-600"
              >{{ parsedPasien(p).kartu }}</span
            >
            <button
              type="button"
              @click.stop="openRiwayatModal(parsedPasien(p).kartu)"
              class="inline-flex text-[#00366b] hover:text-[#054a8f] transition"
              title="Buka Riwayat Pelayanan"
            >
              <SquareArrowDownRight :size="14" />
            </button>
          </p>
          <p
            class="text-gray-500 text-xs flex items-center gap-2 cursor-pointer hover:text-blue-600 transition"
            @click="copyToClipboard(parsedPasien(p).rm)"
          >
            No RM:
            <span class="truncate font-medium">{{ parsedPasien(p).rm }}</span>
          </p>
          <p class="text-gray-500 text-xs truncate">
            Tanggal SEP: {{ parsedPasien(p).tglSep }} |
            {{ parsedPasien(p).jnsPelayanan }}
          </p>
        </div>

        <div class="border-t border-gray-100 my-2"></div>

        <div class="flex justify-between items-center mt-4">
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="generateSEP(p.px_id)"
              class="flex items-center justify-center bg-[#00366b] text-white p-2 rounded-md hover:bg-[#054a8f] transition shadow-sm"
              title="Generate SEP"
            >
              <ClipboardPaste class="w-4 h-4" />
            </button>
            <button
              type="button"
              @click="generateResep(p.px_id)"
              class="flex items-center justify-center bg-[#00366b] text-white p-2 rounded-md hover:bg-[#054a8f] transition shadow-sm"
              title="Generate Resep"
            >
              <ClipboardList class="w-4 h-4" />
            </button>
            <button
              type="button"
              @click="cekPenyerahanObat(p.px_id)"
              class="flex items-center justify-center bg-[#00366b] text-white p-2 rounded-md hover:bg-[#054a8f] transition shadow-sm"
              title="Cek Penyerahan Obat"
            >
              <Pill class="w-4 h-4" />
            </button>
            <button
              type="button"
              @click="getBillingFarmasi(p.px_id)"
              class="flex items-center justify-center bg-[#00366b] text-white p-2 rounded-md hover:bg-[#054a8f] transition shadow-sm"
              title="Billing Farmasi"
            >
              <ReceiptText class="w-4 h-4" />
            </button>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="openSignModal(p.px_id)"
              class="flex items-center justify-center bg-[#00366b] text-white p-2 rounded-md hover:bg-[#054a8f] transition shadow-sm"
              title="TTD Penyerahan Obat"
            >
              <PenLine class="w-4 h-4" />
            </button>
            <button
              type="button"
              @click="downloadKlaim(p.px_id)"
              :disabled="isDownloadingKlaim"
              class="flex items-center justify-center bg-[#00366b] text-white p-2 rounded-md hover:bg-[#054a8f] transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              :title="
                isDownloadingKlaim
                  ? 'Mengunduh dokumen klaim...'
                  : 'Download Dokumen Klaim'
              "
            >
              <svg
                v-if="isDownloadingKlaim"
                class="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              <Download v-else class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </form>

  <Teleport to="body">
    <div
      v-if="showSignModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      @click.self="showSignModal = false"
    >
      <div
        class="bg-white rounded-2xl shadow-xl w-full max-w-6xl mx-4 overflow-hidden"
      >
        <div
          class="flex items-center justify-between px-5 py-4 border-b border-slate-100"
        >
          <h3 class="text-xs font-semibold text-slate-700">
            Rekam Tanda Tangan
          </h3>
          <button
            @click="showSignModal = false"
            class="text-slate-400 hover:text-slate-600"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
        <div class="p-4">
          <canvas
            id="sign-canvas"
            class="w-full border border-slate-200 rounded-lg"
            style="height: 420px"
          ></canvas>
        </div>
        <div class="flex justify-end gap-2 px-5 py-4 border-t border-slate-100">
          <button
            @click="clearSignature"
            :disabled="isSubmittingSign"
            class="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Reset
          </button>
          <button
            @click="uploadSignature"
            :disabled="isSubmittingSign"
            class="px-4 py-2 text-sm rounded-lg bg-[#00366b] text-white hover:bg-[#054a8f] disabled:opacity-50"
          >
            {{ isSubmittingSign ? "Menyimpan..." : "Simpan" }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <Teleport to="body">
    <div
      v-if="showPdfModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      @click.self="showPdfModal = false"
    >
      <div
        class="bg-white rounded-2xl shadow-xl w-full max-w-3xl mx-4 overflow-hidden"
      >
        <div
          class="flex items-center justify-between px-5 py-4 border-b border-slate-100"
        >
          <h3 class="text-xs font-semibold text-slate-700">
            PDF Penyerahan Obat
          </h3>
          <button
            @click="showPdfModal = false"
            class="text-slate-400 hover:text-slate-600"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
        <iframe
          :src="pdfUrl"
          frameborder="0"
          class="w-full"
          style="min-height: 600px"
        ></iframe>
      </div>
    </div>
  </Teleport>

  <Teleport to="body">
    <div
      v-if="showSEPModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      @click.self="showSEPModal = false"
    >
      <div
        class="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between px-5 py-4 border-b border-slate-100"
        >
          <h3 class="text-xs font-semibold text-slate-700">Pilih SEP</h3>
          <button
            @click="showSEPModal = false"
            class="text-slate-400 hover:text-slate-600"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- List -->
        <div class="divide-y divide-slate-100 max-h-120 overflow-y-auto">
          <template v-if="SEPList?.length">
            <button
              v-for="sep in SEPList"
              :key="sep.nomor"
              @click="insertSEP(sep.nomor)"
              class="w-full text-left px-5 py-3 hover:bg-blue-50 transition group"
            >
              <p
                class="text-[13px] font-semibold text-slate-800 group-hover:text-blue-700 font-mono"
              >
                {{ sep.nomor }}
              </p>

              <p class="text-[11px] text-slate-400 mt-0.5">
                {{ sep.SubLayanan }} · {{ sep.Layanan }} ·
                {{
                  new Date(sep.Tanggal).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                }}
              </p>
            </button>
          </template>

          <div
            v-else
            class="flex flex-col items-center justify-center py-12 px-4 text-center"
          >
            <div
              class="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-3"
            >
              <span class="text-2xl">📭</span>
            </div>

            <p class="text-sm font-semibold text-slate-600">
              Data SEP tidak ditemukan
            </p>

            <p class="text-xs text-slate-400 mt-1">
              Coba cari dengan data pasien yang lain.
            </p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <ModalRiwayatPelayanan
    ref="riwayatModalRef"
    :show="showRiwayatModal"
    :pasienData="pasienData"
    @close="showRiwayatModal = false"
  />
</template>
