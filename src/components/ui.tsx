import { type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { radius, spacing, useTheme } from '@/theme';

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
        style,
      ]}
    >
      {children}
    </View>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  flex?: boolean;
  compact?: boolean;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  flex = false,
  compact = false,
}: ButtonProps) {
  const theme = useTheme();

  const palette: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
    primary: { bg: theme.primary, fg: theme.onPrimary, border: theme.primary },
    secondary: { bg: theme.surfaceAlt, fg: theme.text, border: theme.border },
    ghost: { bg: 'transparent', fg: theme.textMuted, border: 'transparent' },
    danger: { bg: theme.danger, fg: '#FFFFFF', border: theme.danger },
  };
  const tone = palette[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        {
          backgroundColor: tone.bg,
          borderColor: tone.border,
          opacity: disabled ? 0.4 : pressed ? 0.75 : 1,
          flex: flex ? 1 : undefined,
        },
      ]}
    >
      <Text style={[styles.buttonLabel, compact && styles.buttonLabelCompact, { color: tone.fg }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.segment, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.value)}
            style={[
              styles.segmentItem,
              active && { backgroundColor: theme.surface, borderColor: theme.primary },
            ]}
          >
            <Text
              numberOfLines={1}
              style={[styles.segmentLabel, { color: active ? theme.text : theme.textMuted }]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.empty}>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{children}</Text>
  );
}

export function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: `${color}22` }]}>
      <Text style={[styles.badgeLabel, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
  },
  button: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  buttonCompact: { minHeight: 38, paddingHorizontal: spacing.md },
  buttonLabel: { fontSize: 16, fontWeight: '600' },
  buttonLabelCompact: { fontSize: 14 },
  segment: {
    flexDirection: 'row',
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 3,
    gap: 3,
  },
  segmentItem: {
    flex: 1,
    minHeight: 40,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  segmentLabel: { fontSize: 14, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.xs },
  emptyTitle: { fontSize: 17, fontWeight: '600' },
  emptySubtitle: { fontSize: 14, textAlign: 'center' },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  badge: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  badgeLabel: { fontSize: 11, fontWeight: '700' },
});
