import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl,
  TextInput, ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { api } from '../api';
import { warna, radius, bayangan } from '../theme';
import { Avatar, Chip, Stat, Header, BtnKeluar, Kartu } from '../components';

export default function AdminScreen({ user, onLogout }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [kam, setKam] = useState(false);
  const [pemindai, setPemindai] = useState(false);
  const [hasil, setHasil] = useState(null);
  const [gagal, setGagal] = useState('');
  const [kodeManual, setKodeManual] = useState('');
  const [data, setData] = useState([]);
  const [anggota, setAnggota] = useState(0);
  const [filter, setFilter] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [mengirim, setMengirim] = useState(false);

  const loadData = useCallback(async () => {
    const [r1, r2] = await Promise.all([
      api('/api/absensi'),
      api('/api/anggota'),
    ]);
    setData(r1.data);
    setAnggota(r2.data.length);
  }, []);

  useEffect(() => {
    loadData().catch(() => {});
  }, [loadData]);

  async function onRefresh() {
    setRefreshing(true);
    await loadData().catch(() => {});
    setRefreshing(false);
  }

  async function catat(kode) {
    if (!kode) return;
    setMengirim(true);
    setGagal('');
    setHasil(null);
    setPemindai(false);
    try {
      const r = await api('/api/absensi', {
        method: 'POST',
        body: { qr_code: kode.trim().toUpperCase() },
      });
      setHasil(r);
      loadData().catch(() => {});
    } catch (e) {
      setGagal(e.message);
    } finally {
      setMengirim(false);
    }
  }

  async function bukaKamera() {
    if (!permission?.granted) {
      await requestPermission();
    }
    setKam(true);
    setPemindai(true);
    setHasil(null);
    setGagal('');
  }

  const tanggalHariIni = new Date().toISOString().slice(0, 10);
  const hadirHariIni = new Set(
    data.filter(d => d.tanggal === tanggalHariIni).map(d => d.username)
  ).size;
  const tampil = filter ? data.filter(d => d.tanggal === filter) : data;

  return (
    <View style={styles.flex}>
      <Header
        title="Teater Sangsuropati"
        subtitle={`Admin • ${user.nama}`}
        aksi={<BtnKeluar onPress={onLogout} />}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.statRow}>
          <Stat label="Hadir Hari Ini" value={hadirHariIni} toneBg={warna.successBg} toneTeks={warna.successText} />
          <Stat label="Total Absensi" value={data.length} toneBg="#EEF2FF" toneTeks={warna.primary} />
          <Stat label="Total Anggota" value={anggota} toneBg="#FDF4FF" toneTeks="#A21CAF" />
        </View>

        <Kartu>
          <Text style={styles.cardTitle}>Scan QR Anggota</Text>
          <Text style={styles.cardSub}>
            Arahkan kamera ke QR code anggota untuk mencatat kehadiran
          </Text>

          {kam ? (
            <View style={styles.cameraWrap}>
              <CameraView
                style={styles.camera}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={pemindai ? (r) => catat(r.data) : undefined}
              />
              <View style={styles.overlayKiri} pointerEvents="none" />
              <View style={styles.overlayKanan} pointerEvents="none" />
              <TouchableOpacity
                style={styles.tutupBtn}
                onPress={() => { setKam(false); setPemindai(false); }}
                activeOpacity={0.85}
              >
                <Text style={styles.tutupText}>Tutup Kamera</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.scanBtn, bayangan.tombol]}
              onPress={bukaKamera}
              activeOpacity={0.85}
            >
              <Text style={styles.scanBtnText}>Mulai Scan Kamera</Text>
            </TouchableOpacity>
          )}

          <View style={styles.manualWrap}>
            <TextInput
              style={styles.manualInput}
              placeholder="Kode QR manual, mis. ABS-XXXX"
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
              value={kodeManual}
              onChangeText={setKodeManual}
            />
            <TouchableOpacity
              style={[styles.manualBtn, mengirim && styles.disabled]}
              onPress={() => { catat(kodeManual); setKodeManual(''); }}
              disabled={mengirim}
              activeOpacity={0.85}
            >
              {mengirim ? <ActivityIndicator color="#fff" /> : <Text style={styles.manualBtnText}>Catat</Text>}
            </TouchableOpacity>
          </View>

          {!!hasil && (
            <View style={[styles.alert, hasil.sudah ? styles.alertWarn : styles.alertOk]}>
              <View style={styles.alertHead}>
                <Avatar nama={hasil.nama} size={40} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.alertTitle, { color: hasil.sudah ? warna.warnText : warna.successText }]}>
                    {hasil.sudah ? 'Sudah tercatat hari ini' : 'Kehadiran tercatat'}
                  </Text>
                  <Text style={styles.alertName}>{hasil.nama}</Text>
                  <Text style={styles.alertSub}>{hasil.tanggal} — pukul {hasil.jam}</Text>
                </View>
                <Chip label={hasil.sudah ? 'DUPLIKAT' : 'BARU'} tone={hasil.sudah ? 'warn' : 'success'} />
              </View>
            </View>
          )}
          {!!gagal && (
            <View style={[styles.alert, styles.alertErr]}>
              <Text style={styles.alertErrText}>{gagal}</Text>
            </View>
          )}
        </Kartu>

        <Kartu>
          <View style={styles.headData}>
            <Text style={styles.cardTitle}>Data Kehadiran</Text>
            <Chip label={`${tampil.length} catatan`} tone="netral" />
          </View>

          <View style={styles.filterRow}>
            <TextInput
              style={styles.filterInput}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#94A3B8"
              value={filter}
              onChangeText={setFilter}
            />
            <TouchableOpacity style={styles.filterBtn} onPress={() => setFilter('')} activeOpacity={0.85}>
              <Text style={styles.filterBtnText}>Semua</Text>
            </TouchableOpacity>
          </View>

          {tampil.length === 0 ? (
            <Text style={styles.empty}>Belum ada data kehadiran</Text>
          ) : (
            tampil.slice(0, 50).map((d, i) => (
              <View key={d.id} style={styles.rowItem}>
                <Avatar nama={d.nama} size={38} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.rowTitle}>{d.nama}</Text>
                  <Text style={styles.rowSub}>@{d.username}</Text>
                </View>
                <View style={styles.rowTanggal}>
                  <Text style={styles.rowTglText}>{d.tanggal}</Text>
                  <Text style={styles.rowJamText}>{d.jam}</Text>
                </View>
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
  statRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: warna.teks },
  cardSub: { fontSize: 12.5, color: warna.muted, marginTop: 4, marginBottom: 16, lineHeight: 18 },
  cameraWrap: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: '#0F172A' },
  camera: { height: 300 },
  overlayKiri: {
    position: 'absolute', top: '18%', left: '10%', bottom: '18%', width: 44,
    borderTopWidth: 3, borderLeftWidth: 3, borderColor: '#fff', borderRadius: 6,
  },
  overlayKanan: {
    position: 'absolute', top: '18%', right: '10%', bottom: '18%', width: 44,
    borderTopWidth: 3, borderRightWidth: 3, borderColor: '#fff', borderRadius: 6,
  },
  tutupBtn: {
    position: 'absolute', bottom: 14, alignSelf: 'center',
    backgroundColor: 'rgba(15,23,42,.75)', borderRadius: 99,
    paddingHorizontal: 22, paddingVertical: 9,
  },
  tutupText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  scanBtn: { backgroundColor: warna.primary, borderRadius: radius.md, paddingVertical: 15, alignItems: 'center' },
  scanBtnText: { color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 0.3 },
  manualWrap: { flexDirection: 'row', gap: 10, marginTop: 14 },
  manualInput: {
    flex: 1, borderWidth: 1.5, borderColor: warna.border, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, backgroundColor: '#FAFBFF',
  },
  manualBtn: {
    backgroundColor: warna.success, borderRadius: radius.md,
    paddingHorizontal: 20, justifyContent: 'center',
  },
  manualBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  disabled: { opacity: 0.6 },
  alert: { borderRadius: radius.md, padding: 14, marginTop: 14 },
  alertOk: { backgroundColor: warna.successBg, borderWidth: 1, borderColor: '#A7F3D0' },
  alertWarn: { backgroundColor: warna.warnBg, borderWidth: 1, borderColor: '#FDE68A' },
  alertErr: { backgroundColor: warna.dangerBg, borderWidth: 1, borderColor: '#FECACA' },
  alertHead: { flexDirection: 'row', alignItems: 'center' },
  alertTitle: { fontWeight: '800', fontSize: 14 },
  alertName: { color: warna.teks, fontWeight: '700', fontSize: 13, marginTop: 3 },
  alertSub: { color: warna.muted, fontSize: 12, marginTop: 1 },
  alertErrText: { color: warna.dangerText, fontWeight: '700', fontSize: 13 },
  headData: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  filterRow: { flexDirection: 'row', gap: 10, marginTop: 16, marginBottom: 6 },
  filterInput: {
    flex: 1, borderWidth: 1.5, borderColor: warna.border, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, backgroundColor: '#FAFBFF',
  },
  filterBtn: {
    backgroundColor: '#EEF2FF', borderRadius: radius.md, paddingHorizontal: 18, justifyContent: 'center',
  },
  filterBtnText: { color: warna.primaryDark, fontWeight: '700', fontSize: 13 },
  empty: { color: '#94A3B8', textAlign: 'center', marginVertical: 22, fontSize: 13 },
  rowItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: warna.border,
  },
  rowTitle: { fontSize: 14, fontWeight: '700', color: warna.teks },
  rowSub: { fontSize: 12, color: warna.muted, marginTop: 1 },
  rowTanggal: { alignItems: 'flex-end' },
  rowTglText: { fontSize: 12.5, fontWeight: '700', color: warna.teks },
  rowJamText: { fontSize: 12, color: warna.muted, marginTop: 1 },
});