<script setup>
import { computed } from "vue";
import { Trash2 } from "lucide-vue-next";

const props = defineProps({
  list: { type: Array, default: () => [] },
});

defineEmits(["delete"]);

const totalHarga = computed(() => {
  if (!Array.isArray(props.list)) return 0;

  return props.list.reduce((acc, item) => {
    const harga = Number(item.harga) || 0;
    return acc + harga;
  }, 0);
});
</script>

<template>
  <div class="overflow-x-auto rounded-xl shadow-sm">
    <table class="min-w-full text-sm">
      <thead class="bg-white text-gray-700">
        <tr>
          <th
            v-for="header in [
              'R/N',
              'Kode Obat',
              'Obat',
              'S1',
              'S2',
              'Jml',
              'Harga',
              '',
            ]"
            :key="header"
            class="px-3 py-2 text-left font-medium"
          >
            {{ header }}
          </th>
        </tr>
      </thead>

      <tbody class="bg-white">
        <tr
          v-for="(obat, index) in list"
          :key="index"
          class="border-b border-gray-200 hover:bg-gray-50 transition"
        >
          <td class="px-3 py-2">{{ obat.tipeobat }}</td>
          <td class="px-3 py-2">{{ obat.kodeobat }}</td>
          <td class="px-3 py-2">{{ obat.namaobat }}</td>
          <td class="px-3 py-2">{{ obat.signa1 }}</td>
          <td class="px-3 py-2">{{ obat.signa2 }}</td>
          <td class="px-3 py-2">{{ obat.jumlah }}</td>
          <td class="px-3 py-2">{{ obat.harga }}</td>
          <td class="px-3 py-2">
            <button
              @click="$emit('delete', index)"
              class="text-red-500 hover:text-red-700 text-xs font-semibold"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </td>
        </tr>

        <tr v-if="list.length === 0">
          <td colspan="9" class="px-4 py-6 text-center text-gray-500">
            Belum ada data obat
          </td>
        </tr>
      </tbody>
    </table>

    <div class="px-4 py-2 bg-gray-50 text-right text-sm text-gray-600">
      <strong>Total Harga:</strong> Rp {{ totalHarga.toLocaleString("id-ID") }}
    </div>
  </div>

  <!-- CATATAN -->
  <p class="text-red-600 text-sm font-medium italic">
    *) Pastikan obat dengan bentuk sediaan Tabung, Ampul, Vial, Flexpen, Penfill
    sudah dientrikan (signa dan jumlah obat) dalam bilangan bulat (bukan
    desimal)
  </p>
</template>
