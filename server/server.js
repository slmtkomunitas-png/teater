const express = require('express');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const db = new DatabaseSync(process.env.DB_PATH || path.join(__dirname, 'absensi.db'));
db.exec(`
  CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'anggota',
    qr_code TEXT NOT NULL UNIQUE,
    dibuat_pada TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS absensi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    tanggal TEXT NOT NULL,
    jam TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES user(id)
  );
`);

const totalUser = db.prepare('SELECT COUNT(*) AS n FROM user').get();
if (totalUser.n === 0) {
  const username = process.env.SEED_ADMIN_USERNAME || 'admin';
  const password = process.env.SEED_ADMIN_PASSWORD || 'admin123';
  const nama = process.env.SEED_ADMIN_NAMA || 'Admin Teater';
  db.prepare(
    `INSERT INTO user (nama, username, password, role, qr_code, dibuat_pada)
     VALUES (?, ?, ?, 'admin', ?, ?)`
  ).run(nama, username, hashPassword(password), randomQrCode(), new Date().toISOString());
  console.log(`Akun admin default otomatis dibuat: ${username}`);
}

const app = express();
app.use(express.json());

const TZ_WIB = 7 * 60 * 60 * 1000;

function waktuWIB(now = new Date()) {
  const d = new Date(now.getTime() + TZ_WIB);
  return {
    tanggal: d.toISOString().slice(0, 10),
    jam: d.toISOString().slice(11, 19),
  };
}

function validTanggal(t) {
  return typeof t === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(t) &&
    !Number.isNaN(Date.parse(t + 'T12:00:00Z'));
}

function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(pw, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(pw, stored) {
  const [salt, hash] = stored.split(':');
  const check = crypto.scryptSync(pw, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(check));
}

function randomQrCode() {
  return 'ABS-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

const sessions = new Map();
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function makeToken() {
  return crypto.randomBytes(24).toString('hex');
}

function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const s = sessions.get(token);
  if (!s || s.exp < Date.now()) {
    if (s) sessions.delete(token);
    return res.status(401).json({ pesan: 'Sesi berakhir. Silakan login kembali' });
  }
  req.session = s;
  next();
}

function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token && sessions.has(token)) {
    const s = sessions.get(token);
    if (s.exp < Date.now()) {
      sessions.delete(token);
    } else {
      req.session = s;
    }
  }
  next();
}

setInterval(() => {
  const now = Date.now();
  for (const [t, s] of sessions) {
    if (s.exp < now) sessions.delete(t);
  }
}, 60 * 60 * 1000).unref();

const loginCoba = new Map();

function checkRateLimit(ip, username) {
  const kunci = `${ip}|${username}`;
  const now = Date.now();
  const catat = loginCoba.get(kunci);
  if (!catat || catat.jendela < now) {
    loginCoba.set(kunci, { jumlah: 1, jendela: now + 60 * 1000 });
    return { ok: true };
  }
  if (catat.jumlah >= 5) {
    return { ok: false, sisa: Math.ceil((catat.jendela - now) / 1000) };
  }
  catat.jumlah += 1;
  return { ok: true };
}

app.get('/api/me', optionalAuth, (req, res) => {
  if (!req.session) return res.json({ user: null });
  res.json({ user: req.session.user });
});

