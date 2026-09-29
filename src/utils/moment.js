import moment from "moment";
const idLocale = moment.locale("id");

const formatTanggal = (raw) => {
  if (!raw) return "-";
  const date = new Date(raw);
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};
const normalizeDateTime = (value) => {
  if (!value) return "";
  if (value.includes("T")) {
    return value.replace("T", " ").split(".")[0];
  }
  return value;
};

const getOnlyDate = (value) => {
  if (!value) return "";
  return value.split("T")[0] || value.split(" ")[0];
};

const getDateTimeLocal = () => {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60000;
  const wib = new Date(now.getTime() - offsetMs);
  return wib.toISOString().slice(0, 16);
};

const jenisObatLabel = (kode) => {
  switch (kode) {
    case 1:
    case "1":
      return "Obat PRB";
    case 2:
    case "2":
      return "Kronis Blm Stabil";
    case 3:
    case "3":
      return "Obat Kemoterapi";
    default:
      return "-";
  }
};

export const getTodayFormat = (format) => {
  return moment().locale(idLocale).format(format);
};

export {
  formatTanggal,
  normalizeDateTime,
  getOnlyDate,
  jenisObatLabel,
  getDateTimeLocal,
};
