
'use client';

import type { Auth } from "firebase/auth";

/**
 * Memanggil endpoint Google Apps Script yang telah di-deploy sebagai Web App.
 *
 * @param auth Instance Firebase Auth untuk mendapatkan ID token pengguna.
 * @param appsScriptUrl URL dari Web App Google Apps Script yang akan dipanggil.
 * @param payload Data yang akan dikirim ke Apps Script dalam body permintaan.
 * @returns Promise yang resolve dengan respons JSON dari Apps Script.
 */
export async function callAppsScriptEndpoint(auth: Auth, appsScriptUrl: string, payload: Record<string, any> = {}): Promise<any> {
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    throw new Error("Pengguna tidak terautentikasi. Harap login terlebih dahulu.");
  }

  if (!appsScriptUrl) {
    throw new Error("URL Apps Script tidak disediakan.");
  }

  try {
    const idToken = await currentUser.getIdToken(true);

    // IMPORTANT: Change Content-Type to 'text/plain' to avoid CORS preflight issues with Google Apps Script.
    // The Apps Script side will need to JSON.parse(e.postData.contents).
    const response = await fetch(appsScriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({
        authToken: idToken,
        ...payload,
      }),
      mode: 'cors',
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
