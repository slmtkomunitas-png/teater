export const warna = {
  primary: '#4F46E5',
  primaryDark: '#3730A3',
  gradasi1: '#6366F1',
  gradasi2: '#312E81',
  bg: '#F1F5F9',
  card: '#FFFFFF',
  teks: '#1E293B',
  muted: '#64748B',
  border: '#E2E8F0',
  success: '#10B981',
  successBg: '#D1FAE5',
  successText: '#065F46',
  warn: '#F59E0B',
  warnBg: '#FEF3C7',
  warnText: '#92400E',
  danger: '#EF4444',
  dangerBg: '#FEE2E2',
  dangerText: '#991B1B',
  white: '#FFFFFF',
};

export const radius = { sm: 10, md: 14, lg: 20, xl: 26 };

export const bayangan = {
  card: {
    shadowColor: '#1E293B',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  tombol: {
    shadowColor: '#4F46E5',
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

const AKW = ['#4F46E5', '#0EA5E9', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#06B6D4'];
export const warnaAvatar = (nama) => {
  let h = 0;
  for (let i = 0; i < nama.length; i++) h = (h * 31 + nama.charCodeAt(i)) >>> 0;
  return AKW[h % AKW.length];
};