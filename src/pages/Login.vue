<script setup>
import logo from "../../src/assets/img/logo-text.png";
import { useStore } from "vuex";
import { ref } from "vue";
import { User, Eye, EyeOff } from "lucide-vue-next";
import { DotLottieVue } from "@lottiefiles/dotlottie-vue";

const store = useStore();
const username = ref("");
const password = ref("");
const showPassword = ref(false);

const Login = () => {
  store.dispatch("login", {
    username: username.value,
    password: password.value,
  });
};
</script>

<template>
  <div class="relative w-screen h-screen overflow-hidden">
    <div class="relative z-10 w-full h-full flex">
      <!-- Bgian Kiri -->
      <div
        class="hidden md:flex w-1/2 h-full items-center justify-center px-6 -mt-16"
      >
        <DotLottieVue
          autoplay
          loop
          src="https://lottie.host/2fa27e63-9de0-4a30-94c4-d4616deaf189/Iz6V88v1AC.json"
          class="w-168 h-168"
        />
      </div>

      <!-- Bagian Kanan -->
      <div
        class="w-full md:w-1/2 flex items-center justify-center px-4 sm:px-6 md:px-8 bg-gradient-to-br from-blue-50 to-blue-200"
      >
        <div
          class="w-full max-w-sm sm:max-w-md md:max-w-lg bg-white rounded-2xl shadow-xl p-6 sm:p-8 md:p-10 space-y-6"
        >
          <!-- Logo -->
          <div class="flex justify-center">
            <img :src="logo" alt="Logo" class="w-32 sm:w-40 md:w-44 mb-4" />
          </div>

          <h2
            class="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 text-center"
          >
            Backoffice Farmasi
          </h2>
          <p class="text-gray-500 text-xs sm:text-sm text-center">
            Silakan login untuk mengakses layanan Farmasi
          </p>

          <!-- Form -->
          <form @submit.prevent="Login" class="space-y-4 sm:space-y-5 mt-4">
            <!-- Input Username -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Username</label
              >
              <div class="relative">
                <input
                  type="text"
                  placeholder="Nama Unit"
                  v-model="username"
                  class="w-full border border-gray-300 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:ring-2 focus:ring-[#00366b] focus:outline-none shadow-sm"
                  required
                />
                <span
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  <User class="w-4 h-4 sm:w-5 sm:h-5" />
                </span>
              </div>
            </div>

            <!-- Input Password -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Password</label
              >
              <div class="relative">
                <input
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="••••••"
                  v-model="password"
                  class="w-full border border-gray-300 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:ring-2 focus:ring-[#00366b] focus:outline-none shadow-sm"
                  required
                />
                <span
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  <button type="button" @click="showPassword = !showPassword">
                    <component
                      :is="showPassword ? EyeOff : Eye"
                      class="w-4 h-4 sm:w-5 sm:h-5"
                    />
                  </button>
                </span>
              </div>
            </div>

            <!-- Button -->
            <button
              type="submit"
              class="w-full py-2.5 sm:py-3 rounded-xl text-white font-semibold text-sm sm:text-base bg-gradient-to-r from-[#00366b] to-[#004d99] hover:opacity-90 transition shadow-md"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
