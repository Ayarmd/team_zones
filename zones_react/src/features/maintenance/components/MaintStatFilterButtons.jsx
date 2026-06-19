const LABELS = {
  faults: { all: "الكل", pending: "قيد المعالجة", resolved: "تمت المعالجة" },
  devices: { all: "الكل", pending: "صيانة", resolved: "معالج" },
};

export default function MaintStatFilterButtons({
  total,
  pending,
  resolved,
  activeFilter,
  onFilter,
  variant = "faults",
}) {
  const labels = LABELS[variant] || LABELS.faults;

  const setFilter = (key) => {
    onFilter(activeFilter === key ? "all" : key);
  };

  return (
    <div className="maint-stat-cards maint-stat-cards--inline">
      <button
        type="button"
        className={`maint-stat-card maint-stat-card--all ${activeFilter === "all" ? "is-active" : ""}`}
        onClick={() => onFilter("all")}
      >
        <span className="maint-stat-card__value">{total}</span>
        <span className="maint-stat-card__label">{labels.all}</span>
      </button>
      <button
        type="button"
        className={`maint-stat-card maint-stat-card--pending ${activeFilter === "pending" ? "is-active" : ""}`}
        onClick={() => setFilter("pending")}
      >
        <span className="maint-stat-card__value">{pending}</span>
        <span className="maint-stat-card__label">{labels.pending}</span>
      </button>
      <button
        type="button"
        className={`maint-stat-card maint-stat-card--resolved ${activeFilter === "resolved" ? "is-active" : ""}`}
        onClick={() => setFilter("resolved")}
      >
        <span className="maint-stat-card__value">{resolved}</span>
        <span className="maint-stat-card__label">{labels.resolved}</span>
      </button>
    </div>
  );
}
