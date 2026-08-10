export const warna = {
  primary: '#A8704E',
  primaryDark: '#5E3A22',
  gradasi1: '#BC8A5E',
  gradasi2: '#5F3A23',
  emas: '#B08D57',
  emasBg: '#F5EBDC',
  emasText: '#7A5A33',
  bg: '#FAF6F0',
  card: '#FFFFFF',
  teks: '#382C22',
  muted: '#8B7B6C',
  border: '#E7DACD',
  primaryBg: '#F5E9DE',
  success: '#0E9F6E',
  successBg: '#DCF5E9',
  successText: '#0B6246',
  warn: '#C77800',
  warnBg: '#FCEFD9',
  warnText: '#8A4A00',
  danger: '#B84532',
  dangerBg: '#FBE7E2',
  dangerText: '#8A2E20',
  white: '#FFFFFF',
};

export const akar = {
  primary: '#A8704E',
  primaryDark: '#5E3A22',
  gradasi1: '#BC8A5E',
  gradasi2: '#5F3A23',
  krem: '#F0E4D4',
  tanah: '#6E4A2F',
};

export const radius = { sm: 10, md: 14, lg: 20, xl: 26 };

export const bayangan = {
  card: {
    shadowColor: '#4A3320',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  tombol: {
    shadowColor: '#A8704E',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
};

export const inisial = (nama) =>
  nama
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((k) => k[0].toUpperCase())
    .join('') || '?';

const AKW = ['#A8704E', '#B08D57', '#0E9F6E', '#7C5A3E', '#6E8F9E', '#C77800', '#9B5E6E'];
export const warnaAvatar = (nama) => {
  let h = 0;
  for (let i = 0; i < nama.length; i++) h = (h * 31 + nama.charCodeAt(i)) >>> 0;
  return AKW[h % AKW.length];
};