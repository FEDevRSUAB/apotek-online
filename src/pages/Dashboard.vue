<script setup>
import { onMounted, onUnmounted, ref, computed, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
  LayoutDashboard,
  ChevronRight,
  Monitor,
  FolderPen,
  AlignJustify,
  AlignLeft,
  User,
  Play,
  CircleChevronLeft,
  LogOut,
} from "lucide-vue-next";
import logo2 from "../assets/img/logo_circle.png";

const router = useRouter();
const route = useRoute();
const openMenus = ref([]);
const collapsed = ref(false);
const collapsedMain = ref(localStorage.getItem("collapsedMain") === "true");
const activePanel = ref("main");
const searchQuery = ref("");

const isActive = (path) => route.path === path;

const menu = [
  {
    icon: LayoutDashboard,
    name: "Rekam Obat",
    children: [
      {
        name: "Pelayanan Obat",
        path: "/pelayanan-obat",
        label: "Pelayanan Obat",
      },
      {
        name: "Daftar Resep Masuk",
        path: "/daftar-resep-masuk",
        label: "Daftar Resep Masuk",
      },
    ],
  },
  {
    icon: FolderPen,
    name: "Referensi",
    children: [
      {
        name: "Referensi Obat",
        path: "/referensi-obat",
        label: "Referensi Obat",
      },
      {
        name: "Riwayat Pelayanan",
        path: "/riwayat-pelayanan",
        label: "Riwayat Pelayanan",
      },
      {
        name: "Referensi Faskes",
        path: "/faskes",
        label: "Referensi Faskes",
      },
      {
        name: "Referensi Spesialis",
        path: "/spesialis",
        label: "Referensi Spesialis",
      },
      {
        name: "Referensi Apotek",
        path: "/apotek",
        label: "Referensi Apotek",
      },
      {
        name: "Referensi Poli",
        path: "/poli",
        label: "Referensi Poli",
      },
    ],
  },
  {
    icon: Monitor,
    name: "Monitoring",
    path: "/monitoring",
    label: "Daftar Verfikasi Obat",
  },
];

watch(collapsedMain, (val) => {
  localStorage.setItem("collapsedMain", val.toString());
});

const isParentActive = (item) => {
  if (item.children) {
    return item.children.some((child) => route.path === child.path);
  }
  return false;
};

const hasSideComponent = computed(() =>
  route.matched.some((r) => r.components?.side),
);

const currentLabel = computed(() => {
  const parentWithChild = menu.find((item) =>
    item.children?.some((child) => route.path.includes(child.path)),
  );

  if (parentWithChild) {
    const activeChild = parentWithChild.children.find((child) =>
      route.path.includes(child.path),
    );
    return activeChild?.label || parentWithChild.label;
  }

  const single = menu.find((item) => route.path.includes(item.path));
  return single?.label || "";
});

const navigate = (path) => {
  router.push(path);
};

const toggleMenu = (index) => {
  if (openMenus.value.includes(index)) {
    openMenus.value = openMenus.value.filter((i) => i !== index);
  } else {
    openMenus.value.push(index);
  }
};

const Logout = () => {
  console.info("Logout");
};

onMounted(() => {
  if (route.path === "/dashboard") {
    router.replace("/dashboard/overview");
  }
});

