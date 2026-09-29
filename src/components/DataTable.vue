<script setup>
import { ref, computed, watch } from "vue";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-vue-next";

const props = defineProps({
  headers: {
    type: Array,
    default: () => [],
  },
  items: {
    type: Array,
    default: () => [],
  },
  searchValue: {
    type: String,
    default: "",
  },
  alternating: {
    type: Boolean,
    default: true,
  },
  rowsPerPage: {
    type: Number,
    default: 25,
  },
  rowsPerPageOptions: {
    type: Array,
    default: () => [10, 25, 50, 100],
  },
  noSortKeys: {
    type: Array,
    default: () => ["obat", "aksi"],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  isHeader: {
    type: Boolean,
    default: false,
  },

  serverSide: {
    type: Boolean,
    default: false,
  },
  totalItems: {
    type: Number,
    default: 0,
  },
  currentPage: {
    type: Number,
    default: 1,
  },

  selectable: {
    type: Boolean,
    default: false,
  },
  selectedRows: {
    type: Array,
    default: () => [],
  },
  rowKey: {
    type: String,
    default: "_idx",
  },
});

const emit = defineEmits([
  "update:currentPage",
  "update:rowsPerPage",
  "update:selectedRows",
  "page-change",
  "rows-per-page-change",
  "sort-change",
]);

const internalRowsPerPage = ref(props.rowsPerPage);
watch(
  () => props.rowsPerPage,
  (v) => (internalRowsPerPage.value = v),
);
const onRowsPerPageChange = () => {
  internalPage.value = 1;
  emit("update:rowsPerPage", internalRowsPerPage.value);
  emit("rows-per-page-change", internalRowsPerPage.value);
};

const filtered = computed(() => {
  if (props.serverSide) return props.items;
  const q = props.searchValue?.trim().toLowerCase();
  if (!q) return props.items;
  return props.items.filter((row) =>
    Object.values(row).some((val) =>
      String(val ?? "")
        .toLowerCase()
        .includes(q),
    ),
  );
});

const sortKey = ref("");
const sortDir = ref("asc");

const isSortable = (key) => !props.noSortKeys.includes(key);

const toggleSort = (key) => {
  if (!isSortable(key)) return;
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
  } else {
    sortKey.value = key;
    sortDir.value = "asc";
  }
  if (props.serverSide) {
    emit("sort-change", { key: sortKey.value, dir: sortDir.value });
  }
};

const sorted = computed(() => {
  if (props.serverSide || !sortKey.value) return filtered.value;
  return [...filtered.value].sort((a, b) => {
    const va = a[sortKey.value] ?? "";
    const vb = b[sortKey.value] ?? "";
    const cmp = String(va).localeCompare(String(vb), "id", { numeric: true });
    return sortDir.value === "asc" ? cmp : -cmp;
  });
});

const internalPage = ref(1);

const page = computed({
  get: () => (props.serverSide ? props.currentPage : internalPage.value),
  set: (v) => {
    if (props.serverSide) {
      emit("update:currentPage", v);
      emit("page-change", v);
    } else {
      internalPage.value = v;
    }
  },
});

const totalPages = computed(() => {
  if (props.serverSide) {
    return Math.max(1, Math.ceil(props.totalItems / internalRowsPerPage.value));
  }
  return Math.max(
    1,
    Math.ceil(sorted.value.length / internalRowsPerPage.value),
  );
});

const paginated = computed(() => {
  if (props.serverSide) return props.items;
  const start = (internalPage.value - 1) * internalRowsPerPage.value;
  return sorted.value.slice(start, start + internalRowsPerPage.value);
});

const totalCount = computed(() =>
  props.serverSide ? props.totalItems : sorted.value.length,
);
const pageStart = computed(() =>
  totalCount.value === 0 ? 0 : (page.value - 1) * internalRowsPerPage.value + 1,
);
const pageEnd = computed(() =>
  Math.min(page.value * internalRowsPerPage.value, totalCount.value),
);

const prevPage = () => {
  if (page.value > 1) page.value = page.value - 1;
};
const nextPage = () => {
  if (page.value < totalPages.value) page.value = page.value + 1;
};
const firstPage = () => {
  page.value = 1;
};
const lastPage = () => {
  page.value = totalPages.value;
};