app.post('/api/users', auth, (req, res) => {
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ pesan: 'Hanya admin yang dapat membuat akun' });
  }
  const { nama, username, password, role } = req.body || {};
  if (typeof nama !== 'string' || typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ pesan: 'Semua kolom wajib diisi' });
  }
  const namaFinal = nama.trim();
  const usernameFinal = username.trim();
  if (!namaFinal || !usernameFinal || !password) {
    return res.status(400).json({ pesan: 'Semua kolom wajib diisi' });
  }
  if (namaFinal.length < 2) {
    return res.status(400).json({ pesan: 'Nama terlalu pendek' });
  }
  if (usernameFinal.length < 3 || /\s/.test(usernameFinal)) {
    return res.status(400).json({ pesan: 'Username minimal 3 karakter tanpa spasi' });
  }
  if (password.length < 6) {
    return res.status(400).json({ pesan: 'Kata sandi minimal 6 karakter' });
  }
  const r = role === 'admin' ? 'admin' : 'anggota';
  try {
    const info = db.prepare(
      `INSERT INTO user (nama, username, password, role, qr_code, dibuat_pada)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(namaFinal, usernameFinal, hashPassword(password), r, randomQrCode(), new Date().toISOString());
    const user = db.prepare('SELECT id, nama, username, role, qr_code FROM user WHERE id = ?')
      .get(info.lastInsertRowid);
    res.status(201).json({ pesan: 'Akun berhasil dibuat', user });
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) {
      return res.status(400).json({ pesan: 'Username sudah digunakan, silakan pilih yang lain' });
    }
    res.status(500).json({ pesan: 'Terjadi kesalahan pada server' });
  }
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
    return res.status(400).json({ pesan: 'Username dan kata sandi wajib diisi' });
  }
  const ip = req.ip || req.socket.remoteAddress || '?';
  const batas = checkRateLimit(ip, username.trim().toLowerCase());
  if (!batas.ok) {
    return res.status(429).json({
      pesan: `Terlalu banyak percobaan login. Coba lagi dalam ${batas.sisa} detik`,
    });
  }
  const row = db.prepare('SELECT * FROM user WHERE username = ?').get(username.trim());
  if (!row || !verifyPassword(password, row.password)) {
    return res.status(401).json({ pesan: 'Username atau kata sandi salah' });
  }
  const token = makeToken();
  const user = {
    id: row.id, nama: row.nama, username: row.username,
    role: row.role, qr_code: row.qr_code,
  };
  sessions.set(token, { user, exp: Date.now() + TOKEN_TTL_MS });
  loginCoba.delete(`${ip}|${username.trim().toLowerCase()}`);
  res.json({ pesan: 'Login berhasil', token, user });
});

app.post('/api/logout', auth, (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) sessions.delete(token);
  res.json({ pesan: 'Logout berhasil' });
});

app.get('/api/anggota', auth, (req, res) => {
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ pesan: 'Akses ditolak' });
  }
  const rows = db.prepare(
    'SELECT id, nama, username, qr_code FROM user WHERE role = ? ORDER BY nama'
  ).all('anggota');
  res.json({ data: rows });
});

app.post('/api/absensi', auth, (req, res) => {
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ pesan: 'Hanya admin yang dapat mencatat kehadiran' });
  }
  const { qr_code } = req.body || {};
  if (!qr_code) {
    return res.status(400).json({ pesan: 'Kode QR tidak ditemukan' });
  }
  const member = db.prepare('SELECT * FROM user WHERE qr_code = ? AND role = ?')
    .get(String(qr_code).trim().toUpperCase(), 'anggota');
  if (!member) {
    return res.status(404).json({
      pesan: 'QR code tidak dikenali. Pastikan itu QR code anggota yang terdaftar',
    });
  }
  const now = waktuWIB();
  const { tanggal, jam } = now;
  let dupe;
  db.exec('BEGIN IMMEDIATE');
  try {
    dupe = db.prepare(
      'SELECT * FROM absensi WHERE userId = ? AND tanggal = ?'
    ).get(member.id, tanggal);
    if (!dupe) {
      db.prepare('INSERT INTO absensi (userId, tanggal, jam) VALUES (?, ?, ?)')
        .run(member.id, tanggal, jam);
    }
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
  if (dupe) {
    return res.json({
      pesan: 'Kehadiran sudah tercatat hari ini',
      sudah: true, nama: member.nama, tanggal, jam: dupe.jam,
    });
  }
  res.status(201).json({
    pesan: `Kehadiran ${member.nama} berhasil dicatat`,
    sudah: false, nama: member.nama, tanggal, jam,
  });
});

app.get('/api/absensi', auth, (req, res) => {
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ pesan: 'Hanya admin yang dapat melihat data kehadiran' });
  }
  let rows;
  if (req.query.tanggal) {
    if (!validTanggal(req.query.tanggal)) {
      return res.status(400).json({ pesan: 'Format tanggal tidak valid (YYYY-MM-DD)' });
    }
    rows = db.prepare(`
      SELECT a.id, a.tanggal, a.jam, u.nama, u.username
      FROM absensi a JOIN user u ON u.id = a.userId
      WHERE a.tanggal = ? ORDER BY a.jam DESC
    `).all(req.query.tanggal);
  } else {
    rows = db.prepare(`
      SELECT a.id, a.tanggal, a.jam, u.nama, u.username
      FROM absensi a JOIN user u ON u.id = a.userId
      ORDER BY a.tanggal DESC, a.jam DESC
    `).all();
  }
  res.json({ data: rows });
});

app.get('/api/absensi/saya', auth, (req, res) => {
  if (req.session.user.role !== 'anggota') {
    return res.status(403).json({ pesan: 'Akses ditolak' });
  }
  const rows = db.prepare(
    'SELECT id, tanggal, jam FROM absensi WHERE userId = ? ORDER BY tanggal DESC, jam DESC'
  ).all(req.session.user.id);
  res.json({ data: rows });
});

function csvEscape(v) {
  const s = String(v ?? '');
  const aman = /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
  return '"' + aman.replace(/"/g, '""') + '"';
}

app.get('/api/absensi/laporan', auth, (req, res) => {
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ pesan: 'Akses ditolak' });
  }
  const anggota = db.prepare(
    "SELECT id, nama, username, qr_code FROM user WHERE role = 'anggota' ORDER BY nama"
  ).all();
  const { tanggal, format } = req.query;

  if (!tanggal) {
    const sessions = db.prepare(
      'SELECT DISTINCT tanggal FROM absensi ORDER BY tanggal DESC'
    ).all();
    return res.json({ data: sessions.map(s => s.tanggal) });
  }

  if (!validTanggal(tanggal)) {
    return res.status(400).json({ pesan: 'Format tanggal tidak valid (YYYY-MM-DD)' });
  }

  const rows = db.prepare(
    'SELECT userId, jam FROM absensi WHERE tanggal = ?'
  ).all(tanggal);
  const hadirMap = {};
  rows.forEach(r => { hadirMap[r.userId] = r.jam; });

  const hadir = [], absen = [];
  anggota.forEach(u => {
    if (hadirMap[u.id]) {
      hadir.push({ id: u.id, nama: u.nama, username: u.username, jam: hadirMap[u.id] });
    } else {
      absen.push({ id: u.id, nama: u.nama, username: u.username });
    }
  });

  const laporan = {
    tanggal,
    total: anggota.length,
    hadirCount: hadir.length,
    absenCount: absen.length,
    hadir,
    absen,
  };

  if (format === 'csv') {
    const baris = [];
    baris.push('Laporan Absensi Teater Sangsuropati');
    baris.push(`Tanggal,${tanggal}`);
    baris.push('');
    baris.push('No,Nama,Username,Status,Jam');
    hadir.forEach((h, i) => {
      baris.push(`${i + 1},${csvEscape(h.nama)},${csvEscape(h.username)},Hadir,${csvEscape(h.jam)}`);
    });
    absen.forEach((a, i) => {
      baris.push(`${hadir.length + i + 1},${csvEscape(a.nama)},${csvEscape(a.username)},Tidak Hadir,`);
    });
    baris.push('');
    baris.push(`Total Anggota,${anggota.length}`);
    baris.push(`Hadir,${hadir.length}`);
    baris.push(`Tidak Hadir,${absen.length}`);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="absensi-${tanggal}.csv"`);
    return res.send('\ufeff' + baris.join('\r\n'));
  }

  res.json({ data: laporan });
});

// Biarkan Express meng-handle IP dari LAN mana pun
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API Absensi Ekstrakurikuler berjalan di http://0.0.0.0:${PORT}`);
});