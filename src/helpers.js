export function tanggalLokal(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function lastSaturday() {
  const d = new Date();
  const day = d.getDay();
  const diff = (day + 6) % 7 + 1;
  d.setDate(d.getDate() - diff);
  return tanggalLokal(d);
}

export function formatTanggal(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || '';
  const [y, m, d] = iso.split('-').map(Number);
  const nama = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const tgl = new Date(y, m - 1, d);
  return `${nama[tgl.getDay()]}, ${d} ${bulan[m - 1]} ${y}`;
}

export function formatJam(jam) {
  if (!jam) return '';
  const s = String(jam).trim();
  const m = s.match(/^(\d{1,2})[.:](\d{2})/);
  if (m) return `${m[1].padStart(2, '0')}:${m[2]}`;
  return s;
}
