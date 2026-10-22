interface StatsBarProps {
  stats: {
    total: number;
    freelance: number;
    fullTime: number;
    contract: number;
    remote: number;
    bookmarked: number;
    applied: number;
    lastUpdated: string | null;
  };
  loading: boolean;
  onRefresh: () => void;
}

export default function StatsBar({ stats, loading, onRefresh }: StatsBarProps) {
  const cells = [
    { label: 'Listed', value: stats.total },
    { label: 'Freelance', value: stats.freelance },
    { label: 'Full-time', value: stats.fullTime },
    { label: 'Contract', value: stats.contract },
    { label: 'Remote', value: stats.remote },
    { label: 'Applied', value: stats.applied },
  ];

  return (
    <section>
      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          <p className="kicker">Today&apos;s index</p>
          <h2 className="display text-4xl mt-1">Listings</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            {stats.lastUpdated
              ? `Pulled ${new Date(stats.lastUpdated).toLocaleTimeString()}`
              : 'Pulling public job feeds…'}
          </p>
        </div>
        <button onClick={onRefresh} disabled={loading} className="btn-primary">
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loading ? 'Pulling' : 'Refresh'}
        </button>
      </div>
      <div className="stat-strip">
        {cells.map(cell => (
          <div key={cell.label} className="stat-cell">
            <span className="kicker">{cell.label}</span>
            <strong>{loading ? '—' : cell.value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
