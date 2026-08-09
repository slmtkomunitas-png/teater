export const warna = {
  primary: '#A61B40',
  primaryDark: '#5C0F26',
  gradasi1: '#A61B40',
  gradasi2: '#43101F',
  emas: '#C9A227',
  emasBg: '#FBF3DA',
  emasText: '#8A6D00',
  bg: '#FAF6F1',
  card: '#FFFFFF',
  teks: '#2B2622',
  muted: '#7C7268',
  border: '#E9E1D8',
  primaryBg: '#FBE9EE',
  success: '#0E9F6E',
  successBg: '#D9F5E9',
  successText: '#08634A',
  warn: '#D97706',
  warnBg: '#FCEFDA',
  warnText: '#92400E',
  danger: '#DC2626',
  dangerBg: '#FDE8E8',
  dangerText: '#991B1B',
  white: '#FFFFFF',
};

export const radius = { sm: 10, md: 14, lg: 20, xl: 26 };

export const bayangan = {
  card: {
    shadowColor: '#3B2313',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  tombol: {
    shadowColor: '#A61B40',
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

const AKW = ['#A61B40', '#C9A227', '#0E9F6E', '#7C3AED', '#0EA5E9', '#D97706', '#DB2777'];
export const warnaAvatar = (nama) => {
  let h = 0;
  for (let i = 0; i < nama.length; i++) h = (h * 31 + nama.charCodeAt(i)) >>> 0;
  return AKW[h % AKW.length];
};