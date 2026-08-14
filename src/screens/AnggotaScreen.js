import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl,
  ActivityIndicator,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { api } from '../api';
import { warna, radius } from '../theme';
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

  function lastSaturday() {
    const d = new Date();
    const day = d.getDay();
    const diff = (day + 6) % 7 + 1;
    d.setDate(d.getDate() - diff);
    return d.toISOString().slice(0, 10);
  }
  const sabtuIni = lastSaturday();
  const catatanSabtu = riwayat.find(r => r.tanggal === sabtuIni);

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
            toneBg={warna.primaryBg}
            toneTeks={warna.primary}
          />
        </View>

        <Kartu>
          <View style={styles.cardHead}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Kegiatan Sabtu Ini</Text>
              <Text style={styles.cardSub}>
                Latihan rutin Sabtu — {sabtuIni}
              </Text>
            </View>
            <Chip label={catatanSabtu ? 'HADIR' : 'BELUM HADIR'} tone={catatanSabtu ? 'success' : 'warn'} />
          </View>
          {catatanSabtu ? (
            <View style={styles.sabtuOk}>
              <Text style={styles.sabtuOkText}>
                Anda tercatat hadir pukul {catatanSabtu.jam}. Tetap semangat latihan!
              </Text>
            </View>
          ) : (
            <View style={styles.sabtuBelum}>
              <Text style={styles.sabtuBelumText}>
                Belum ada catatan kehadiran. Tunjukkan QR Anda kepada admin saat latihan.
              </Text>
            </View>
          )}
        </Kartu>

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
                <QRCode value={qr} size={200} color="#0E0C0A" backgroundColor="#FFFFFF" />
              ) : (
                <ActivityIndicator size="large" color={warna.primary} />
              )}
            </View>
          </View>
          <Text style={styles.qrText}>{qr || ''}</Text>

          <TouchableOpacity
            style={styles.btnSm}
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
    backgroundColor: '#fff', borderRadius: radius.md, padding: 14,
    borderWidth: 1, borderColor: 'rgba(212,175,55,.35)',
  },
  qrText: {
    textAlign: 'center', marginTop: 14, fontFamily: 'monospace',
    fontSize: 15, letterSpacing: 1.2, color: warna.emasText, fontWeight: '700',
  },
  btnSm: {
    alignSelf: 'center', marginTop: 16, backgroundColor: warna.primary,
    borderRadius: 99, paddingHorizontal: 24, paddingVertical: 11,
  },
  btnSmText: { color: '#0E0C0A', fontWeight: '800', fontSize: 13, letterSpacing: 0.3 },
  empty: { color: '#7A6F5C', textAlign: 'center', marginVertical: 22, fontSize: 13 },
  sabtuOk: { backgroundColor: warna.successBg, borderRadius: radius.md, padding: 12, marginTop: 10 },
  sabtuOkText: { color: warna.successText, fontSize: 13, fontWeight: '600', lineHeight: 19 },
  sabtuBelum: { backgroundColor: warna.warnBg, borderRadius: radius.md, padding: 12, marginTop: 10 },
  sabtuBelumText: { color: warna.warnText, fontSize: 13, fontWeight: '600', lineHeight: 19 },
  rowItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: warna.border,
  },
  rowTitle: { fontSize: 14, fontWeight: '700', color: warna.teks },
  rowSub: { fontSize: 12, color: warna.muted, marginTop: 1 },
});