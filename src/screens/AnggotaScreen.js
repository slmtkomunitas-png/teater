import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl,
  ActivityIndicator,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { api } from '../api';
import { warna, radius, bayangan } from '../theme';
import { Avatar, Chip, Stat, Header, BtnKeluar, Kartu } from '../components';

export default function AnggotaScreen({ user, onLogout }) {
  const [qr, setQr] = useState(null);
  const [riwayat, setRiwayat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const r = await api('/api/absensi/saya');
    setRiwayat(r.data);
  }, []);

  useEffect(() => {
    setQr(user.qr_code);
    load().finally(() => setLoading(false));
  }, [user, load]);

  async function onRefresh() {
    setRefreshing(true);
    await load().catch(() => {});
    setRefreshing(false);
  }

  const today = new Date().toISOString().slice(0, 10);
  const hadirHariIni = riwayat.filter(r => r.tanggal === today).length;

  return (
    <View style={styles.flex}>
      <Header
        title="Teater Sangsuropati"
        subtitle={`Anggota • ${user.nama}`}
        aksi={<BtnKeluar onPress={onLogout} />}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.statRow}>
          <Stat
            label="Kehadiran Hari Ini"
            value={hadirHariIni}
            toneBg={warna.successBg}
            toneTeks={warna.successText}
          />
          <Stat
            label="Total Kehadiran"
            value={riwayat.length}
            toneBg="#EEF2FF"
            toneTeks={warna.primary}
          />
        </View>

        <Kartu>
          <View style={styles.cardHead}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Kartu Absensi QR</Text>
              <Text style={styles.cardSub}>
                Tunjukkan QR code ini kepada admin saat melakukan absensi
              </Text>
            </View>
            <Chip label="AKTIF" tone="netral" />
          </View>

          <View style={styles.qrBox}>
            <View style={styles.qrFrame}>
              {qr ? (
                <QRCode value={qr} size={200} />
              ) : (
                <ActivityIndicator size="large" color={warna.primary} />
              )}
            </View>
          </View>
          <Text style={styles.qrText}>{qr || ''}</Text>

          <TouchableOpacity
            style={[styles.btnSm, bayangan.tombol]}
            onPress={() => setQr(user.qr_code)}
            activeOpacity={0.85}
          >
            <Text style={styles.btnSmText}>Minta Ulang QR Code</Text>
          </TouchableOpacity>
        </Kartu>

        <Kartu>
          <Text style={styles.cardTitle}>Riwayat Kehadiran</Text>
          {riwayat.length === 0 ? (
            <Text style={styles.empty}>Belum ada data kehadiran</Text>
          ) : (
            riwayat.slice(0, 30).map((r, i) => (
              <View key={r.id} style={styles.rowItem}>
                <Avatar nama={user.nama} size={38} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.rowTitle}>{r.tanggal}</Text>
                  <Text style={styles.rowSub}>Pukul {r.jam}</Text>
                </View>
                <Chip label="Hadir" tone="success" />
              </View>
            ))
          )}
        </Kartu>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: warna.bg },
  content: { padding: 16, paddingBottom: 40 },
  statRow: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: warna.teks },
  cardSub: { fontSize: 12.5, color: warna.muted, marginTop: 4, lineHeight: 18 },
  qrBox: { alignItems: 'center', marginTop: 18 },
  qrFrame: {
    backgroundColor: '#fff', borderRadius: radius.lg, padding: 14,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#C7D2FE',
  },
  qrText: {
    textAlign: 'center', marginTop: 14, fontFamily: 'monospace',
    fontSize: 15, letterSpacing: 1.2, color: warna.primary, fontWeight: '700',
  },
  btnSm: {
    alignSelf: 'center', marginTop: 16, backgroundColor: warna.primary,
    borderRadius: 99, paddingHorizontal: 22, paddingVertical: 11,
  },
  btnSmText: { color: '#fff', fontWeight: '700', fontSize: 13, letterSpacing: 0.3 },
  empty: { color: '#94A3B8', textAlign: 'center', marginVertical: 22, fontSize: 13 },
  rowItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: warna.border,
  },
  rowTitle: { fontSize: 14, fontWeight: '700', color: warna.teks },
  rowSub: { fontSize: 12, color: warna.muted, marginTop: 1 },
});