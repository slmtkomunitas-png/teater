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
    success: { bg: warna.successBg, teks: warna.successText, brd: 'rgba(62,207,142,.35)' },
    warn: { bg: warna.warnBg, teks: warna.warnText, brd: 'rgba(229,166,59,.35)' },
    danger: { bg: warna.dangerBg, teks: warna.dangerText, brd: 'rgba(224,89,79,.35)' },
    netral: { bg: warna.emasBg, teks: warna.emasText, brd: 'rgba(212,175,55,.4)' },
  }[tone];
  return (
    <View style={[styles.chip, { backgroundColor: t.bg, borderColor: t.brd }]}>
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
    <View style={[styles.headerWrap, { paddingTop: insets.top + 14 }]}>
      <LinearGradient
        colors={[warna.gradasi1, warna.gradasi2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
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
        <View style={styles.garisEmas} />
      </LinearGradient>
    </View>
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
  return (
    <View style={[styles.kartu, bayangan.card, style]}>
      <View style={styles.kartuTop} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
  headerWrap: { backgroundColor: warna.gradasi2 },
  headerLogoWrap: {
    width: 46, height: 46, borderRadius: 13, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(212,175,55,.65)', backgroundColor: '#0A0806',
  },
  headerLogo: { width: '100%', height: '100%' },
  chip: {
    borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5,
    alignSelf: 'flex-start', borderWidth: 1,
  },
  chipText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  stat: {
    flex: 1, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(212,175,55,.18)',
  },
  statNum: { fontSize: 26, fontWeight: '800' },
  statLabel: { fontSize: 11, color: warna.muted, marginTop: 3, textAlign: 'center' },
  header: { paddingHorizontal: 20, paddingBottom: 18, overflow: 'hidden' },
  garisEmas: {
    height: 2, width: 64, borderRadius: 2, marginTop: 14,
    backgroundColor: warna.emas, opacity: 0.85,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 19, fontWeight: '800', letterSpacing: 0.2 },
  headerSubtitle: { color: 'rgba(240,216,132,.65)', fontSize: 13, marginTop: 3 },
  keluar: {
    borderWidth: 1, borderColor: 'rgba(212,175,55,.55)', borderRadius: 99,
    paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(212,175,55,.08)',
  },
  keluarText: { color: warna.emasText, fontSize: 13, fontWeight: '700' },
  kartu: {
    backgroundColor: warna.card, borderRadius: radius.lg, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: warna.border, overflow: 'hidden',
  },
  kartuTop: {
    position: 'absolute', top: 0, left: 20, right: 20, height: 2,
    borderRadius: 2, backgroundColor: 'rgba(212,175,55,.28)',
  },
  baris: { flexDirection: 'row', alignItems: 'center' },
});