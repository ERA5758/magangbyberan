
'use client';

import type { Auth } from "firebase/auth";

/**
 * Memanggil endpoint Google Apps Script yang telah di-deploy sebagai Web App.
 *
 * @param auth Instance Firebase Auth untuk mendapatkan ID token pengguna.
 * @param payload Data yang akan dikirim ke Apps Script dalam body permintaan.
 * @returns Promise yang resolve dengan respons JSON dari Apps Script.
 */
export async function callAppsScriptEndpoint(auth: Auth, payload: Record<string, any> = {}): Promise<any> {
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    throw new Error("Pengguna tidak terautentikasi. Harap login terlebih dahulu.");
  }

  const appsScriptUrl = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL;

  if (!appsScriptUrl) {
    throw new Error("URL Apps Script tidak dikonfigurasi. Harap atur NEXT_PUBLIC_APPS_SCRIPT_URL.");
  }

  try {
    const idToken = await currentUser.getIdToken(true);

    const response = await fetch(appsScriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`,
      },
      body: JSON.stringify(payload),
      mode: 'cors', // Penting untuk permintaan lintas domain
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Gagal mem-parsing respons error dari Apps Script." }));
        throw new Error(`Apps Script merespons dengan error ${response.status}: ${errorData.message || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Terjadi kesalahan saat memanggil Apps Script:", error);
    // Melempar kembali error agar bisa ditangkap oleh komponen pemanggil
    throw error;
  }
}
