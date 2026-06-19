export default function StatCard({ title, value, note }) {
  return (
    <article className="neon-card stat-card">
      <p className="muted">{title}</p>
      <h3>{value}</h3>
      <span className="muted">{note}</span>
    </article>
  );
}
