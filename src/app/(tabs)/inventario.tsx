import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { QtyStepper } from '@/components/QtyStepper';
import { Badge, EmptyState } from '@/components/ui';
import { adjustStock, deleteInventoryItem, listInventoryItems } from '@/db/inventory';
import { useDatabase } from '@/db';
import type { InventoryItem } from '@/db/types';
import { useQuery } from '@/hooks/useQuery';
import { formatQty } from '@/lib/format';
import { radius, spacing, useTheme } from '@/theme';

export default function InventarioScreen() {
  const theme = useTheme();
  const db = useDatabase();
  const { data, loading, reload } = useQuery('inventory', listInventoryItems);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const items = data ?? [];
  const lowCount = items.filter((item) => item.qtyOnHand <= item.qtyMin).length;

  const confirmDelete = (item: InventoryItem) => {
    Alert.alert(`Eliminar ${item.name}?`, 'También se quita de las recetas.', [
      { text: 'Volver', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await deleteInventoryItem(db, item.id);
            await reload();
          })();
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {lowCount > 0 ? (
        <View style={[styles.banner, { backgroundColor: `${theme.danger}1A` }]}>
          <Icon symbol="exclamationmark.triangle.fill" material="warning" size={16} color={theme.danger} />
          <Text style={[styles.bannerText, { color: theme.danger }]}>
            {lowCount} {lowCount === 1 ? 'insumo está' : 'insumos están'} en stock bajo
          </Text>
        </View>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={reload}
        ListEmptyComponent={
          <EmptyState
            title={loading ? 'Cargando…' : 'Sin insumos'}
            subtitle="Cargá los insumos para controlar el stock y las recetas."
          />
        }
        renderItem={({ item }) => {
          const low = item.qtyOnHand <= item.qtyMin;
          const step = item.unit === 'uds' ? 1 : 50;
          return (
            <View
              style={[
                styles.row,
                {
                  backgroundColor: theme.surface,
                  borderColor: low ? theme.danger : theme.border,
                },
              ]}
            >
              <Pressable
                style={styles.rowMain}
                onPress={() => router.push({ pathname: '/insumo', params: { id: item.id } })}
              >
                <View style={styles.rowInfo}>
                  <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={styles.rowMeta}>
                    <Text style={[styles.qty, { color: low ? theme.danger : theme.text }]}>
                      {formatQty(item.qtyOnHand)} {item.unit}
                    </Text>
                    <Text style={[styles.min, { color: theme.textMuted }]}>
                      mín {formatQty(item.qtyMin)}
                    </Text>
                    {low ? <Badge label="STOCK BAJO" color={theme.danger} /> : null}
                  </View>
                </View>
                <Icon symbol="chevron.right" material="chevron_right" size={16} color={theme.textMuted} />
              </Pressable>

              <QtyStepper
                qty={item.qtyOnHand}
                compact
                step={step}
                onChange={(qty) => {
                  const next = Math.max(0, qty);
                  const delta = next - item.qtyOnHand;
                  if (delta === 0) return;
                  void (async () => {
                    await adjustStock(db, item.id, delta);
                    await reload();
                  })();
                }}
              />

              <Pressable
                accessibilityLabel={`Eliminar ${item.name}`}
                onPress={() => confirmDelete(item)}
                hitSlop={8}
              >
                <Icon symbol="trash" material="delete_outline" size={20} color={theme.textMuted} />
              </Pressable>
            </View>
          );
        }}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Nuevo insumo"
        onPress={() => router.push('/insumo')}
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
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    margin: spacing.md,
    marginBottom: 0,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  bannerText: { fontSize: 13, fontWeight: '700' },
  list: { padding: spacing.md, paddingBottom: 120 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowInfo: { flex: 1, gap: spacing.xs },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  name: { fontSize: 16, fontWeight: '600' },
  qty: { fontSize: 14, fontWeight: '700' },
  min: { fontSize: 12 },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    width: 58,
    height: 58,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
