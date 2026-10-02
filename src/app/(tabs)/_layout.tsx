import { Tabs } from 'expo-router/js-tabs';

import { Icon } from '@/components/Icon';
import { listActiveOrders } from '@/db/orders';
import { useQuery } from '@/hooks/useQuery';
import { useTheme } from '@/theme';

export default function TabsLayout() {
  const theme = useTheme();
  const { data } = useQuery('active-orders', listActiveOrders);
  const activeCount = data?.length ?? 0;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.bg },
        headerTintColor: theme.text,
        headerTitleStyle: { fontWeight: '700' },
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        sceneStyle: { backgroundColor: theme.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Barra',
          tabBarBadge: activeCount > 0 ? activeCount : undefined,
          tabBarIcon: ({ color }) => (
            <Icon symbol="cup.and.saucer.fill" material="coffee" color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="pedidos"
        options={{
          title: 'Pedidos',
          tabBarIcon: ({ color }) => (
            <Icon symbol="list.bullet.rectangle" material="receipt_long" color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="catalogo"
        options={{
          title: 'Catálogo',
          tabBarIcon: ({ color }) => (
            <Icon symbol="square.grid.2x2.fill" material="grid_view" color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="inventario"
        options={{
          title: 'Insumos',
          tabBarIcon: ({ color }) => (
            <Icon symbol="shippingbox.fill" material="inventory_2" color={color} size={24} />
          ),
        }}
      />
    </Tabs>
  );
}
