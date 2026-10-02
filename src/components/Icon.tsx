import { SymbolView } from 'expo-symbols';
import type { SymbolViewProps } from 'expo-symbols';
import { View, type ColorValue } from 'react-native';

import { useTheme } from '@/theme';

type Name = SymbolViewProps['name'];

export interface IconProps {
  symbol: Name;
  material: string;
  size?: number;
  color?: ColorValue;
}

/** Renderiza SF Symbols en iOS y Material Symbols en Android/web. */
export function Icon({ symbol, material, size = 22, color }: IconProps) {
  const theme = useTheme();
  return (
    <View style={{ width: size, height: size }}>
      <SymbolView
        name={{ ios: symbol, android: material, web: material } as Name}
        size={size}
        tintColor={color ?? theme.text}
        resizeMode="scaleAspectFit"
      />
    </View>
  );
}
