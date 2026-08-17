import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl,
  TextInput, ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { api } from '../api';
import { warna, radius } from '../theme';
import { Avatar, Chip, Stat, Header, BtnKeluar, Kartu } from '../components';
import { tanggalLokal, formatJam } from '../helpers';

import KegiatanPanel from './KegiatanPanel';

export default function AdminScreen({ user, onLogout }) {
  const [tab, setTab] = useState('scan');
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
  const [muat, setMuat] = useState(true);
  const [maks, setMaks] = useState(50);
  const [buat, setBuat] = useState({ nama: '', username: '', password: '', role: 'anggota' });
  const [infoBuat, setInfoBuat] = useState('');
  const [membuat, setMembuat] = useState(false);

  async function buatAkun() {
    if (!buat.nama || !buat.username || !buat.password) {
      return setInfoBuat({ tipe: 'err', pesan: 'Semua kolom wajib diisi' });
    }
    if (buat.password.length < 6) {
      return setInfoBuat({ tipe: 'err', pesan: 'Kata sandi minimal 6 karakter' });
    }
    setMembuat(true);
    setInfoBuat('');
    try {
      await api('/api/users', {
        method: 'POST',
        body: { nama: buat.nama, username: buat.username, password: buat.password, role: buat.role },
      });
      setInfoBuat({ tipe: 'ok', pesan: `Akun ${buat.nama} berhasil dibuat` });
      setBuat({ nama: '', username: '', password: '', role: 'anggota' });
      loadData().catch(() => {});
    } catch (e) {
      setInfoBuat({ tipe: 'err', pesan: e.message });
    } finally {
      setMembuat(false);
    }
  }

  const loadData = useCallback(async () => {
    setMuat(true);
    try {
      const [r1, r2] = await Promise.all([
        api('/api/absensi'),
        api('/api/anggota'),
      ]);
      setData(r1.data);
      setAnggota(r2.data.length);
    } finally {
      setMuat(false);
    }
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
    if (!kode || mengirim) return;
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
      setPemindai(true);
    } finally {
      setMengirim(false);
    }
  }

  async function bukaKamera() {
    if (mengirim) return;
    if (!permission?.granted) {
      const r = await requestPermission();
      if (!r.granted) return;
    }
    setKam(true);
    setPemindai(true);
    setHasil(null);
    setGagal('');
  }

  const tanggalHariIni = tanggalLokal();
  const hadirHariIni = new Set(
    data.filter(d => d.tanggal === tanggalHariIni).map(d => d.username)
  ).size;
  const tampil = filter ? data.filter(d => d.tanggal === filter) : data;
  const filterValid = !filter || /^\d{4}-\d{2}-\d{2}$/.test(filter);
  const ditampilkan = tampil.slice(0, maks);

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
        <View style={styles.tabBar}>
          {['scan', 'kegiatan'].map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, tab === t && styles.tabActive]}
              onPress={() => setTab(t)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'scan' ? 'Scan' : 'Kegiatan'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'scan' ? (<>
        <View style={styles.statRow}>
          <Stat label="Hadir Hari Ini" value={hadirHariIni} toneBg={warna.successBg} toneTeks={warna.successText} />
          <Stat label="Total Absensi" value={data.length} toneBg={warna.primaryBg} toneTeks={warna.primary} />
          <Stat label="Total Anggota" value={anggota} toneBg={warna.emasBg} toneTeks={warna.emasText} />
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
                onBarcodeScanned={pemindai && !mengirim ? (r) => catat(r.data) : undefined}
              />
              {!pemindai && hasil && (
                <View style={styles.hasilKamera}>
                  <Text style={styles.hasilKameraTeks}>✓ {hasil.nama}</Text>
                </View>
              )}
              <View style={styles.camRow}>
                <TouchableOpacity
                  style={styles.tutupBtn}
                  onPress={() => { setKam(false); setPemindai(false); }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.tutupText}>Tutup Kamera</Text>
                </TouchableOpacity>
                {!pemindai && (
                  <TouchableOpacity
                    style={[styles.lagiBtn, mengirim && styles.disabled]}
                    onPress={() => { setPemindai(true); setHasil(null); setGagal(''); }}
                    disabled={mengirim}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.lagiBtnText}>Scan Lagi</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.scanBtn, mengirim && styles.disabled]}
              onPress={bukaKamera}
              disabled={mengirim}
              activeOpacity={0.85}
            >
              <Text style={styles.scanBtnText}>Mulai Scan Kamera</Text>
            </TouchableOpacity>
          )}

          <View style={styles.manualWrap}>
            <TextInput
              style={styles.manualInput}
              placeholder="Kode QR manual, mis. ABS-XXXX"
              placeholderTextColor={warna.placeholder}
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
              {mengirim ? <ActivityIndicator color={warna.darkOnGold} /> : <Text style={styles.manualBtnText}>Catat</Text>}
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
                  <Text style={styles.alertSub}>{formatJam(hasil.jam)} WIB — {hasil.tanggal}</Text>
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
          <Text style={styles.cardTitle}>Tambah Akun</Text>
          <Text style={styles.cardSub}>
            Buatkan akun untuk anggota baru. Akun ini hanya bisa dibuat oleh admin.
          </Text>

          <View style={styles.roleBuatRow}>
            {['anggota', 'admin'].map(r => (
              <TouchableOpacity
                key={r}
                style={[styles.roleBuatBtn, buat.role === r && styles.roleBuatBtnActive]}
                onPress={() => setBuat(b => ({ ...b, role: r }))}
                activeOpacity={0.8}
              >
                <Text style={[styles.roleBuatText, buat.role === r && styles.roleBuatTextActive]}>
                  {r === 'anggota' ? 'Anggota' : 'Admin'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.fieldBuat}>
            <Text style={styles.labelBuat}>Nama Lengkap</Text>
            <TextInput
              style={styles.inputBuat}
              placeholder="Contoh: Budi Santoso"
              placeholderTextColor={warna.placeholder}
              value={buat.nama}
              onChangeText={v => setBuat(b => ({ ...b, nama: v }))}
            />
          </View>
          <View style={styles.fieldBuat}>
            <Text style={styles.labelBuat}>Username</Text>
            <TextInput
              style={styles.inputBuat}
              placeholder="Untuk login anggota"
              placeholderTextColor={warna.placeholder}
              autoCapitalize="none"
              value={buat.username}
              onChangeText={v => setBuat(b => ({ ...b, username: v }))}
            />
          </View>
          <View style={styles.fieldBuat}>
            <Text style={styles.labelBuat}>Kata Sandi</Text>
            <TextInput
              style={styles.inputBuat}
              placeholder="Minimal 6 karakter"
              placeholderTextColor={warna.placeholder}
              secureTextEntry
              value={buat.password}
              onChangeText={v => setBuat(b => ({ ...b, password: v }))}
            />
          </View>

          {!!infoBuat && (
            <View style={[styles.alert, infoBuat.tipe === 'ok' ? styles.alertOk : styles.alertErr, { marginTop: 4 }]}>
              <Text style={infoBuat.tipe === 'ok' ? styles.alertOkTeks : styles.alertErrText}>
                {infoBuat.pesan}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.buatBtn, (membuat) && styles.disabled]}
            onPress={buatAkun}
            disabled={membuat}
            activeOpacity={0.85}
          >
            {membuat ? <ActivityIndicator color={warna.darkOnGold} /> : <Text style={styles.buatBtnText}>Buat Akun</Text>}
          </TouchableOpacity>
        </Kartu>

        <Kartu>
          <View style={styles.headData}>
            <Text style={styles.cardTitle}>Data Kehadiran</Text>
            <Chip label={`${tampil.length} catatan`} tone="netral" />
          </View>

          <View style={styles.filterRow}>
            <TextInput
              style={styles.filterInput}
              placeholder="Filter: YYYY-MM-DD"
              placeholderTextColor={warna.placeholder}
              value={filter}
              onChangeText={v => { setFilter(v); setMaks(50); }}
            />
            <TouchableOpacity style={styles.filterBtn} onPress={() => { setFilter(''); setMaks(50); }} activeOpacity={0.85}>
              <Text style={styles.filterBtnText}>Semua</Text>
            </TouchableOpacity>
          </View>

          {!filterValid ? (
            <Text style={styles.empty}>Format filter salah — gunakan YYYY-MM-DD (mis. 2026-08-15)</Text>
          ) : muat ? (
            <ActivityIndicator size="large" color={warna.primary} style={{ marginVertical: 26 }} />
          ) : tampil.length === 0 ? (
            <Text style={styles.empty}>Belum ada data kehadiran</Text>
          ) : (
            <>
              {ditampilkan.map((d, i) => (
                <View key={d.id} style={styles.rowItem}>
                  <Avatar nama={d.nama} size={38} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.rowTitle}>{d.nama}</Text>
                    <Text style={styles.rowSub}>@{d.username}</Text>
                  </View>
                  <View style={styles.rowTanggal}>
                    <Text style={styles.rowTglText}>{d.tanggal}</Text>
                    <Text style={styles.rowJamText}>{formatJam(d.jam)}</Text>
                  </View>
                </View>
              ))}
              {tampil.length > maks && (
                <TouchableOpacity style={styles.muatBtn} onPress={() => setMaks(maks + 100)} activeOpacity={0.85}>
                  <Text style={styles.muatBtnText}>Muat lebih banyak ({tampil.length - maks} tersisa)</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </Kartu>
        </>) : (
          <KegiatanPanel user={user} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: warna.bg },
  content: { padding: 16, paddingBottom: 40 },
  tabBar: {
    flexDirection: 'row', backgroundColor: warna.card, borderWidth: 1,
    borderColor: warna.border, borderRadius: radius.md, padding: 4, marginBottom: 16, gap: 4,
  },
  tabBtn: {
    flex: 1, paddingVertical: 10, borderRadius: radius.sm, alignItems: 'center',
  },
  tabActive: { backgroundColor: warna.primary },
  tabText: { fontWeight: '700', color: warna.muted, fontSize: 14 },
  tabTextActive: { color: warna.darkOnGold, fontWeight: '800', fontSize: 14 },
  statRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: warna.teks },
  cardSub: { fontSize: 12.5, color: warna.muted, marginTop: 4, marginBottom: 16, lineHeight: 18 },
  cameraWrap: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: '#0F172A' },
  camera: { height: 300 },
  hasilKamera: {
    position: 'absolute', top: 12, left: 12, right: 12,
    backgroundColor: 'rgba(15,23,42,.8)', borderRadius: radius.md, paddingVertical: 8,
    alignItems: 'center',
  },
  hasilKameraTeks: { color: '#fff', fontWeight: '800', fontSize: 14 },
  camRow: { flexDirection: 'row', gap: 10, padding: 12 },
  tutupBtn: {
    flex: 1, backgroundColor: 'rgba(255,255,255,.12)', borderRadius: radius.md,
    paddingVertical: 11, alignItems: 'center',
  },
  tutupText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  lagiBtn: {
    flex: 1, backgroundColor: warna.primary, borderRadius: radius.md,
    paddingVertical: 11, alignItems: 'center',
  },
  lagiBtnText: { color: warna.darkOnGold, fontWeight: '800', fontSize: 13 },
  scanBtn: {
    backgroundColor: warna.primary, borderRadius: radius.md,
    paddingVertical: 15, alignItems: 'center',
  },
  scanBtnText: { color: warna.darkOnGold, fontWeight: '800', fontSize: 15, letterSpacing: 0.3 },
  manualWrap: { flexDirection: 'row', gap: 10, marginTop: 14 },
  manualInput: {
    flex: 1, borderWidth: 1.5, borderColor: warna.border, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14,
    backgroundColor: warna.bg, color: warna.teks,
  },
  manualBtn: {
    backgroundColor: warna.primary, borderRadius: radius.md,
    paddingHorizontal: 20, justifyContent: 'center',
  },
  manualBtnText: { color: warna.darkOnGold, fontWeight: '800', fontSize: 14 },
  disabled: { opacity: 0.6 },
  alert: { borderRadius: radius.md, padding: 14, marginTop: 14 },
  alertOk: { backgroundColor: warna.successBg, borderWidth: 1, borderColor: 'rgba(62,207,142,.35)' },
  alertWarn: { backgroundColor: warna.warnBg, borderWidth: 1, borderColor: 'rgba(229,166,59,.35)' },
  alertErr: { backgroundColor: warna.dangerBg, borderWidth: 1, borderColor: 'rgba(224,89,79,.35)' },
  alertHead: { flexDirection: 'row', alignItems: 'center' },
  alertTitle: { fontWeight: '800', fontSize: 14 },
  alertName: { color: warna.teks, fontWeight: '700', fontSize: 13, marginTop: 3 },
  alertSub: { color: warna.muted, fontSize: 12, marginTop: 1 },
  alertErrText: { color: warna.dangerText, fontWeight: '700', fontSize: 13 },
  alertOkTeks: { color: warna.successText, fontWeight: '700', fontSize: 13 },
  roleBuatRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  roleBuatBtn: {
    flex: 1, paddingVertical: 10, borderRadius: radius.md, borderWidth: 1.5,
    borderColor: warna.border, backgroundColor: warna.bg, alignItems: 'center',
  },
  roleBuatBtnActive: { borderColor: warna.primary, backgroundColor: warna.primaryBg },
  roleBuatText: { fontWeight: '700', color: warna.muted, fontSize: 14 },
  roleBuatTextActive: { color: warna.primaryDark },
  fieldBuat: { marginBottom: 12 },
  labelBuat: { fontSize: 13, fontWeight: '700', color: warna.emasText, marginBottom: 7 },
  inputBuat: {
    borderWidth: 1.5, borderColor: warna.border, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: warna.teks,
    backgroundColor: warna.bg,
  },
  buatBtn: {
    backgroundColor: warna.primary, borderRadius: radius.md,
    paddingVertical: 14, alignItems: 'center', marginTop: 4,
  },
  buatBtnText: { color: warna.darkOnGold, fontWeight: '800', fontSize: 15, letterSpacing: 0.3 },
  headData: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  filterRow: { flexDirection: 'row', gap: 10, marginTop: 16, marginBottom: 6 },
  filterInput: {
    flex: 1, borderWidth: 1.5, borderColor: warna.border, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 13,
    backgroundColor: warna.bg, color: warna.teks,
  },
  filterBtn: {
    backgroundColor: warna.emasBg, borderRadius: radius.md, paddingHorizontal: 18, justifyContent: 'center',
  },
  filterBtnText: { color: warna.primaryDark, fontWeight: '700', fontSize: 13 },
  empty: { color: warna.empty, textAlign: 'center', marginVertical: 22, fontSize: 13 },
  muatBtn: {
    marginTop: 14, borderWidth: 1, borderColor: warna.border, borderRadius: radius.md,
    paddingVertical: 11, alignItems: 'center',
  },
  muatBtnText: { color: warna.primary, fontWeight: '700', fontSize: 13 },
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