<script setup>
import { Loader2 } from "lucide-vue-next";

defineProps({
  label: {
    type: String,
    default: "Submit",
  },
  loading: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    default: "submit",
  },
  variant: {
    type: String,
    default: "primary",
  },
  pX: {
    type: String,
    default: "px-5",
  },
  pY: {
    type: String,
    default: "py-2",
  },
});
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'flex items-center justify-center gap-2 rounded-md text-sm transition font-medium outline-none',
      pX,
      pY,
      disabled || loading ? 'opacity-50 cursor-not-allowed' : '',
      variant === 'primary' ? 'bg-[#00366b] text-white hover:bg-[#275788]' : '',
      variant === 'danger' ? 'bg-red-600 text-white hover:bg-red-700' : '',
      variant === 'slate'
        ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
        : '',
    ]"
  >
    <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
    <span v-if="!loading">{{ label }}</span>
  </button>
</template>
