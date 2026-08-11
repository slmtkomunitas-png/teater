export const warna = {
  primary: '#D4AF37',
  primaryDark: '#A9861F',
  gradasi1: '#1E1B16',
  gradasi2: '#0A0907',
  emas: '#D4AF37',
  emasBg: '#2A2414',
  emasText: '#E8C766',
  bg: '#141210',
  card: '#1E1B17',
  teks: '#F2E8D5',
  muted: '#A79A85',
  border: '#332D24',
  primaryBg: '#2A2414',
  success: '#3ECF8E',
  successBg: '#12271D',
  successText: '#6FE0AD',
  warn: '#E5A63B',
  warnBg: '#2C210D',
  warnText: '#F2C063',
  danger: '#E0594F',
  dangerBg: '#2E1412',
  dangerText: '#F0A295',
  white: '#FFFFFF',
};

export const radius = { sm: 10, md: 14, lg: 20, xl: 26 };

export const bayangan = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  tombol: {
    shadowColor: '#D4AF37',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
};

export const inisial = (nama) =>
  nama
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((k) => k[0].toUpperCase())
    .join('') || '?';

const AKW = ['#D4AF37', '#B78B2C', '#3ECF8E', '#E5A63B', '#7C8FA0', '#C9853A', '#B4647E'];
export const warnaAvatar = (nama) => {
  let h = 0;
  for (let i = 0; i < nama.length; i++) h = (h * 31 + nama.charCodeAt(i)) >>> 0;
  return AKW[h % AKW.length];
};