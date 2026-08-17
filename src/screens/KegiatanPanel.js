import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { api, API_URL, getToken } from '../api';
import { warna, radius } from '../theme';
import { Chip, Kartu } from '../components';
import { lastSaturday, formatJam } from '../helpers';

function isSaturday(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr + 'T12:00:00');
  return d.getDay() === 6;
}

export default function KegiatanPanel({ user }) {
  const [tanggal, setTanggal] = useState(lastSaturday());
  const [sesi, setSesi] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [unduh, setUnduh] = useState(false);

  const muatLaporan = useCallback(async (t) => {
    setLoading(true);
    try {
      const r = await api(`/api/absensi/laporan?tanggal=${t}`);
      setData(r.data);
    } catch (e) {
      setData({ hadir: [], absen: [], total: 0, hadirCount: 0, absenCount: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  const muatSesi = useCallback(async () => {
    try {
      const r = await api('/api/absensi/laporan');
      setSesi(r.data);
      if (r.data.length > 0 && !tanggal) setTanggal(r.data[0]);
    } catch {}
  }, [tanggal]);

  useEffect(() => { muatSesi(); }, []);
  useEffect(() => { if (tanggal) muatLaporan(tanggal); }, [tanggal]);

  async function unduhCSV() {
    setUnduh(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/absensi/laporan?tanggal=${tanggal}&format=csv`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const text = await res.text();
      if (!res.ok) throw new Error('Server menolak unduhan CSV');
      const path = `${FileSystem.cacheDirectory}absensi-${tanggal}.csv`;
      await FileSystem.writeAsStringAsync(path, text, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(path, {
        mimeType: 'text/csv',
        dialogTitle: `Bagikan Laporan Absensi ${tanggal}`,
      });
    } catch (e) {
      console.warn('Gagal unduh:', e.message);
    } finally {
      setUnduh(false);
    }
  }

  const label = isSaturday(tanggal) ? 'Sabtu' : '';

  return (
    <View>
      <Kartu>
        <Text style={styles.cardTitle}>Pilih Tanggal Kegiatan</Text>
        <View style={styles.tglRow}>
          <TouchableOpacity
            style={[styles.tglBtn, { borderWidth: 1, borderColor: warna.border }]}
            onPress={() => setTanggal(lastSaturday())}
            activeOpacity={0.8}
          >
            <Text style={styles.tglBtnText}>Sabtu Lalu</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.tglInput}
            value={tanggal}
            onChangeText={setTanggal}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={warna.placeholder}
            autoCapitalize="none"
          />
        </View>

        {sesi.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {sesi.slice(0, 10).map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.sesiChip, s === tanggal && styles.sesiChipActive]}
                  onPress={() => setTanggal(s)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.sesiChipText, s === tanggal && styles.sesiChipTextActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}
      </Kartu>

      {loading ? (
        <ActivityIndicator size="large" color={warna.primary} style={{ margin: 40 }} />
      ) : data ? (
        <>
          <Kartu>
            <View style={styles.statRow}>
              <View style={[styles.statBox, { backgroundColor: warna.primaryBg }]}>
                <Text style={[styles.statNum, { color: warna.primary }]}>{data.total}</Text>
                <Text style={styles.statLabel}>Total Anggota</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: warna.successBg }]}>
                <Text style={[styles.statNum, { color: warna.successText }]}>{data.hadirCount}</Text>
                <Text style={styles.statLabel}>Hadir</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: warna.dangerBg }]}>
                <Text style={[styles.statNum, { color: warna.dangerText }]}>{data.absenCount}</Text>
                <Text style={styles.statLabel}>Tidak Hadir</Text>
              </View>
            </View>
            <View style={styles.tglLabel}>
              {isSaturday(tanggal) && <Chip label="Sabtu" tone="netral" />}
              <Text style={styles.tglText}>{tanggal}</Text>
              {data.total > 0 && (
                <Chip label={`${Math.round((data.hadirCount / data.total) * 100)}% hadir`} tone="success" />
              )}
            </View>
          </Kartu>

          {data.hadir.length > 0 && (
            <Kartu>
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle}>Hadir</Text>
                <Chip label={`${data.hadirCount} orang`} tone="success" />
              </View>
              {data.hadir.map((h, i) => (
                <View key={h.id} style={styles.rowItem}>
                  <View style={[styles.badge, { backgroundColor: warna.successBg }]}>
                    <Text style={[styles.badgeText, { color: warna.successText }]}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.rowTitle}>{h.nama}</Text>
                    <Text style={styles.rowSub}>@{h.username} — {formatJam(h.jam)} WIB</Text>
                  </View>
                  <Chip label="Hadir" tone="success" />
                </View>
              ))}
            </Kartu>
          )}

          {data.absen.length > 0 && (
            <Kartu>
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle}>Tidak Hadir</Text>
                <Chip label={`${data.absenCount} orang`} tone="danger" />
              </View>
              {data.absen.map((a, i) => (
                <View key={a.id} style={styles.rowItem}>
                  <View style={[styles.badge, { backgroundColor: warna.dangerBg }]}>
                    <Text style={[styles.badgeText, { color: warna.dangerText }]}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.rowTitle}>{a.nama}</Text>
                    <Text style={styles.rowSub}>@{a.username}</Text>
                  </View>
                  <Chip label="Tidak Hadir" tone="danger" />
                </View>
              ))}
            </Kartu>
          )}

          <TouchableOpacity
            style={[styles.unduhBtn, unduh && styles.disabled]}
            onPress={unduhCSV}
            disabled={unduh}
            activeOpacity={0.85}
          >
            {unduh ? (
              <ActivityIndicator color={warna.darkOnGold} />
            ) : (
              <Text style={styles.unduhBtnText}>Unduh & Bagikan Laporan CSV</Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <Text style={styles.empty}>Pilih tanggal untuk melihat laporan</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardTitle: { fontSize: 16, fontWeight: '800', color: warna.teks },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  tglRow: { flexDirection: 'row', gap: 10, marginTop: 14, alignItems: 'center' },
  tglBtn: { backgroundColor: warna.primaryBg, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 11 },
  tglBtnText: { color: warna.primary, fontWeight: '700', fontSize: 13 },
  tglInput: {
    flex: 1, borderWidth: 1.5, borderColor: warna.border, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: warna.teks, backgroundColor: warna.bg,
  },
  sesiChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99, backgroundColor: warna.primaryBg,
    borderWidth: 1, borderColor: 'transparent',
  },
  sesiChipActive: { borderColor: warna.primary, backgroundColor: warna.primary },
  sesiChipText: { fontSize: 12, fontWeight: '700', color: warna.primary },
  sesiChipTextActive: { color: '#fff' },
  statRow: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 11, color: warna.muted, marginTop: 2, fontWeight: '600' },
  tglLabel: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  tglText: { fontSize: 14, fontWeight: '700', color: warna.teks, marginTop: 1 },
  rowItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: warna.border,
  },
  badge: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontWeight: '800', fontSize: 12 },
  rowTitle: { fontSize: 14, fontWeight: '700', color: warna.teks },
  rowSub: { fontSize: 12, color: warna.muted, marginTop: 1 },
  unduhBtn: {
    backgroundColor: warna.primary, borderRadius: radius.md, paddingVertical: 15,
    marginTop: 16, marginBottom: 24, alignItems: 'center',
  },
  unduhBtnText: { color: warna.darkOnGold, fontWeight: '800', fontSize: 15, letterSpacing: 0.3 },
  disabled: { opacity: 0.6 },
  empty: { color: warna.empty, textAlign: 'center', marginVertical: 30, fontSize: 13 },
});