import { parseDate } from "./distribusi";

export const formatterAngka = new Intl.NumberFormat("id-ID");

const formatterTanggal = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const formatterTanggalSingkat = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
});

export const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  return formatterTanggal.format(parseDate(value));
};

export const formatDateSingkat = (value) => {
  if (!value) {
    return "Belum ada";
  }

  return formatterTanggalSingkat.format(parseDate(value));
};

export const formatTonase = (value) => `${formatterAngka.format(Number(value) || 0)} ton`;