watch(
  () => route.fullPath,
  () => {
    if (!hasSideComponent.value) {
      collapsedMain.value = false;
    }
  },
);
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- Header -->
    <header
      class="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-blue-50"
    >
      <div class="flex items-center gap-3 w-full mx-auto p-3">
        <!-- Logo & Toggle -->
        <div class="flex items-center gap-2 font-bold text-sm">
          <img :src="logo2" alt="logo" class="w-12 h-12 hidden sm:block" />
          <div class="hidden text-slate-600 sm:block">
            <p class="truncate max-w-[10rem] text-lg">Farmasi</p>
            <p class="text-sm">RSU Aminah Blitar</p>
          </div>
          <button
            @click="
              isMobile ? (mobileOpen = !mobileOpen) : (collapsed = !collapsed)
            "
            class="flex items-center justify-center -ml-2 md:ml-4 p-2 text-slate-500 hover:text-slate-700 rounded-full focus:outline-none transition"
          >
            <component
              :is="collapsed ? AlignLeft : AlignJustify"
              class="w-5 h-5"
            />
          </button>
        </div>

        <!-- Title & Search -->
        <div class="flex flex-1 items-center justify-between gap-3">
          <div
            class="text-lg sm:text-2xl font-bold text-slate-700 transition-all duration-300 truncate"
          >
            {{ currentLabel }}
          </div>
          <div class="relative w-28 sm:w-40 md:w-1/3">
            <input
              v-model="searchQuery"
              type="search"
              placeholder="Temukan..."
              class="w-full px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base bg-white border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#00366b] transition-all duration-300"
            />
          </div>

          <!-- User Profile -->
          <div
            class="relative hidden md:block group before:absolute before:left-0 before:right-0 before:top-full before:h-6 before:bg-transparent"
          >
            <div
              class="flex items-center bg-[#00366b] px-2 sm:px-3 py-1 rounded-full cursor-pointer transition"
            >
              <div
                class="p-1 rounded-full flex items-center justify-center text-white font-bold"
              >
                <User size="18" class="sm:w-5 sm:h-5" />
              </div>
              <div class="leading-tight hidden sm:block">
                <p class="text-xs sm:text-sm text-white truncate">User Admin</p>
              </div>
              <div
                class="p-2 rounded-full flex items-center justify-center text-white font-bold"
              >
                <Play size="14" class="rotate-90" />
              </div>
            </div>

            <!-- Dropdown -->
            <div
              class="absolute right-0 mt-3 w-max min-w-full bg-white text-sm shadow-lg rounded-xl py-2 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 ease-out z-50"
            >
              <button
                @click="goToSettings"
                class="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-100 transition"
              >
                Pengaturan
              </button>
              <button
                @click="Logout"
                class="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-100 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Layout -->
    <div class="flex flex-1 relative">
      <!-- Sidebar -->
      <aside
        :class="[collapsed ? 'w-20' : 'w-64']"
        class="sticky top-24 left-0 h-[calc(100vh-98px)] bg-blue-50 p-4 overflow-hidden transition-all duration-500 ease-in-out hidden md:block"
      >
        <nav role="navigation" aria-label="Sidebar Menu">
          <ul>
            <li v-for="(item, index) in menu" :key="index" class="mb-2">
              <!-- Tombol Utama -->
              <button
                @click="item.children ? toggleMenu(index) : navigate(item.path)"
                class="relative flex items-center p-2 rounded-lg w-full text-left transition-colors duration-200"
                :class="[
                  item.children
                    ? isParentActive(item)
                      ? 'text-slate-700 font-semibold'
                      : 'text-slate-500 hover:text-slate-700'
                    : isActive(item.path)
                      ? 'text-slate-700 font-semibold bg-white'
                      : 'text-slate-500 hover:text-slate-700',
                ]"
              >
                <!-- Highlight Aktif -->
                <span
                  v-if="isActive(item.path) || isParentActive(item)"
                  class="absolute left-0 top-0 h-full w-1 bg-red-500 rounded-r"
                ></span>

                <!-- Icon -->
                <component
                  :is="item.icon"
                  class="w-5 h-5 flex-shrink-0 ml-4"
                  :class="[
                    isActive(item.path) || isParentActive(item)
                      ? 'text-slate-700'
                      : 'text-slate-400',
                  ]"
                />

                <!-- Label -->
                <span
                  class="ml-3 whitespace-nowrap flex-1 transition-all duration-300"
                  :class="
                    collapsed
                      ? 'opacity-0 -translate-x-2 pointer-events-none'
                      : 'opacity-100 translate-x-0'
                  "
                >
                  {{ item.name }}
                </span>

                <!-- Chevron -->
                <ChevronRight
                  v-if="item.children"
                  :class="[
                    'w-4 h-4 ml-auto transition-transform duration-300',
                    openMenus.includes(index) ? 'rotate-90' : '',
                  ]"
                />
              </button>

              <!-- Submenu -->
              <div
                v-if="item.children && !collapsed"
                class="overflow-hidden transition-all duration-500 ease-in-out"
                :class="
                  openMenus.includes(index)
                    ? 'max-h-96 opacity-100'
                    : 'max-h-0 opacity-0'
                "
              >
                <ul class="ml-6 mt-2 space-y-1">
                  <li v-for="(child, cIndex) in item.children" :key="cIndex">
                    <button
                      @click="navigate(child.path)"
                      class="flex items-center px-2 py-1.5 rounded-md w-full text-left text-sm transition"
                      :class="[
                        isActive(child.path)
                          ? 'font-semibold text-slate-700 bg-white'
                          : 'text-slate-500 hover:text-slate-700 hover:bg-white',
                      ]"
                    >
                      <span
                        class="w-2 h-2 rounded-full mr-4 flex-shrink-0"
                        :class="
                          isActive(child.path) ? 'bg-red-500' : 'bg-slate-400'
                        "
                      ></span>
                      {{ child.name }}
                    </button>
                  </li>
                </ul>
              </div>
            </li>
          </ul>
        </nav>
      </aside>

      <!-- Main content -->
      <div class="flex-1 flex overflow-hidden relative">
        <div class="flex w-full relative">
          <button
            v-if="hasSideComponent"
            @click="collapsedMain = !collapsedMain"
            class="hidden md:block"
          >
            <CircleChevronLeft
              :class="[
                'w-8 h-8 absolute top-72 text-[#00366b] transition-transform duration-500',
                collapsedMain ? 'rotate-180' : '',
              ]"
            />
          </button>

          <!-- Panel Main -->
          <div
            :class="[
              'bg-blue-50 transition-all duration-500 overflow-y-auto min-w-0 h-[calc(100vh-98px)]',
              collapsedMain ? 'flex-1' : 'flex-3',
            ]"
          >
            <div class="px-6 pb-6 pt-3 h-full">
              <router-view
                name="main"
                @openSide="activePanel = 'side'"
                :collapsedMain="collapsedMain"
                @update:collapsedMain="
                  hasSideComponent ? (collapsedMain = $event) : null
                "
                :search="searchQuery"
              />
            </div>
          </div>

          <!-- Panel Side -->
          <div
            v-show="collapsedMain"
            class="flex-2 bg-blue-50 transition-all duration-500 h-[calc(100vh-98px)] overflow-y-auto px-6 pb-6 pt-3 min-w-0"
          >
            <router-view name="side" :search="searchQuery" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
