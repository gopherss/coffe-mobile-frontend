import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { QtyStepper } from '@/components/QtyStepper';
import { Button, Card, SectionTitle, Segmented } from '@/components/ui';
import { useDatabase } from '@/db';
import { getRecipe, listInventoryItems, setRecipePart } from '@/db/inventory';
import { createProduct, getProduct, updateProduct } from '@/db/products';
import type { InventoryItem } from '@/db/types';
import { CATEGORIES, CATEGORY_LABELS, type Category } from '@/lib/constants';
import { formatMoney, formatQty, parseMoneyToCents } from '@/lib/format';
import { radius, spacing, useTheme } from '@/theme';

export default function ProductoScreen() {
  const theme = useTheme();
  const db = useDatabase();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<Category>('cafe');
  const [available, setAvailable] = useState(true);
  const [insumos, setInsumos] = useState<InventoryItem[]>([]);
  const [recipe, setRecipe] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const items = await listInventoryItems(db);
      if (!active) return;
      setInsumos(items);

      if (!id) {
        setLoading(false);
        return;
      }
      const product = await getProduct(db, id);
      if (!active) return;
      if (product) {
        setName(product.name);
        setPrice((product.priceCents / 100).toFixed(2).replace('.', ','));
        setCategory(product.category);
        setAvailable(product.available);
      }
      const parts = await getRecipe(db, id);
      if (!active) return;
      setRecipe(Object.fromEntries(parts.map((part) => [part.itemId, part.qty])));
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [db, id]);

  const save = () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    void (async () => {
      const input = {
        name,
        category,
        priceCents: parseMoneyToCents(price),
        available,
      };
      if (id) {
        await updateProduct(db, id, input);
      } else {
        await createProduct(db, input);
      }
      setSaving(false);
      router.back();
    })();
  };

  if (loading) {
    return <View style={[styles.container, { backgroundColor: theme.bg }]} />;
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.field}>
          <SectionTitle>Nombre</SectionTitle>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Ej: Latte"
            placeholderTextColor={theme.textMuted}
            autoFocus={!id}
            style={[
              styles.input,
              { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface },
            ]}
          />
        </View>

        <View style={styles.field}>
          <SectionTitle>Precio</SectionTitle>
          <TextInput
            value={price}
            onChangeText={setPrice}
            placeholder="0,00"
            placeholderTextColor={theme.textMuted}
            keyboardType="decimal-pad"
            style={[
              styles.input,
              { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface },
            ]}
          />
          <Text style={[styles.hint, { color: theme.textMuted }]}>
            {formatMoney(parseMoneyToCents(price))}
          </Text>
        </View>

        <View style={styles.field}>
          <SectionTitle>Categoría</SectionTitle>
          <Segmented<Category>
            options={CATEGORIES.map((value) => ({ value, label: CATEGORY_LABELS[value] }))}
            value={category}
            onChange={setCategory}
          />
        </View>

        <View style={[styles.field, styles.switchRow]}>
          <SectionTitle>Disponible</SectionTitle>
          <Switch
            value={available}
            onValueChange={setAvailable}
            trackColor={{ true: theme.success, false: theme.border }}
          />
        </View>

        {id ? (
          <View style={styles.field}>
            <SectionTitle>Receta (consumo por unidad)</SectionTitle>
            <Text style={[styles.hint, { color: theme.textMuted }]}>
              Se descuenta del inventario al pasar el pedido a preparación.
            </Text>
            <Card style={styles.recipeCard}>
              {insumos.length === 0 ? (
                <Text style={[styles.hint, { color: theme.textMuted }]}>
                  Todavía no hay insumos cargados.
                </Text>
              ) : (
                insumos.map((item) => (
                  <View key={item.id} style={styles.recipeRow}>
                    <View style={styles.recipeInfo}>
                      <Text style={[styles.recipeName, { color: theme.text }]}>{item.name}</Text>
                      <Text style={[styles.hint, { color: theme.textMuted }]}>
                        {formatQty(recipe[item.id] ?? 0)} {item.unit} · stock{' '}
                        {formatQty(item.qtyOnHand)} {item.unit}
                      </Text>
                    </View>
                    <QtyStepper
                      qty={recipe[item.id] ?? 0}
                      compact
                      step={item.unit === 'uds' ? 1 : 5}
                      onChange={(qty) => {
                        setRecipe((prev) => ({ ...prev, [item.id]: qty }));
                        void setRecipePart(db, id, item.id, qty);
                      }}
                    />
                  </View>
                ))
              )}
            </Card>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.surface }]}>
        <Button label="Cancelar" variant="secondary" onPress={() => router.back()} />
        <Button label="Guardar" flex disabled={!name.trim() || saving} onPress={save} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.lg, paddingBottom: spacing.xxl },
  field: { gap: spacing.xs },
  input: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },
  hint: { fontSize: 12 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  recipeCard: { padding: spacing.md, gap: spacing.md },
  recipeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  recipeInfo: { flex: 1, gap: 2 },
  recipeName: { fontSize: 15, fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
