import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { warna, radius, bayangan, inisial, warnaAvatar } from './theme';

export function Avatar({ nama, size = 44 }) {
  const bg = warnaAvatar(nama || '?');
  return (
    <View
      style={[styles.avatar, {
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: bg,
      }]}
    >
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.36 }}>
        {inisial(nama)}
      </Text>
    </View>
  );
}

export function Chip({ label, tone = 'success' }) {
  const t = {
    success: { bg: warna.successBg, teks: warna.successText },
    warn: { bg: warna.warnBg, teks: warna.warnText },
    danger: { bg: warna.dangerBg, teks: warna.dangerText },
    netral: { bg: warna.emasBg, teks: warna.emasText },
  }[tone];
  return (
    <View style={[styles.chip, { backgroundColor: t.bg }]}>
      <Text style={[styles.chipText, { color: t.teks }]}>{label}</Text>
    </View>
  );
}

export function Stat({ label, value, toneBg = warna.primaryBg, toneTeks = warna.primary }) {
  return (
    <View style={[styles.stat, bayangan.card, { backgroundColor: toneBg }]}>
      <Text style={[styles.statNum, { color: toneTeks }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function Header({ title, subtitle, aksi }) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={[warna.gradasi1, warna.gradasi2]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, { paddingTop: insets.top + 14 }]}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerLogoWrap}>
          <Image source={require('../assets/icon.png')} style={styles.headerLogo} resizeMode="cover" />
        </View>
        <View style={{ flex: 1, paddingLeft: 12, paddingRight: 12 }}>
          <Text style={styles.headerTitle}>{title}</Text>
          {!!subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
        </View>
        {aksi}
      </View>
    </LinearGradient>
  );
}

export function BtnKeluar({ onPress }) {
  return (
    <TouchableOpacity style={styles.keluar} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.keluarText}>Keluar</Text>
    </TouchableOpacity>
  );
}

export function Kartu({ children, style }) {
  return <View style={[styles.kartu, bayangan.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
  headerLogoWrap: {
    width: 46, height: 46, borderRadius: 13, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(212,175,55,.6)', backgroundColor: '#0A0907',
  },
  headerLogo: { width: '100%', height: '100%' },
  chip: {
    borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  chipText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  stat: {
    flex: 1, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center',
  },
  statNum: { fontSize: 26, fontWeight: '800' },
  statLabel: { fontSize: 11, color: warna.muted, marginTop: 3, textAlign: 'center' },
  header: { paddingHorizontal: 20, paddingBottom: 22, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 19, fontWeight: '800', letterSpacing: 0.2 },
  headerSubtitle: { color: 'rgba(255,255,255,.75)', fontSize: 13, marginTop: 3 },
  keluar: {
    borderWidth: 1, borderColor: 'rgba(255,255,255,.45)', borderRadius: 99,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  keluarText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  kartu: {
    backgroundColor: warna.card, borderRadius: radius.lg, padding: 20, marginBottom: 16,
  },
  baris: { flexDirection: 'row', alignItems: 'center' },
});