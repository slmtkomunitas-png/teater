import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, setToken } from '../api';
import { warna, radius } from '../theme';

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
      const r = await api('/api/login', {
        method: 'POST',
        body: { username: form.username.trim(), password: form.password },
      });
      if (r.user.role !== role) {
        throw new Error(
          `Akun ini terdaftar sebagai ${r.user.role === 'admin' ? 'Admin' : 'Anggota'}. Silakan ganti pilihan peran.`
        );
      }
      await setToken(r.token);
      onLogin(r.token, r.user);
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
    <View style={styles.flex}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.wrap, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoWrap}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>T</Text>
            </View>
            <Text style={styles.brand}>Teater Sangsuropati</Text>
            <Text style={styles.subBrand}>Sistem Absensi Anggota Teater</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Masuk Akun</Text>

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
                placeholderTextColor={warna.placeholder}
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
                placeholderTextColor={warna.placeholder}
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
              {loading ? (
                <ActivityIndicator color={warna.darkOnGold} />
              ) : (
                <Text style={styles.btnText}>Masuk</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.note}>
              Akun dibuat oleh admin teater. Jika belum punya akun, hubungi admin.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: warna.bg },
  wrap: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 },
  logoWrap: { alignItems: 'center', marginBottom: 28 },
  badge: {
    width: 68, height: 68, borderRadius: 20,
    backgroundColor: warna.primary, alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: warna.darkOnGold, fontSize: 30, fontWeight: '900' },
  brand: { color: warna.teks, fontSize: 22, fontWeight: '800', marginTop: 14, letterSpacing: 0.3 },
  subBrand: { color: warna.muted, fontSize: 13, marginTop: 4 },
  card: {
    backgroundColor: warna.card, borderRadius: radius.xl, padding: 22,
    borderWidth: 1, borderColor: warna.border,
  },
  cardTitle: { fontSize: 18, fontWeight: '800', color: warna.teks, marginBottom: 16 },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  roleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 11, borderRadius: radius.md, borderWidth: 1.5, borderColor: warna.border,
    backgroundColor: warna.bg, gap: 8,
  },
  roleBtnActive: { borderColor: warna.primary, backgroundColor: warna.primaryBg },
  roleDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: warna.border },
  roleDotActive: { backgroundColor: warna.primary },
  roleText: { fontWeight: '700', color: warna.muted, fontSize: 14 },
  roleTextActive: { color: warna.emasText },
  alertErr: { backgroundColor: warna.dangerBg, borderRadius: radius.md, padding: 12, marginBottom: 14 },
  alertErrText: { color: warna.dangerText, fontSize: 13, fontWeight: '600' },
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '700', color: warna.emasText, marginBottom: 7 },
  input: {
    borderWidth: 1.5, borderColor: warna.border, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: warna.teks,
    backgroundColor: warna.bg,
  },
  btnPrimary: {
    marginTop: 6, backgroundColor: warna.primary, borderRadius: radius.md,
    alignItems: 'center', paddingVertical: 15,
  },
  btnText: { color: warna.darkOnGold, fontWeight: '800', fontSize: 16, letterSpacing: 0.4 },
  disabled: { opacity: 0.6 },
  note: {
    textAlign: 'center', color: warna.muted, fontSize: 12, marginTop: 16, lineHeight: 18,
  },
});
