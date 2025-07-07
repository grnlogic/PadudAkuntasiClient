"use client";

import toast from "react-hot-toast";

// ✅ SUCCESS toasts with debug
export const toastSuccess = {
  save: (count: number, context: string = "") => {
    if (typeof window === "undefined") return;
    return toast.success(`✅ ${count} ${context} berhasil disimpan!`, {
      duration: 3000,
    });
  },

  update: (item: string = "Data") => {
    if (typeof window === "undefined") return;
    return toast.success(`✅ ${item} berhasil diperbarui!`);
  },

  delete: (item: string = "Data") => {
    if (typeof window === "undefined") return;
    return toast.success(`🗑️ ${item} berhasil dihapus!`);
  },

  duplicate: (count: number, total: number) => {
    if (typeof window === "undefined") return;
    return toast.success(
      `🔄 ${count}/${total} data tersimpan\n(Beberapa duplikat terdeteksi)`,
      {
        duration: 4000,
      }
    );
  },

  custom: (message: string) => {
    if (typeof window === "undefined") return;
    return toast.success(message);
  },
};

// ✅ ERROR toasts with debug
export const toastError = {
  network: () => {
    if (typeof window === "undefined") return;
    return toast.error(
      "🌐 Masalah koneksi ke server\nSilakan coba lagi dalam beberapa saat",
      {
        duration: 5000,
      }
    );
  },

  validation: (message: string) => {
    if (typeof window === "undefined") return;
    return toast.error(`❌ Validasi gagal:\n${message}`, {
      duration: 4000,
    });
  },

  duplicate: () => {
    if (typeof window === "undefined") return;
    return toast.error(
      "🔄 Data sudah ada atau duplikat\nSilakan periksa input Anda",
      {
        duration: 4000,
      }
    );
  },

  permission: () => {
    if (typeof window === "undefined") return;
    return toast.error("🚫 Anda tidak memiliki izin untuk operasi ini", {
      duration: 4000,
    });
  },

  notFound: (item: string = "Data") => {
    if (typeof window === "undefined") return;
    return toast.error(`❓ ${item} tidak ditemukan`);
  },

  server: (p0: string) => {
    if (typeof window === "undefined") return;
    return toast.error(
      "⚠️ Terjadi masalah pada server\nTim teknis telah diberitahu",
      {
        duration: 5000,
      }
    );
  },

  custom: (message: string) => {
    if (typeof window === "undefined") return;
    return toast.error(message);
  },
};

// ✅ WARNING toasts with debug
export const toastWarning = {
  partial: (saved: number, total: number) => {
    if (typeof window === "undefined") return;
    return toast(
      `⚠️ ${saved}/${total} data berhasil disimpan\nBeberapa data mungkin sudah ada`,
      {
        icon: "⚠️",
        duration: 4000,
      }
    );
  },
};

// ✅ INFO toasts with debug
export const toastInfo = {
  loading: (message: string = "Memproses...") => {
    if (typeof window === "undefined") return;
    return toast.loading(message);
  },

  dismiss: () => {
    if (typeof window === "undefined") return;
    return toast.dismiss();
  },

  noChanges: () => {
    if (typeof window === "undefined") return;
    return toast("📝 Tidak ada perubahan untuk disimpan", {
      icon: "ℹ️",
      duration: 3000,
    });
  },
};

// ✅ PROMISE toasts with better error handling
export const toastPromise = {
  save: <T>(promise: Promise<T>, context: string = "data") => {
    if (typeof window === "undefined") return promise;

    return toast.promise(
      promise.catch((error) => {
        throw error;
      }),
      {
        loading: `💾 Menyimpan ${context}...`,
        success: (data) => {
          return `✅ ${context} berhasil disimpan!`;
        },
        error: (err) => {
          return `❌ Gagal menyimpan ${context}: ${err.message}`;
        },
      },
      {
        success: { duration: 3000 },
        error: { duration: 5000 },
      }
    );
  },

  load: <T>(promise: Promise<T>, context: string = "data") => {
    if (typeof window === "undefined") return promise;
    return toast.promise(
      promise,
      {
        loading: `📥 Memuat ${context}...`,
        success: `✅ ${context} berhasil dimuat!`,
        error: (err) => `❌ Gagal memuat ${context}: ${err.message}`,
      },
      {
        success: { duration: 2000 },
        error: { duration: 5000 },
      }
    );
  },

  delete: <T>(promise: Promise<T>, context: string = "data") => {
    if (typeof window === "undefined") return promise;

    return toast.promise(promise, {
      loading: `🗑️ Menghapus ${context}...`,
      success: `✅ ${context} berhasil dihapus!`,
      error: (err) => `❌ Gagal menghapus ${context}: ${err.message}`,
    });
  },
};
