import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Icon } from '@/components/Icon';
import { QtyStepper } from '@/components/QtyStepper';
import { Button, Card, EmptyState, SectionTitle, Segmented } from '@/components/ui';
import { listProducts } from '@/db/products';
import { createOrder } from '@/db/orders';
import { useDatabase } from '@/db';
import type { Product } from '@/db/types';
import { useQuery } from '@/hooks/useQuery';
import {
  CATEGORIES,
  CATEGORY_LABELS,
  ORDER_TYPE_LABELS,
  PREP_NOTE_PRESETS,
  type OrderType,
} from '@/lib/constants';
import { formatMoney } from '@/lib/format';
import { cartTotals, toNewOrder, useCart } from '@/store/cart';
import { radius, spacing, useTheme } from '@/theme';

export default function NuevoPedidoScreen() {
  const theme = useTheme();
  const db = useDatabase();
  const cart = useCart();
  const { data: products } = useQuery('products', listProducts);
  const [view, setView] = useState<'pick' | 'cart'>('pick');
  const [search, setSearch] = useState('');
  const [openNotes, setOpenNotes] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { totalCents, count } = cartTotals(cart.lines);

  const sections = CATEGORIES.map((category) => ({
    category,
    title: CATEGORY_LABELS[category],
    data: (products ?? []).filter(
      (product) =>
        product.category === category &&
        product.name.toLowerCase().includes(search.trim().toLowerCase()),
    ),
  })).filter((section) => section.data.length > 0);

  const confirm = () => {
    if (cart.lines.length === 0 || saving) return;
    setSaving(true);
    void (async () => {
      try {
        await createOrder(db, toNewOrder(cart));
        cart.clear();
        router.back();
      } finally {
        setSaving(false);
      }
    })();
  };

  const meta = (
    <View style={styles.meta}>
      <Segmented<OrderType>
        options={[
          { value: 'takeaway', label: ORDER_TYPE_LABELS.takeaway },
          { value: 'dine_in', label: ORDER_TYPE_LABELS.dine_in },
        ]}
        value={cart.type}
        onChange={cart.setType}
      />
      <View style={styles.metaRow}>
        <TextInput
          value={cart.tableNo}
          onChangeText={cart.setTableNo}
          placeholder="Mesa"
          placeholderTextColor={theme.textMuted}
          keyboardType="number-pad"
          style={[
            styles.input,
            { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface },
            cart.type === 'takeaway' && styles.inputDim,
          ]}
        />
        <TextInput
          value={cart.customerName}
          onChangeText={cart.setCustomerName}
          placeholder="Cliente (opcional)"
          placeholderTextColor={theme.textMuted}
          style={[
            styles.input,
            { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface },
          ]}
        />
      </View>
    </View>
  );

  if (view === 'cart') {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.bg }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <View style={[styles.body, { backgroundColor: theme.bg }]}>
          {cart.lines.length === 0 ? (
            <EmptyState title="Pedido vacío" subtitle="Agregá productos desde la pantalla anterior." />
          ) : (
            <View style={styles.cartList}>
              {cart.lines.map((line) => (
                <Card key={line.key} style={styles.lineCard}>
                  <View style={styles.lineHeader}>
                    <View style={styles.lineTitle}>
                      <Text style={[styles.lineName, { color: theme.text }]}>
                        {line.productName}
                      </Text>
                      <Text style={[styles.linePrice, { color: theme.textMuted }]}>
                        {formatMoney(line.unitPriceCents)} c/u
                      </Text>
                    </View>
                    <View style={styles.lineActions}>
                      <QtyStepper
                        qty={line.qty}
                        compact
                        onChange={(qty) => cart.setQty(line.key, qty)}
                      />
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Quitar"
                        onPress={() => cart.removeLine(line.key)}
                        hitSlop={8}
                      >
                        <Icon
                          symbol="trash"
                          material="delete_outline"
                          size={20}
                          color={theme.danger}
                        />
                      </Pressable>
                    </View>
                  </View>

                  <Pressable
                    onPress={() => setOpenNotes(openNotes === line.key ? null : line.key)}
                    style={styles.notesToggle}
                  >
                    <Icon
                      symbol="text.bubble"
                      material="sticky_note_2"
                      size={15}
                      color={theme.accent}
                    />
                    <Text
                      style={[
                        styles.notesToggleText,
                        { color: line.notes ? theme.accent : theme.textMuted },
                      ]}
                      numberOfLines={1}
                    >
                      {line.notes ?? 'Agregar nota de preparación'}
                    </Text>
                  </Pressable>

                  {openNotes === line.key ? (
                    <View style={styles.notesPanel}>
                      <View style={styles.presetRow}>
                        {PREP_NOTE_PRESETS.map((preset) => {
                          const active = line.notes === preset;
                          return (
                            <Pressable
                              key={preset}
                              onPress={() =>
                                cart.setLineNotes(line.key, active ? null : preset)
                              }
                              style={[
                                styles.preset,
                                {
                                  backgroundColor: active ? `${theme.accent}22` : theme.surfaceAlt,
                                  borderColor: active ? theme.accent : theme.border,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.presetLabel,
                                  { color: active ? theme.accent : theme.textMuted },
                                ]}
                              >
                                {preset}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                      <TextInput
                        value={line.notes ?? ''}
                        onChangeText={(text) => cart.setLineNotes(line.key, text)}
                        placeholder="Ej: sin azúcar, leche de avena, tibio"
                        placeholderTextColor={theme.textMuted}
                        style={[
                          styles.input,
                          { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface },
                        ]}
                      />
                    </View>
                  ) : null}
                </Card>
              ))}

              <View style={styles.orderNotes}>
                <SectionTitle>Nota del pedido</SectionTitle>
                <TextInput
                  value={cart.notes}
                  onChangeText={cart.setNotes}
                  placeholder="Ej: el cliente espera en la barra"
                  placeholderTextColor={theme.textMuted}
                  multiline
                  style={[
                    styles.input,
                    styles.inputMultiline,
                    { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface },
                  ]}
                />
              </View>
            </View>
          )}
        </View>

        <View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.surface }]}>
          <View>
            <Text style={[styles.totalLabel, { color: theme.textMuted }]}>
              {count} {count === 1 ? 'ítem' : 'ítems'}
            </Text>
            <Text style={[styles.totalValue, { color: theme.text }]}>{formatMoney(totalCents)}</Text>
          </View>
          <View style={styles.footerButtons}>
            <Button label="Seguir agregando" variant="secondary" onPress={() => setView('pick')} />
            <Button
              label="Confirmar"
              flex
              disabled={cart.lines.length === 0 || saving}
              onPress={confirm}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {meta}
      <View style={styles.searchWrap}>
        <Icon symbol="magnifyingglass" material="search" size={17} color={theme.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar producto"
          placeholderTextColor={theme.textMuted}
          style={[styles.search, { color: theme.text }]}
        />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(product) => product.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <EmptyState
            title="Sin productos"
            subtitle="Agregá productos desde la pestaña Catálogo."
          />
        }
        renderSectionHeader={({ section }) => (
          <Text style={[styles.sectionHeader, { color: theme.textMuted }]}>
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => (
          <ProductPickRow
            product={item}
            qty={cart.lines.find((line) => line.key === `${item.id}::`)?.qty ?? 0}
            onAdd={() => cart.addProduct(item)}
            onChangeQty={(qty) => cart.setQty(`${item.id}::`, qty)}
          />
        )}
      />

      <Pressable
        accessibilityRole="button"
        onPress={() => setView('cart')}
        style={({ pressed }) => [
          styles.bar,
          { backgroundColor: theme.surface, borderTopColor: theme.border, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <View style={[styles.badge, { backgroundColor: theme.primary }]}>
          <Text style={[styles.badgeText, { color: theme.onPrimary }]}>{count}</Text>
        </View>
        <Text style={[styles.barLabel, { color: theme.text }]}>Ver pedido</Text>
        <Text style={[styles.barTotal, { color: theme.primary }]}>{formatMoney(totalCents)}</Text>
      </Pressable>
    </View>
  );
}

function ProductPickRow({
  product,
  qty,
  onAdd,
  onChangeQty,
}: {
  product: Product;
  qty: number;
  onAdd: () => void;
  onChangeQty: (qty: number) => void;
}) {
  const theme = useTheme();

  if (!product.available) {
    return (
      <View
        style={[
          styles.pickRow,
          { backgroundColor: theme.surface, borderColor: theme.border, opacity: 0.5 },
        ]}
      >
        <Text style={[styles.pickName, { color: theme.textMuted }]}>{product.name}</Text>
        <Text style={[styles.pickOut, { color: theme.danger }]}>Agotado</Text>
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onAdd}
      style={({ pressed }) => [
        styles.pickRow,
        {
          backgroundColor: theme.surface,
          borderColor: qty > 0 ? theme.primary : theme.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View style={styles.pickInfo}>
        <Text style={[styles.pickName, { color: theme.text }]}>{product.name}</Text>
        <Text style={[styles.pickPrice, { color: theme.textMuted }]}>
          {formatMoney(product.priceCents)}
        </Text>
      </View>
      {qty > 0 ? (
        <QtyStepper qty={qty} compact onChange={onChangeQty} />
      ) : (
        <View style={[styles.addButton, { borderColor: theme.border }]}>
          <Icon symbol="plus" material="add" size={18} color={theme.primary} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1 },
  meta: { padding: spacing.md, gap: spacing.sm },
  metaRow: { flexDirection: 'row', gap: spacing.sm },
  input: {
    flex: 1,
    minHeight: 46,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    fontSize: 15,
  },
  inputDim: { opacity: 0.55 },
  inputMultiline: { minHeight: 72, paddingTop: spacing.md, textAlignVertical: 'top' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  search: { flex: 1, height: 44, fontSize: 15 },
  list: { padding: spacing.md, paddingTop: 0, gap: spacing.sm, paddingBottom: 110 },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 62,
  },
  pickInfo: { flex: 1, gap: 2 },
  pickName: { fontSize: 16, fontWeight: '600' },
  pickPrice: { fontSize: 14 },
  pickOut: { fontSize: 13, fontWeight: '700' },
  addButton: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartList: { padding: spacing.md, gap: spacing.sm },
  lineCard: { gap: spacing.sm, padding: spacing.md },
  lineHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  lineTitle: { flex: 1, gap: 2 },
  lineName: { fontSize: 16, fontWeight: '600' },
  linePrice: { fontSize: 13 },
  lineActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  notesToggle: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  notesToggleText: { fontSize: 13, fontStyle: 'italic', flex: 1 },
  notesPanel: { gap: spacing.sm },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  preset: {
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  presetLabel: { fontSize: 13, fontWeight: '600' },
  orderNotes: { marginTop: spacing.md },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  totalLabel: { fontSize: 12, fontWeight: '600' },
  totalValue: { fontSize: 20, fontWeight: '800' },
  footerButtons: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1, justifyContent: 'flex-end' },
  bar: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.lg,
    height: 58,
  },
  badge: {
    minWidth: 28,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  badgeText: { fontSize: 14, fontWeight: '800' },
  barLabel: { flex: 1, fontSize: 16, fontWeight: '700' },
  barTotal: { fontSize: 16, fontWeight: '800' },
});
