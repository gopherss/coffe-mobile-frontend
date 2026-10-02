import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Button, Card, SectionTitle, Segmented } from '@/components/ui';
import {
  createInventoryItem,
  listInventoryItems,
  updateInventoryItem,
} from '@/db/inventory';
import { useDatabase } from '@/db';
import type { InventoryItem } from '@/db/types';
import { UNITS, type Unit } from '@/lib/constants';
import { formatQty } from '@/lib/format';
import { radius, spacing, useTheme } from '@/theme';

const UNIT_LABELS: Record<Unit, string> = {
  g: 'Gramos',
  ml: 'Mililitros',
  uds: 'Unidades',
};

function parseQty(input: string): number {
  const value = Number.parseFloat(input.replace(',', '.'));
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export default function InsumoScreen() {
  const theme = useTheme();
  const db = useDatabase();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [name, setName] = useState('');
  const [unit, setUnit] = useState<Unit>('g');
  const [qtyOnHand, setQtyOnHand] = useState('');
  const [qtyMin, setQtyMin] = useState('');
  const [siblings, setSiblings] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      const items = await listInventoryItems(db);
      const current = items.find((item) => item.id === id) ?? null;
      if (!active) return;
      setSiblings(items);
      if (current) {
        setName(current.name);
        setUnit(current.unit);
        setQtyOnHand(String(current.qtyOnHand).replace('.', ','));
        setQtyMin(String(current.qtyMin).replace('.', ','));
      }
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
        unit,
        qtyOnHand: parseQty(qtyOnHand),
        qtyMin: parseQty(qtyMin),
      };
      if (id) {
        await updateInventoryItem(db, id, input);
      } else {
        await createInventoryItem(db, input);
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
            placeholder="Ej: Leche de avena"
            placeholderTextColor={theme.textMuted}
            autoFocus={!id}
            style={[
              styles.input,
              { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface },
            ]}
          />
        </View>

        <View style={styles.field}>
          <SectionTitle>Unidad</SectionTitle>
          <Segmented<Unit>
            options={UNITS.map((value) => ({ value, label: UNIT_LABELS[value] }))}
            value={unit}
            onChange={setUnit}
          />
        </View>

        <View style={styles.rowFields}>
          <View style={styles.field}>
            <SectionTitle>Stock actual ({unit})</SectionTitle>
            <TextInput
              value={qtyOnHand}
              onChangeText={setQtyOnHand}
              placeholder="0"
              placeholderTextColor={theme.textMuted}
              keyboardType="decimal-pad"
              style={[
                styles.input,
                { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface },
              ]}
            />
          </View>

          <View style={styles.field}>
            <SectionTitle>Stock mínimo ({unit})</SectionTitle>
            <TextInput
              value={qtyMin}
              onChangeText={setQtyMin}
              placeholder="0"
              placeholderTextColor={theme.textMuted}
              keyboardType="decimal-pad"
              style={[
                styles.input,
                { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface },
              ]}
            />
          </View>
        </View>

        {siblings.length > 0 ? (
          <View style={styles.field}>
            <SectionTitle>Insumos cargados</SectionTitle>
            <Card style={styles.siblingCard}>
              {siblings.map((item) => (
                <View key={item.id} style={styles.siblingRow}>
                  <Text style={[styles.siblingName, { color: theme.text }]}>{item.name}</Text>
                  <Text style={[styles.siblingQty, { color: theme.textMuted }]}>
                    {formatQty(item.qtyOnHand)} {item.unit}
                  </Text>
                </View>
              ))}
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
  field: { flex: 1, gap: spacing.xs },
  rowFields: { flexDirection: 'row', gap: spacing.md },
  input: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },
  siblingCard: { padding: spacing.md, gap: spacing.sm },
  siblingRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  siblingName: { fontSize: 15, flex: 1 },
  siblingQty: { fontSize: 14 },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
