export function AppBrand({ children }: { children: string }) {
  return (
    <div style={{ fontSize: 12, color: 'var(--text)', letterSpacing: 0.5, marginBottom: 4 }}>{children}</div>
  );
}
