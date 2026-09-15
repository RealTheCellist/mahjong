import { Text } from 'react-native';

export function AppBrand({ children }: { children: string }) {
  return <Text style={{ fontSize: 12, color: '#8a8168', letterSpacing: 0.5, marginBottom: 4 }}>{children}</Text>;
}
