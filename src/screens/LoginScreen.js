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
  const [role, setRole] = useState('anggota');
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
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
      let res;
      try {
        res = await fetch(API_URL + '/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: form.username, password: form.password }),
        });
      } catch {
        throw new Error('Tidak dapat terhubung ke server. Pastikan server dan koneksi internet aktif.');
      }
      const teks = await res.text();
      let data = {};
      try { data = JSON.parse(teks); } catch {}
      if (!res.ok) throw new Error(data.pesan || 'Login gagal, coba lagi');
      if (data.user.role !== role) {
        throw new Error(
          `Akun ini terdaftar sebagai ${data.user.role === 'admin' ? 'Admin' : 'Anggota'}. Silakan ganti pilihan peran.`
        );
      }
      onLogin(data.token, data.user);
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
            <Text style={styles.subBrand}>Sistem Absensi Anggota Teater</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHead}>
              <View style={styles.garisEmas} />
              <Text style={styles.cardTitle}>Masuk Akun</Text>
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

            <View style={styles.field}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Masukkan username"
                placeholderTextColor="#A89F95"
                autoCapitalize="none"
                value={form.username}
                onChangeText={v => set('username', v)}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Kata Sandi</Text>
              <TextInput
                style={styles.input}
                placeholder="Masukkan kata sandi"
                placeholderTextColor="#A89F95"
                secureTextEntry
                value={form.password}
                onChangeText={v => set('password', v)}
              />
            </View>

            <TouchableOpacity
              style={[styles.btnPrimary, loading && styles.disabled]}
              onPress={submitLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[warna.primary, warna.primaryDark]}
                style={[styles.btnGrad, bayangan.tombol]}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Masuk</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.note}>
              Akun dibuat oleh admin teater. Jika belum punya akun, hubungi admin.
            </Text>
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
    width: 68, height: 68, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,.14)',
    borderWidth: 1.5, borderColor: 'rgba(201,162,39,.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: { color: '#F5E7B8', fontSize: 26, fontWeight: '900', letterSpacing: 1 },
  brand: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 14, letterSpacing: 0.3 },
  subBrand: { color: 'rgba(255,255,255,.72)', fontSize: 13, marginTop: 4 },
  card: {
    backgroundColor: warna.card, borderRadius: radius.xl, padding: 22,
    shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 }, elevation: 10,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  garisEmas: { width: 4, height: 22, borderRadius: 2, backgroundColor: warna.emas, marginRight: 10 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: warna.teks },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  roleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 11, borderRadius: 12, borderWidth: 1.5, borderColor: warna.border,
    backgroundColor: warna.bg, gap: 8,
  },
  roleBtnActive: { borderColor: warna.primary, backgroundColor: warna.primaryBg },
  roleDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#D8CFC4' },
  roleDotActive: { backgroundColor: warna.primary },
  roleText: { fontWeight: '700', color: warna.muted, fontSize: 14 },
  roleTextActive: { color: warna.primaryDark },
  alertErr: { backgroundColor: warna.dangerBg, borderRadius: 12, padding: 12, marginBottom: 14 },
  alertErrText: { color: warna.dangerText, fontSize: 13, fontWeight: '600' },
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '700', color: '#4A4138', marginBottom: 7 },
  input: {
    borderWidth: 1.5, borderColor: warna.border, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: warna.teks,
    backgroundColor: warna.bg,
  },
  btnPrimary: { marginTop: 6 },
  btnGrad: { borderRadius: radius.md, paddingVertical: 15, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.4 },
  disabled: { opacity: 0.6 },
  note: {
    textAlign: 'center', color: warna.muted, fontSize: 12, marginTop: 16, lineHeight: 18,
  },
});