import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KUNCI_TOKEN = 'token_absensi';

export function getBaseUrl() {
  const manual = Constants.expoConfig?.extra?.apiUrl;
  if (manual && manual.length > 7) return manual;
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:3000`;
  }
  throw new Error('Isi "apiUrl" di app.json (bagian extra) dengan alamat server API, lalu build ulang.');
}

let url = '';
try {
  url = getBaseUrl();
} catch (e) {
  console.warn(e.message);
}

export const API_URL = url;

let tokenCache = null;

export async function getToken() {
  if (tokenCache) return tokenCache;
  tokenCache = await AsyncStorage.getItem(KUNCI_TOKEN);
  return tokenCache;
}

export async function setToken(token) {
  tokenCache = token;
  if (token) await AsyncStorage.setItem(KUNCI_TOKEN, token);
  else await AsyncStorage.removeItem(KUNCI_TOKEN);
}

export async function api(path, { method = 'GET', body, timeout = 12000 } = {}) {
  if (!API_URL) throw new Error('Aplikasi belum dikonfigurasi (apiUrl kosong). Hubungi admin.');
  const token = await getToken();
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
  } catch {
    throw new Error('Tidak dapat terhubung ke server. Pastikan server dan koneksi internet aktif.');
  } finally {
    clearTimeout(t);
  }
  const text = await res.text();
  let data = {};
  try {
    data = JSON.parse(text);
  } catch {
    if (!res.ok) {
      throw new Error('Server bermasalah. Coba lagi sebentar lagi.');
    }
  }
  if (!res.ok) {
    throw new Error(data.pesan || 'Terjadi kesalahan pada server');
  }
  return data;
}