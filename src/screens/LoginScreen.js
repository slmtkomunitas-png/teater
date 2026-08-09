import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_URL, setToken } from '../api';
import { warna, radius, bayangan } from '../theme';

export default function LoginScreen({ onLogin }) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState('login');
  const [role, setRole] = useState('anggota');
  const [form, setForm] = useState({ nama: '', username: '', password: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
    setError('');
  }

  async function submitLogin() {
    if (!form.username || !form.password) {
      return setError('Username dan kata sandi wajib diisi');
    }
    setLoading(true);
    setError('');
    try {
      const r = await fetch(API_URL + '/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.username, password: form.password }),
      }).then(async x => ({ ok: x.ok, data: await x.json() }));
      if (!r.ok) throw new Error(r.data.pesan);
      if (r.data.user.role !== role) {
        throw new Error(
          `Akun ini terdaftar sebagai ${r.data.user.role === 'admin' ? 'Admin' : 'Anggota'}. Silakan ganti pilihan peran.`
        );
      }
      onLogin(r.data.token, r.data.user);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitRegister() {
    if (!form.nama || !form.username || !form.password) {
      return setError('Semua kolom wajib diisi');
    }
    if (form.password.length < 6) {
      return setError('Kata sandi minimal 6 karakter');
    }
    setLoading(true);
    setError('');
    setInfo('');
    try {
      const r = await fetch(API_URL + '/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama: form.nama, username: form.username, password: form.password, role }),
      }).then(async x => ({ ok: x.ok, data: await x.json() }));
      if (!r.ok) throw new Error(r.data.pesan);
      setInfo('Registrasi berhasil. Silakan masuk.');
      setForm({ nama: '', username: '', password: '' });
      setTab('login');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const PilihanPeran = ({ value, label }) => (
    <TouchableOpacity
      style={[styles.roleBtn, role === value && styles.roleBtnActive]}
      onPress={() => setRole(value)}
      activeOpacity={0.8}
    >
      <View style={[styles.roleDot, role === value && styles.roleDotActive]} />
      <Text style={[styles.roleText, role === value && styles.roleTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={[warna.gradasi1, warna.gradasi2]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.flex}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.wrap, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoWrap}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>TS</Text>
            </View>
            <Text style={styles.brand}>Teater Sangsuropati</Text>
            <Text style={styles.subBrand}>Sistem Absensi Anggota</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, tab === 'login' && styles.tabActive]}
                onPress={() => { setTab('login'); setError(''); setInfo(''); }}
              >
                <Text style={[styles.tabText, tab === 'login' && styles.tabTextActive]}>Masuk</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, tab === 'register' && styles.tabActive]}
                onPress={() => { setTab('register'); setError(''); setInfo(''); }}
              >
                <Text style={[styles.tabText, tab === 'register' && styles.tabTextActive]}>Daftar</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.roleRow}>
              <PilihanPeran value="anggota" label="Anggota" />
              <PilihanPeran value="admin" label="Admin" />
            </View>

            {!!error && (
              <View style={styles.alertErr}>
                <Text style={styles.alertErrText}>{error}</Text>
              </View>
            )}
            {!!info && (
              <View style={styles.alertOk}>
                <Text style={styles.alertOkText}>{info}</Text>
              </View>
            )}

            {tab === 'register' && (
              <View style={styles.field}>
                <Text style={styles.label}>Nama Lengkap</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Contoh: Budi Santoso"
                  placeholderTextColor="#94A3B8"
                  value={form.nama}
                  onChangeText={v => set('nama', v)}
                />
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Masukkan username"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                value={form.username}
                onChangeText={v => set('username', v)}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Kata Sandi</Text>
              <TextInput
                style={styles.input}
                placeholder={tab === 'register' ? 'Minimal 6 karakter' : 'Masukkan kata sandi'}
                placeholderTextColor="#94A3B8"
                secureTextEntry
                value={form.password}
                onChangeText={v => set('password', v)}
              />
            </View>

            <TouchableOpacity
              style={[styles.btnPrimary, loading && styles.disabled]}
              onPress={tab === 'login' ? submitLogin : submitRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[warna.gradasi1, warna.primaryDark]}
                style={[styles.btnGrad, bayangan.tombol]}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>
                    {tab === 'login' ? 'Masuk' : 'Buat Akun'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  wrap: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 },
  logoWrap: { alignItems: 'center', marginBottom: 28 },
  logo: {
    width: 68, height: 68, borderRadius: 20, backgroundColor: 'rgba(255,255,255,.16)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: 1 },
  brand: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 14, letterSpacing: 0.3 },
  subBrand: { color: 'rgba(255,255,255,.75)', fontSize: 13, marginTop: 4 },
  card: {
    backgroundColor: warna.card, borderRadius: radius.xl, padding: 22,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 }, elevation: 10,
  },
  tabs: {
    flexDirection: 'row', backgroundColor: '#EEF2FF', borderRadius: radius.md,
    padding: 4, marginBottom: 16,
  },
  tab: { flex: 1, paddingVertical: 11, borderRadius: 11, alignItems: 'center' },
  tabActive: { backgroundColor: '#fff', shadowColor: '#4F46E5', shadowOpacity: 0.15, shadowRadius: 6, elevation: 2 },
  tabText: { fontWeight: '700', color: '#94A3B8' },
  tabTextActive: { color: warna.primary },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  roleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 11, borderRadius: 12, borderWidth: 1.5, borderColor: warna.border,
    backgroundColor: '#FAFBFF', gap: 8,
  },
  roleBtnActive: { borderColor: warna.primary, backgroundColor: '#EEF2FF' },
  roleDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#CBD5E1' },
  roleDotActive: { backgroundColor: warna.primary },
  roleText: { fontWeight: '700', color: '#64748B', fontSize: 14 },
  roleTextActive: { color: warna.primaryDark },
  alertErr: { backgroundColor: warna.dangerBg, borderRadius: 12, padding: 12, marginBottom: 14 },
  alertErrText: { color: warna.dangerText, fontSize: 13, fontWeight: '600' },
  alertOk: { backgroundColor: warna.successBg, borderRadius: 12, padding: 12, marginBottom: 14 },
  alertOkText: { color: warna.successText, fontSize: 13, fontWeight: '600' },
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 7 },
  input: {
    borderWidth: 1.5, borderColor: warna.border, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: warna.teks,
    backgroundColor: '#FAFBFF',
  },
  btnPrimary: { marginTop: 6 },
  btnGrad: { borderRadius: radius.md, paddingVertical: 15, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.3 },
  disabled: { opacity: 0.6 },
});