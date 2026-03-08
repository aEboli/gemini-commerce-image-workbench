export function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <article className="stat-card" style={accent ? { borderColor: accent } : undefined}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
