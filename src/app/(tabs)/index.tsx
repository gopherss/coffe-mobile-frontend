import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { OrderCard } from '@/components/OrderCard';
import { EmptyState } from '@/components/ui';
import {
  cancelOrder,
  completeOrder,
  listActiveOrders,
  nextStatusOf,
  setOrderStatus,
} from '@/db/orders';
import { useDatabase } from '@/db';
import type { Order } from '@/db/types';
import { useNow } from '@/hooks/useNow';
import { useQuery } from '@/hooks/useQuery';
import { formatMoney } from '@/lib/format';
import {
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  type OrderStatus,
  type PaymentMethod,
} from '@/lib/constants';
import { radius, spacing, statusColor, useTheme } from '@/theme';

type Filter = 'all' | 'pending' | 'preparing' | 'ready';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: ORDER_STATUS_LABELS.pending },
  { value: 'preparing', label: ORDER_STATUS_LABELS.preparing },
  { value: 'ready', label: ORDER_STATUS_LABELS.ready },
];

export default function BarraScreen() {
  const theme = useTheme();
  const db = useDatabase();
  const now = useNow();
  const [filter, setFilter] = useState<Filter>('all');
  const { data, loading, error, reload } = useQuery('active-orders', listActiveOrders);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const orders = data ?? [];
  const counts = {
    all: orders.length,
    pending: orders.filter((order) => order.status === 'pending').length,
    preparing: orders.filter((order) => order.status === 'preparing').length,
    ready: orders.filter((order) => order.status === 'ready').length,
  };
  const visible = filter === 'all' ? orders : orders.filter((order) => order.status === filter);

  const deliver = useCallback(
    (order: Order, method: PaymentMethod) => {
      void (async () => {
        await completeOrder(db, order.id, method);
        await reload();
      })();
    },
    [db, reload],
  );

  const handleAdvance = useCallback(
    (order: Order) => {
      const next = nextStatusOf(order);
      if (!next) return;

      if (next === 'completed') {
        Alert.alert(
          `Entregar pedido #${order.code}`,
          `Total ${formatMoney(order.totalCents)}\n\n¿Cómo pagó el cliente?`,
          [
            { text: 'Volver', style: 'cancel' },
            { text: PAYMENT_METHOD_LABELS.cash, onPress: () => deliver(order, 'cash') },
            { text: PAYMENT_METHOD_LABELS.card, onPress: () => deliver(order, 'card') },
          ],
        );
        return;
      }

      void (async () => {
        await setOrderStatus(db, order.id, next);
        await reload();
      })();
    },
    [db, deliver, reload],
  );

  const handleCancel = useCallback(
    (order: Order) => {
      Alert.alert(
        `Cancelar pedido #${order.code}`,
        'Se devuelve el stock si ya estaba en preparación.',
        [
          { text: 'Volver', style: 'cancel' },
          {
            text: 'Cancelar pedido',
            style: 'destructive',
            onPress: () => {
              void (async () => {
                await cancelOrder(db, order.id);
                await reload();
              })();
            },
          },
        ],
      );
    },
    [db, reload],
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.filters}>
        {FILTERS.map((option) => {
          const active = option.value === filter;
          const tone =
            option.value === 'all' ? theme.primary : statusColor(theme, option.value as OrderStatus);
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setFilter(option.value)}
              style={[
                styles.filter,
                {
                  backgroundColor: active ? `${tone}22` : theme.surface,
                  borderColor: active ? tone : theme.border,
                },
              ]}
            >
              <Text style={[styles.filterLabel, { color: active ? tone : theme.textMuted }]}>
                {option.label}
              </Text>
              <Text style={[styles.filterCount, { color: active ? tone : theme.textMuted }]}>
                {counts[option.value]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {error ? (
        <View style={styles.error}>
          <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={visible}
        keyExtractor={(order) => order.id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={reload}
        ListEmptyComponent={
          <EmptyState
            title={loading ? 'Cargando…' : 'No hay pedidos'}
            subtitle={
              filter === 'all'
                ? 'Tocá + para tomar un pedido nuevo.'
                : 'No hay pedidos en este estado.'
            }
          />
        }
        renderItem={({ item }) => (
          <OrderCard order={item} now={now} onAdvance={handleAdvance} onCancel={handleCancel} />
        )}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Nuevo pedido"
        onPress={() => router.push('/nuevo-pedido')}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <Icon symbol="plus" material="add" size={28} color={theme.onPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filters: { flexDirection: 'row', gap: spacing.xs, padding: spacing.md },
  filter: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  filterLabel: { fontSize: 11, fontWeight: '700' },
  filterCount: { fontSize: 16, fontWeight: '800' },
  list: { padding: spacing.md, paddingTop: 0, gap: spacing.md, paddingBottom: 120 },
  error: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  errorText: { fontSize: 13 },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    width: 60,
    height: 60,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
