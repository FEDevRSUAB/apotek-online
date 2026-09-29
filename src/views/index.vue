<script setup>
import { ref, onMounted } from "vue";
import { useStore } from "vuex";
import { Line } from "vue-chartjs";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const store = useStore();

const totalResepPRB = ref(0);
const totalResepKronis = ref(0);
const totalResepKemo = ref(0);
const obatBelumVerified = ref(0);

const basePayload = {
  kdppk: "0211A010",
  JnsTgl: "TGLRSP",
  TglMulai: "2025-10-01",
  TglAkhir: "2025-11-06",
};

const fetchResepPRB = async () => {
  try {
    const result = await store.dispatch("fetchDaftarResep", { ...basePayload, KdJnsObat: "1" });
    totalResepPRB.value = Array.isArray(result.response) ? result.response.length : 0;
  } catch {
    totalResepPRB.value = 0;
  }
};

const fetchResepKronis = async () => {
  try {
    const result = await store.dispatch("fetchDaftarResep", { ...basePayload, KdJnsObat: "2" });
    totalResepKronis.value = Array.isArray(result.response) ? result.response.length : 0;
  } catch {
    totalResepKronis.value = 0;
  }
};

const fetchResepKemo = async () => {
  try {
    const result = await store.dispatch("fetchDaftarResep", { ...basePayload, KdJnsObat: "3" });
    totalResepKemo.value = Array.isArray(result.response) ? result.response.length : 0;
  } catch {
    totalResepKemo.value = 0;
  }
};

const fetchObatBelumVerified = async () => {
  try {
    const result = await store.dispatch("fetchMonitoring", {
      bulan: 11,
      tahun: 2025,
      jenis_obat: 0,
      status: 0,
    });
    obatBelumVerified.value = Array.isArray(result.response.listsep)
      ? result.response.listsep.length
      : 0;
  } catch {
    obatBelumVerified.value = 0;
  }
};

onMounted(() => {
  fetchResepPRB();
  fetchResepKronis();
  fetchResepKemo();
  fetchObatBelumVerified();
});

// Dummy chart data biar tampil mini grafik
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { x: { display: false }, y: { display: false } },
};

const chartData = (color) => ({
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  datasets: [
    {
      data: [5, 9, 7, 10, 8, 6, 9],
      borderColor: color,
      backgroundColor: "transparent",
      borderWidth: 2,
      tension: 0.4,
      pointRadius: 0,
    },
  ],
});
</script>

<template>
  <div class="grid grid-cols-4 gap-4">
    <!-- Kartu PRB -->
    <div class="bg-white rounded-lg shadow p-4">
      <h2 class="text-gray-600 text-sm font-medium">Resep PRB</h2>
      <div class="flex items-center justify-between mt-2">
        <p class="text-2xl font-bold text-gray-700">{{ totalResepPRB }}</p>
        <div class="h-10 w-20">
          <Line :data="chartData('#10b981')" :options="chartOptions" />
        </div>
      </div>
    </div>

    <!-- Kartu Kronis -->
    <div class="bg-white rounded-lg shadow p-4">
      <h2 class="text-gray-600 text-sm font-medium">Resep Kronis</h2>
      <div class="flex items-center justify-between mt-2">
        <p class="text-2xl font-bold text-gray-700">{{ totalResepKronis }}</p>
        <div class="h-10 w-20">
          <Line :data="chartData('#3b82f6')" :options="chartOptions" />
        </div>
      </div>
    </div>

    <!-- Kartu Kemo -->
    <div class="bg-white rounded-lg shadow p-4">
      <h2 class="text-gray-600 text-sm font-medium">Resep Kemo</h2>
      <div class="flex items-center justify-between mt-2">
        <p class="text-2xl font-bold text-gray-700">{{ totalResepKemo }}</p>
        <div class="h-10 w-20">
          <Line :data="chartData('#f59e0b')" :options="chartOptions" />
        </div>
      </div>
    </div>

    <!-- Kartu Belum Diverifikasi -->
    <div class="bg-white rounded-lg shadow p-4">
      <h2 class="text-gray-600 text-sm font-medium">Obat Belum Diverifikasi</h2>
      <div class="flex items-center justify-between mt-2">
        <p class="text-2xl font-bold text-gray-700">{{ obatBelumVerified }}</p>
        <div class="h-10 w-20">
          <Line :data="chartData('#ef4444')" :options="chartOptions" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.shadow {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}
</style>
