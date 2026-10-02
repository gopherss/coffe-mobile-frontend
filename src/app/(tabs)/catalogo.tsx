import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Alert, Pressable, SectionList, StyleSheet, Switch, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { EmptyState } from '@/components/ui';
import { deleteProduct, listProducts, setProductAvailability } from '@/db/products';
import { useDatabase } from '@/db';
import type { Product } from '@/db/types';
import { useQuery } from '@/hooks/useQuery';
import { CATEGORIES, CATEGORY_LABELS } from '@/lib/constants';
import { formatMoney } from '@/lib/format';
import { radius, spacing, useTheme } from '@/theme';

export default function CatalogoScreen() {
  const theme = useTheme();
  const db = useDatabase();
  const { data, loading, reload } = useQuery('products', listProducts);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const sections = CATEGORIES.map((category) => ({
    category,
    title: CATEGORY_LABELS[category],
    data: (data ?? []).filter((product) => product.category === category),
  })).filter((section) => section.data.length > 0);

  const confirmDelete = (product: Product) => {
    Alert.alert(`Eliminar ${product.name}?`, 'Los pedidos ya cargados no se ven afectados.', [
      { text: 'Volver', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await deleteProduct(db, product.id);
            await reload();
          })();
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <SectionList
        sections={sections}
        keyExtractor={(product) => product.id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={reload}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <EmptyState
            title={loading ? 'Cargando…' : 'Sin productos'}
            subtitle="Creá tu primer producto con el botón +."
          />
        }
        renderSectionHeader={({ section }) => (
          <Text style={[styles.sectionHeader, { color: theme.textMuted }]}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <View
            style={[
              styles.row,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Pressable
              style={styles.rowMain}
              onPress={() => router.push({ pathname: '/producto', params: { id: item.id } })}
            >
              <View style={styles.rowInfo}>
                <Text
                  style={[styles.name, { color: theme.text }, !item.available && styles.off]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                <Text style={[styles.price, { color: theme.textMuted }]}>
                  {formatMoney(item.priceCents)}
                  {item.available ? '' : ' · Agotado'}
                </Text>
              </View>
              <Icon symbol="chevron.right" material="chevron_right" size={16} color={theme.textMuted} />
            </Pressable>

            <Switch
              value={item.available}
              onValueChange={(value) => {
                void (async () => {
                  await setProductAvailability(db, item.id, value);
                  await reload();
                })();
              }}
              trackColor={{ true: theme.success, false: theme.border }}
            />

            <Pressable
              accessibilityLabel={`Eliminar ${item.name}`}
              onPress={() => confirmDelete(item)}
              hitSlop={8}
            >
              <Icon symbol="trash" material="delete_outline" size={20} color={theme.textMuted} />
            </Pressable>
          </View>
        )}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Nuevo producto"
        onPress={() => router.push('/producto')}
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
  list: { padding: spacing.md, paddingBottom: 120 },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingLeft: spacing.md,
    paddingRight: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowInfo: { flex: 1, gap: 2 },
  name: { fontSize: 16, fontWeight: '600' },
  off: { textDecorationLine: 'line-through' },
  price: { fontSize: 13 },
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
