export const warna = {
  primary: '#D4AF37',
  primaryDark: '#A9861F',
  gold1: '#F3D97E',
  gold2: '#D4AF37',
  gold3: '#9A741F',
  gradasi1: '#1B1713',
  gradasi2: '#0A0806',
  emas: '#D4AF37',
  emasBg: '#221C10',
  emasText: '#F0D884',
  bg: '#0E0C0A',
  card: '#171412',
  card2: '#1D1915',
  teks: '#F5EBD6',
  muted: '#A99C84',
  border: '#2E2720',
  primaryBg: '#221C12',
  success: '#3ECF8E',
  successBg: '#0F221A',
  successText: '#6FE0AD',
  warn: '#E5A63B',
  warnBg: '#241B09',
  warnText: '#F2C063',
  danger: '#E0594F',
  dangerBg: '#261210',
  dangerText: '#F0A295',
  white: '#FFFFFF',
};

export const radius = { sm: 10, md: 14, lg: 20, xl: 26 };

export const bayangan = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  tombol: {
    shadowColor: '#D4AF37',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 7,
  },
};

export const inisial = (nama) =>
  nama
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((k) => k[0].toUpperCase())
    .join('') || '?';

const AKW = ['#D4AF37', '#B78B2C', '#3ECF8E', '#E5A63B', '#8FA3B5', '#C9853A', '#C1879F'];
export const warnaAvatar = (nama) => {
  let h = 0;
  for (let i = 0; i < nama.length; i++) h = (h * 31 + nama.charCodeAt(i)) >>> 0;
  return AKW[h % AKW.length];
};