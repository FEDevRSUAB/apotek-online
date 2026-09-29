import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const getColorByType = (type) => {
  switch (type) {
    case "success":
      return "#22c55e";
    case "error":
      return "#ef4444";
    case "warning":
      return "#f59e0b";
    case "info":
      return "#3b82f6";
    default:
      return "#6b7280";
  }
};

const basePopup =
  "rounded-2xl shadow-xl border border-slate-100 font-[Poppins]";
const baseTitle = "text-[14px] font-semibold text-slate-800";
const baseText = "text-[12.5px] text-slate-500";

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
  background: "#ffffff",
  color: "#1f2937",
  customClass: {
    popup: `${basePopup} px-4 py-2`,
    title: "text-xs font-semibold text-slate-700 font-[Poppins]",
    icon: "!w-7 !h-7 !mr-3",
  },
});

function showToast(type = "info", message = "Informasi") {
  const color = getColorByType(type);
  Toast.fire({
    icon: type,
    title: message,
    iconColor: color,
    didOpen: (toast) => {
      const bar = toast.querySelector(".swal2-timer-progress-bar");
      if (bar) bar.style.background = color;
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    },
  });
}

const Alert = {
  Success(msg = "Berhasil!") {
    showToast("success", msg);
  },
  Error(msg = "Terjadi kesalahan.") {
    showToast("error", msg);
  },
  Warn(msg = "Perhatian!") {
    showToast("warning", msg);
  },
  Info(msg = "Informasi") {
    showToast("info", msg);
  },

  Confirm({
    title = "Yakin?",
    text = "Tindakan ini tidak bisa dibatalkan.",
    confirmButtonText = "Ya, lanjutkan",
    cancelButtonText = "Batal",
    icon = "question",
  } = {}) {
    return Swal.fire({
      title,
      text,
      icon,
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#ef4444",
      confirmButtonText,
      cancelButtonText,
      customClass: {
        popup: `${basePopup} !p-8`,
        title: `${baseTitle} !text-[15px]`,
        htmlContainer: baseText,
        confirmButton:
          "!text-[12.5px] !font-semibold !rounded-lg !px-5 !py-2 !font-[Poppins]",
        cancelButton:
          "!text-[12.5px] !font-semibold !rounded-lg !px-5 !py-2 !font-[Poppins]",
        actions: "!gap-2",
      },
    });
  },

  Status(msg) {
    Swal.fire({
      icon: "warning",
      title: "Status Peserta",
      text: msg,
      position: "center",
      showConfirmButton: false,
      showCloseButton: true,
      allowOutsideClick: true,
      customClass: {
        popup: `${basePopup} !p-8`,
        title: `${baseTitle} !text-[15px]`,
        htmlContainer: baseText,
        closeButton: "!text-slate-400 hover:!text-slate-600 !text-lg",
        icon: "!mb-3",
      },
    });
  },
};

export default Alert;