watch(
  () => props.searchValue,
  () => {
    if (!props.serverSide) internalPage.value = 1;
  },
);

const getRowKey = (row, idx) =>
  props.rowKey === "_idx" ? idx : (row[props.rowKey] ?? idx);

const isSelected = (row, idx) => {
  const key = getRowKey(row, idx);
  return (
    props.selectedRows.some((r, i) =>
      props.rowKey === "_idx" ? false : r[props.rowKey] === key,
    ) || props.selectedRows.includes(key)
  );
};

const allOnPageSelected = computed(() => {
  if (!props.selectable || paginated.value.length === 0) return false;
  return paginated.value.every((row, idx) => {
    const realIdx = (page.value - 1) * internalRowsPerPage.value + idx;
    return isSelected(row, realIdx);
  });
});

const someOnPageSelected = computed(() => {
  if (!props.selectable) return false;
  return (
    paginated.value.some((row, idx) => {
      const realIdx = (page.value - 1) * internalRowsPerPage.value + idx;
      return isSelected(row, realIdx);
    }) && !allOnPageSelected.value
  );
});

const toggleRow = (row, idx) => {
  const key = getRowKey(row, idx);
  let newSelected;
  if (props.rowKey === "_idx") {
    const exists = props.selectedRows.includes(key);
    newSelected = exists
      ? props.selectedRows.filter((k) => k !== key)
      : [...props.selectedRows, key];
  } else {
    const exists = props.selectedRows.some((r) => r[props.rowKey] === key);
    newSelected = exists
      ? props.selectedRows.filter((r) => r[props.rowKey] !== key)
      : [...props.selectedRows, row];
  }
  emit("update:selectedRows", newSelected);
};

const toggleAllOnPage = () => {
  if (allOnPageSelected.value) {
    let newSelected = [...props.selectedRows];
    paginated.value.forEach((row, idx) => {
      const realIdx = (page.value - 1) * internalRowsPerPage.value + idx;
      const key = getRowKey(row, realIdx);
      if (props.rowKey === "_idx") {
        newSelected = newSelected.filter((k) => k !== key);
      } else {
        newSelected = newSelected.filter((r) => r[props.rowKey] !== key);
      }
    });
    emit("update:selectedRows", newSelected);
  } else {
    let newSelected = [...props.selectedRows];
    paginated.value.forEach((row, idx) => {
      const realIdx = (page.value - 1) * internalRowsPerPage.value + idx;
      const key = getRowKey(row, realIdx);
      if (props.rowKey === "_idx") {
        if (!newSelected.includes(key)) newSelected.push(key);
      } else {
        if (!newSelected.some((r) => r[props.rowKey] === key))
          newSelected.push(row);
      }
    });
    emit("update:selectedRows", newSelected);
  }
};
</script>

