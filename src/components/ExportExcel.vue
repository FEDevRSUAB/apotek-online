<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { Download } from "lucide-vue-next";
import * as XLSX from "xlsx";

const props = defineProps({
  columns: {
    type: Array,
    required: true,
  },
  data: {
    type: Array,
    required: true,
  },
  fileName: {
    type: String,
    default: "export.xlsx",
  },
  sheetName: {
    type: String,
    default: "Sheet1",
  },
  buttonLabel: {
    type: String,
    default: "Export Excel",
  },
});

const emit = defineEmits(["exported"]);

const isOpen = ref(false);
const wrapperRef = ref(null);
const selectedColumns = ref(props.columns.map((c) => c.value));

const allSelected = computed(
  () => selectedColumns.value.length === props.columns.length,
);

const toggleSelectAll = () => {
  selectedColumns.value = allSelected.value
    ? []
    : props.columns.map((c) => c.value);
};

const toggleColumn = (value) => {
  const idx = selectedColumns.value.indexOf(value);
  if (idx === -1) {
    selectedColumns.value.push(value);
  } else {
    selectedColumns.value.splice(idx, 1);
  }
};

const handleExport = () => {
  if (selectedColumns.value.length === 0) return;
  if (!props.data.length) return;

  const activeCols = props.columns.filter((c) =>
    selectedColumns.value.includes(c.value),
  );

  const exportData = props.data.map((row) => {
    const obj = {};
    activeCols.forEach((col) => {
      obj[col.text] = row[col.value] ?? "";
    });
    return obj;
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, props.sheetName);

  XLSX.writeFile(workbook, props.fileName);

  isOpen.value = false;
  emit("exported");
};

const handleClickOutside = (e) => {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target)) {
    isOpen.value = false;
  }
};

onMounted(() => document.addEventListener("click", handleClickOutside));
onUnmounted(() => document.removeEventListener("click", handleClickOutside));
</script>

<template>
  <div ref="wrapperRef" class="relative">
    <button
      @click="isOpen = !isOpen"
      class="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition"
    >
      <Download class="w-3.5 h-3.5" />
      {{ buttonLabel }}
    </button>

    <div
      v-if="isOpen"
      class="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-50"
    >
      <div class="px-4 py-3 border-b border-slate-100">
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            :checked="allSelected"
            @change="toggleSelectAll"
            class="w-3.5 h-3.5 accent-[#00366b] rounded"
          />
          <span class="text-xs font-semibold text-slate-700">Pilih Semua</span>
        </label>
      </div>

      <div class="px-4 py-3 max-h-56 overflow-y-auto flex flex-col gap-2">
        <label
          v-for="col in columns"
          :key="col.value"
          class="flex items-center gap-2 cursor-pointer"
        >
          <input
            type="checkbox"
            :checked="selectedColumns.includes(col.value)"
            @change="toggleColumn(col.value)"
            class="w-3.5 h-3.5 accent-[#00366b] rounded"
          />
          <span class="text-xs text-slate-600">{{ col.text }}</span>
        </label>
      </div>

      <div class="px-4 py-3 border-t border-slate-100">
        <button
          @click="handleExport"
          class="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition"
        >
          <Download class="w-3.5 h-3.5" />
          Download ({{ selectedColumns.length }})
        </button>
      </div>
    </div>
  </div>
</template>
