import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { OrderCard } from '@/components/OrderCard';
import { Badge, Card, EmptyState } from '@/components/ui';
import { cancelOrder, getDaySummary, listOrdersForDay } from '@/db/orders';
import { useDatabase } from '@/db';
import type { Order } from '@/db/types';
import { useNow } from '@/hooks/useNow';
import { useQuery } from '@/hooks/useQuery';
import { addDays, dayKey, formatDayLabel } from '@/lib/date';
import { formatMoney } from '@/lib/format';
import { radius, spacing, useTheme } from '@/theme';

export default function PedidosScreen() {
  const theme = useTheme();
  const db = useDatabase();
  const now = useNow(30_000);
  const [day, setDay] = useState(() => dayKey());

  const { data: orderList, loading, reload: reloadOrders } = useQuery(
    `orders:${day}`,
    (database) => listOrdersForDay(database, day),
  );
  const { data: stats, reload: reloadSummary } = useQuery(`summary:${day}`, (database) =>
    getDaySummary(database, day),
  );

  useFocusEffect(
    useCallback(() => {
      void reloadOrders();
      void reloadSummary();
    }, [reloadOrders, reloadSummary]),
  );

  const confirmCancel = (order: Order) => {
    Alert.alert(`Cancelar pedido #${order.code}?`, 'Se devuelve el stock si estaba en preparación.', [
      { text: 'Volver', style: 'cancel' },
      {
        text: 'Cancelar pedido',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await cancelOrder(db, order.id);
            await reloadOrders();
            await reloadSummary();
          })();
        },
      },
    ]);
  };

  const today = dayKey();

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.dayBar}>
        <Pressable
          accessibilityLabel="Día anterior"
          onPress={() => setDay(addDays(day, -1))}
          style={[styles.dayButton, { borderColor: theme.border, backgroundColor: theme.surface }]}
        >
          <Icon symbol="chevron.left" material="chevron_left" size={18} color={theme.text} />
        </Pressable>

        <View style={styles.dayLabel}>
          <Text style={[styles.dayText, { color: theme.text }]}>{formatDayLabel(day)}</Text>
          {day !== today ? (
            <Pressable onPress={() => setDay(today)}>
              <Text style={[styles.dayBack, { color: theme.primary }]}>Ir a hoy</Text>
            </Pressable>
          ) : null}
        </View>

        <Pressable
          accessibilityLabel="Día siguiente"
          disabled={day >= today}
          onPress={() => setDay(addDays(day, 1))}
          style={[
            styles.dayButton,
            {
              borderColor: theme.border,
              backgroundColor: theme.surface,
              opacity: day >= today ? 0.35 : 1,
            },
          ]}
        >
          <Icon symbol="chevron.right" material="chevron_right" size={18} color={theme.text} />
        </Pressable>
      </View>

      {stats ? (
        <Card style={styles.summary}>
          <View style={styles.summaryMain}>
            <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Venta del día</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>
              {formatMoney(stats.totalCents)}
            </Text>
          </View>
          <View style={styles.summaryBadges}>
            <Badge label={`${stats.orderCount} pedidos`} color={theme.accent} />
            <Badge label={`${stats.takeawayCount} llevan`} color={theme.preparing} />
            <Badge label={`${stats.dineInCount} local`} color={theme.ready} />
          </View>
        </Card>
      ) : null}

      <FlatList
        data={orderList ?? []}
        keyExtractor={(order) => order.id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={reloadOrders}
        ListEmptyComponent={
          <EmptyState
            title={loading ? 'Cargando…' : 'Sin pedidos'}
            subtitle="No se registraron pedidos en este día."
          />
        }
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            now={now}
            compact
            onCancel={item.status === 'completed' ? undefined : confirmCancel}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  dayBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabel: { flex: 1, alignItems: 'center', gap: 2 },
  dayText: { fontSize: 17, fontWeight: '800' },
  dayBack: { fontSize: 12, fontWeight: '700' },
  summary: { marginHorizontal: spacing.md, marginBottom: spacing.sm, gap: spacing.sm },
  summaryMain: { gap: 2 },
  summaryLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  summaryValue: { fontSize: 28, fontWeight: '800' },
  summaryBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  list: { padding: spacing.md, paddingTop: 0, gap: spacing.md, paddingBottom: spacing.xl },
});
