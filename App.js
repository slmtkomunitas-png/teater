import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet, Image } from 'react-native';
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
        <Image source={require('./assets/icon.png')} style={styles.logo} resizeMode="cover" />
        <ActivityIndicator size="large" color="#D4AF37" style={{ marginTop: 20 }} />
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
    backgroundColor: warna.gradasi2,
  },
  logo: {
    width: 96, height: 96, borderRadius: 24, overflow: 'hidden',
    borderWidth: 1.5, borderColor: 'rgba(212,175,55,.55)',
  },
});