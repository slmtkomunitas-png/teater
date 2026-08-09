import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { api, getToken, setToken } from './src/api';
import { warna } from './src/theme';
import LoginScreen from './src/screens/LoginScreen';
import AnggotaScreen from './src/screens/AnggotaScreen';
import AdminScreen from './src/screens/AdminScreen';

export default function App() {
  const [siap, setSiap] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (token) {
        try {
          const r = await api('/api/me');
          if (r.user) setUser(r.user);
          else await setToken(null);
        } catch {
          await setToken(null);
        }
      }
      setSiap(true);
    })();
  }, []);

  async function handleLogin(token, u) {
    await setToken(token);
    setUser(u);
  }

  async function handleLogout() {
    await api('/api/logout', { method: 'POST' }).catch(() => {});
    await setToken(null);
    setUser(null);
  }

  if (!siap) {
    return (
      <View style={styles.load}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>TS</Text>
        </View>
        <ActivityIndicator size="large" color="#fff" style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {!user ? (
        <LoginScreen onLogin={handleLogin} />
      ) : user.role === 'admin' ? (
        <AdminScreen user={user} onLogout={handleLogout} />
      ) : (
        <AnggotaScreen user={user} onLogout={handleLogout} />
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  load: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: warna.gradasi1,
  },
  logo: {
    width: 76, height: 76, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,.16)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: { color: '#fff', fontSize: 30, fontWeight: '900', letterSpacing: 1 },
});