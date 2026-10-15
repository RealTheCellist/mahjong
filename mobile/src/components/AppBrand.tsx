import { Text } from 'react-native';
import { useTheme } from '../theme';

export function AppBrand({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text style={{ fontSize: 12, color: theme.accent, letterSpacing: 0.5, marginBottom: 4, fontWeight: '700' }}>
      {children}
    </Text>
  );
}
