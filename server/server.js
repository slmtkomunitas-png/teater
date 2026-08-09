const express = require('express');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const db = new DatabaseSync(path.join(__dirname, 'absensi.db'));
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

const app = express();
app.use(express.json());

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

function makeToken() {
  return crypto.randomBytes(24).toString('hex');
}

function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const s = sessions.get(token);
  if (!s) {
    return res.status(401).json({ pesan: 'Silakan login terlebih dahulu' });
  }
  req.session = s;
  next();
}

function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token && sessions.has(token)) req.session = sessions.get(token);
  next();
}

app.get('/api/me', optionalAuth, (req, res) => {
  if (!req.session) return res.json({ user: null });
  res.json({ user: req.session.user });
});

app.post('/api/register', (req, res) => {
  const { nama, username, password, role } = req.body || {};
  if (!nama || !username || !password) {
    return res.status(400).json({ pesan: 'Semua kolom wajib diisi' });
  }
  if (password.length < 6) {
    return res.status(400).json({ pesan: 'Kata sandi minimal 6 karakter' });
  }
  const r = role === 'admin' ? 'admin' : 'anggota';
  try {
    const info = db.prepare(
      `INSERT INTO user (nama, username, password, role, qr_code, dibuat_pada)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(nama, username, hashPassword(password), r, randomQrCode(), new Date().toISOString());
    const user = db.prepare('SELECT id, nama, username, role, qr_code FROM user WHERE id = ?')
      .get(info.lastInsertRowid);
    res.status(201).json({ pesan: 'Registrasi berhasil', user });
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) {
      return res.status(400).json({ pesan: 'Username sudah digunakan, silakan pilih yang lain' });
    }
    res.status(500).json({ pesan: 'Terjadi kesalahan pada server' });
  }
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  const row = db.prepare('SELECT * FROM user WHERE username = ?').get(username);
  if (!row || !verifyPassword(password, row.password)) {
    return res.status(401).json({ pesan: 'Username atau kata sandi salah' });
  }
  const token = makeToken();
  const user = {
    id: row.id, nama: row.nama, username: row.username,
    role: row.role, qr_code: row.qr_code,
  };
  sessions.set(token, { user });
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
  const now = new Date();
  const tanggal = now.toISOString().slice(0, 10);
  const jam = now.toLocaleTimeString('id-ID', { hour12: false });
  const dupe = db.prepare(
    'SELECT * FROM absensi WHERE userId = ? AND tanggal = ?'
  ).get(member.id, tanggal);
  if (dupe) {
    return res.json({
      pesan: 'Kehadiran sudah tercatat hari ini',
      sudah: true, nama: member.nama, tanggal, jam: dupe.jam,
    });
  }
  db.prepare('INSERT INTO absensi (userId, tanggal, jam) VALUES (?, ?, ?)')
    .run(member.id, tanggal, jam);
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

// Biarkan Express meng-handle IP dari LAN mana pun
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API Absensi Ekstrakurikuler berjalan di http://0.0.0.0:${PORT}`);
});