import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DatabaseProvider } from '@/db';
import { useTheme } from '@/theme';

function Navigator() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.bg },
        headerTintColor: theme.text,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: theme.bg },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="nuevo-pedido"
        options={{ title: 'Nuevo pedido', presentation: 'modal' }}
      />
      <Stack.Screen
        name="producto"
        options={{ title: 'Producto', presentation: 'modal' }}
      />
      <Stack.Screen name="insumo" options={{ title: 'Insumo', presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <DatabaseProvider>
        <Navigator />
      </DatabaseProvider>
    </SafeAreaProvider>
  );
}