<template>
  <div
    class="w-full rounded-xl overflow-hidden border border-slate-100 shadow-sm"
  >
    <!-- Tabel -->
    <div class="overflow-x-auto">
      <table class="w-full text-xs border-collapse">
        <!-- HEAD -->
        <thead>
          <tr class="border-b border-slate-100">
            <!-- Checkbox header -->
            <th
              v-if="selectable"
              class="px-3 py-3 w-9"
              :class="isHeader ? 'bg-slate-200' : 'bg-white'"
            >
              <input
                type="checkbox"
                :checked="allOnPageSelected"
                :indeterminate="someOnPageSelected"
                @change="toggleAllOnPage"
                class="w-3.5 h-3.5 accent-blue-600 cursor-pointer"
              />
            </th>

            <th
              v-for="col in headers"
              :key="col.value"
              class="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-700 whitespace-nowrap select-none"
              :class="[
                isHeader ? 'bg-slate-200' : 'bg-white',
                isSortable(col.value)
                  ? 'cursor-pointer hover:bg-slate-50 transition-colors'
                  : '',
              ]"
              @click="toggleSort(col.value)"
            >
              <div class="flex items-center gap-1.5">
                <span>{{ col.text }}</span>
                <template v-if="isSortable(col.value)">
                  <ChevronUp
                    v-if="sortKey === col.value && sortDir === 'asc'"
                    class="w-3.5 h-3.5 text-slate-700"
                  />
                  <ChevronDown
                    v-else-if="sortKey === col.value && sortDir === 'desc'"
                    class="w-3.5 h-3.5 text-slate-700"
                  />
                  <ChevronsUpDown v-else class="w-3.5 h-3.5 text-slate-400" />
                </template>
              </div>
            </th>
          </tr>
        </thead>

        <!-- BODY -->
        <tbody class="divide-y divide-blue-50">
          <!-- loading -->
          <tr v-if="loading">
            <td
              :colspan="headers.length + (selectable ? 1 : 0)"
              class="bg-white"
            >
              <slot name="loading">
                <div
                  class="flex flex-col items-center justify-center gap-2 py-12"
                >
                  <Loader2 class="w-6 h-6 animate-spin text-blue-500" />
                  <span class="text-xs text-slate-400 italic"
                    >Memuat data...</span
                  >
                </div>
              </slot>
            </td>
          </tr>

          <tr v-else-if="paginated.length === 0">
            <td
              :colspan="headers.length + (selectable ? 1 : 0)"
              class="px-4 py-10 text-center text-slate-400 italic bg-white"
            >
              Tidak ada data
            </td>
          </tr>

          <tr
            v-else
            v-for="(row, rowIdx) in paginated"
            :key="rowIdx"
            class="transition-colors duration-100 hover:bg-blue-50"
            :class="[
              rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50',
              selectable &&
              isSelected(row, (page - 1) * internalRowsPerPage + rowIdx)
                ? '!bg-blue-50 ring-1 ring-inset ring-blue-200'
                : '',
            ]"
          >
            <!-- Checkbox cell -->
            <td v-if="selectable" class="px-3 py-2.5 w-9">
              <input
                type="checkbox"
                :checked="
                  isSelected(row, (page - 1) * internalRowsPerPage + rowIdx)
                "
                @change="
                  toggleRow(row, (page - 1) * internalRowsPerPage + rowIdx)
                "
                class="w-3.5 h-3.5 accent-blue-600 cursor-pointer"
              />
            </td>

            <td
              v-for="col in headers"
              :key="col.value"
              class="px-4 py-2.5 text-slate-700"
            >
              <slot :name="`item-${col.value}`" v-bind="row">
                {{ row[col.value] ?? "—" }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Footer -->
    <div
      class="flex items-center justify-between px-4 py-2.5 bg-white border-t border-slate-100 text-xs text-slate-600"
    >
      <!-- total data + rows per page -->
      <div class="flex items-center gap-3">
        <span class="font-medium">
          {{
            totalCount === 0
              ? "Tidak ada data"
              : `${pageStart}–${pageEnd} dari ${totalCount} data`
          }}
        </span>
        <div class="flex items-center gap-1.5 text-slate-500">
          <span>|</span>
          <span>Baris:</span>
          <select
            v-model="internalRowsPerPage"
            @change="onRowsPerPageChange"
            class="border border-slate-200 rounded-md px-2 py-0.5 text-xs text-slate-700 bg-white outline-none focus:border-blue-400 transition"
          >
            <option v-for="opt in rowsPerPageOptions" :key="opt" :value="opt">
              {{ opt }}
            </option>
          </select>
        </div>
      </div>

      <!-- navigasi halaman -->
      <div class="flex items-center gap-1">
        <button
          @click="firstPage"
          :disabled="page === 1"
          class="p-1 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-blue-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
          title="Halaman pertama"
        >
          <ChevronsLeft class="w-3.5 h-3.5" />
        </button>
        <button
          @click="prevPage"
          :disabled="page === 1"
          class="p-1 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-blue-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
          title="Sebelumnya"
        >
          <ChevronLeft class="w-3.5 h-3.5" />
        </button>
        <span
          class="px-2.5 py-1 rounded-md bg-white border border-slate-200 font-semibold text-slate-700 min-w-[52px] text-center"
        >
          {{ page }} / {{ totalPages }}
        </span>
        <button
          @click="nextPage"
          :disabled="page === totalPages"
          class="p-1 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-blue-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
          title="Berikutnya"
        >
          <ChevronRight class="w-3.5 h-3.5" />
        </button>
        <button
          @click="lastPage"
          :disabled="page === totalPages"
          class="p-1 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-blue-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
          title="Halaman terakhir"
        >
          <ChevronsRight class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </div>
</template>
