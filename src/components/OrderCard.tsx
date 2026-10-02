import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Badge, Button, Card } from '@/components/ui';
import { LATE_THRESHOLD_MINUTES, ORDER_TYPE_LABELS, NEXT_STATUS_ACTION } from '@/lib/constants';
import { elapsedLabel, formatTime } from '@/lib/date';
import { formatMoney } from '@/lib/format';
import { radius, spacing, statusColor, useTheme } from '@/theme';
import type { Order } from '@/db/types';

interface OrderCardProps {
  order: Order;
  now: number;
  onAdvance?: (order: Order) => void;
  onCancel?: (order: Order) => void;
  compact?: boolean;
}

export function OrderCard({ order, now, onAdvance, onCancel, compact }: OrderCardProps) {
  const theme = useTheme();
  const color = statusColor(theme, order.status);
  const elapsedMin = Math.floor((now - order.createdAt) / 60000);
  const late = elapsedMin >= LATE_THRESHOLD_MINUTES;
  const nextAction = NEXT_STATUS_ACTION[order.status];

  return (
    <Card style={[styles.card, { borderLeftWidth: 4, borderLeftColor: color }]}>
      <View style={styles.header}>
        <Text style={[styles.code, { color: theme.text }]}>#{order.code}</Text>
        <View style={styles.headerRight}>
          {late ? <Badge label="DEMORA" color={theme.danger} /> : null}
          <Text style={[styles.time, { color: late ? theme.danger : theme.textMuted }]}>
            {formatTime(order.createdAt)} · {elapsedLabel(order.createdAt, now)}
          </Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Badge
          label={order.type === 'dine_in' ? (order.tableNo ? `Mesa ${order.tableNo}` : 'En el local') : ORDER_TYPE_LABELS.takeaway}
          color={theme.accent}
        />
        {order.customerName ? (
          <Text style={[styles.customer, { color: theme.textMuted }]} numberOfLines={1}>
            {order.customerName}
          </Text>
        ) : null}
      </View>

      <View style={styles.items}>
        {order.items.map((line) => (
          <View key={line.id} style={styles.itemRow}>
            <Text style={[styles.qty, { color }]}>{line.qty}x</Text>
            <View style={styles.itemBody}>
              <Text style={[styles.itemName, { color: theme.text }]}>{line.productName}</Text>
              {line.notes ? (
                <Text style={[styles.itemNotes, { color: theme.accent }]} numberOfLines={2}>
                  {line.notes}
                </Text>
              ) : null}
            </View>
            {!compact ? (
              <Text style={[styles.itemPrice, { color: theme.textMuted }]}>
                {formatMoney(line.lineTotalCents)}
              </Text>
            ) : null}
          </View>
        ))}
      </View>

      {order.notes ? (
        <View style={[styles.orderNote, { backgroundColor: theme.surfaceAlt }]}>
          <Icon symbol="text.bubble.fill" material="chat" size={14} color={theme.textMuted} />
          <Text style={[styles.orderNoteText, { color: theme.textMuted }]}>{order.notes}</Text>
        </View>
      ) : null}

      <View style={styles.footer}>
        <Text style={[styles.total, { color: theme.text }]}>{formatMoney(order.totalCents)}</Text>
        {onAdvance || onCancel ? (
          <View style={styles.actions}>
            {onCancel ? (
              <Button label="Cancelar" variant="ghost" compact onPress={() => onCancel(order)} />
            ) : null}
            {onAdvance && nextAction ? (
              <Button label={nextAction} compact onPress={() => onAdvance(order)} />
            ) : null}
          </View>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  code: { fontSize: 20, fontWeight: '800' },
  time: { fontSize: 13, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  customer: { fontSize: 13, flexShrink: 1 },
  items: { gap: spacing.xs, marginTop: spacing.xs },
  itemRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  qty: { fontSize: 14, fontWeight: '800', minWidth: 26 },
  itemBody: { flex: 1, gap: 2 },
  itemName: { fontSize: 15, fontWeight: '600' },
  itemNotes: { fontSize: 13, fontStyle: 'italic' },
  itemPrice: { fontSize: 13 },
  orderNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  orderNoteText: { fontSize: 13, flex: 1 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  total: { fontSize: 16, fontWeight: '700' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
