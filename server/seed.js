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

function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(pw, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function randomQrCode() {
  return 'ABS-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

const username = process.argv[2] || 'admin';
const password = process.argv[3] || 'admin123';
const nama = process.argv[4] || 'Admin Teater';

const ada = db.prepare('SELECT id FROM user WHERE username = ?').get(username);
if (ada) {
  console.log(`User '${username}' sudah ada, dilewati.`);
} else {
  db.prepare(
    `INSERT INTO user (nama, username, password, role, qr_code, dibuat_pada)
     VALUES (?, ?, ?, 'admin', ?, ?)`
  ).run(nama, username, hashPassword(password), randomQrCode(), new Date().toISOString());
  console.log(`User admin '${username}' berhasil dibuat.`);
}
