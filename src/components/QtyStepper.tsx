import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing, useTheme } from '@/theme';

interface QtyStepperProps {
  qty: number;
  onChange: (qty: number) => void;
  step?: number;
  compact?: boolean;
}

export function QtyStepper({ qty, onChange, step = 1, compact }: QtyStepperProps) {
  const theme = useTheme();
  const size = compact ? 30 : 38;

  return (
    <View style={[styles.container, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Restar"
        disabled={qty <= 0}
        onPress={() => onChange(qty - step)}
        style={({ pressed }) => [
          styles.button,
          { width: size, height: size, opacity: qty <= 0 ? 0.35 : pressed ? 0.6 : 1 },
        ]}
      >
        <Text style={[styles.symbol, { color: theme.text, fontSize: compact ? 18 : 22 }]}>−</Text>
      </Pressable>

      <Text
        style={[
          styles.value,
          { color: theme.text, fontSize: compact ? 15 : 17 },
          compact && styles.valueCompact,
        ]}
      >
        {qty}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sumar"
        onPress={() => onChange(qty + step)}
        style={({ pressed }) => [
          styles.button,
          { width: size, height: size, opacity: pressed ? 0.6 : 1 },
        ]}
      >
        <Text style={[styles.symbol, { color: theme.text, fontSize: compact ? 18 : 22 }]}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  button: { alignItems: 'center', justifyContent: 'center' },
  symbol: { fontWeight: '700', lineHeight: 24 },
  value: { minWidth: 34, textAlign: 'center', fontWeight: '700' },
  valueCompact: { minWidth: 28, paddingHorizontal: spacing.xs },
});
