'use client';

import { JobType, JobSource, FilterState } from '@/types';
import { TechIcon } from '@/components/TechTag';

interface SidebarProps {
  filters: FilterState;
  setFilters: (f: FilterState) => void;
  stats: { total: number; freelance: number; fullTime: number; contract: number; bookmarked: number; applied: number };
  activeTab: string;
  setActiveTab: (tab: string) => void;
  availableTags: { tag: string; count: number }[];
}

const JOB_TYPES: { value: JobType; label: string }[] = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'contract', label: 'Contract' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'internship', label: 'Internship' },
];

const SOURCES: { value: JobSource; label: string }[] = [
  { value: 'remoteok', label: 'Remote OK' },
  { value: 'hackernews', label: 'Hacker News' },
  { value: 'weworkremotely', label: 'We Work Remotely' },
  { value: 'remotive', label: 'Remotive' },
  { value: 'arbeitnow', label: 'Arbeitnow' },
  { value: 'jobicy', label: 'Jobicy' },
];

export default function Sidebar({ filters, setFilters, stats, activeTab, setActiveTab, availableTags }: SidebarProps) {
  const toggleType = (t: JobType) => {
    setFilters({
      ...filters,
      types: filters.types.includes(t)
        ? filters.types.filter(x => x !== t)
        : [...filters.types, t],
    });
  };

  const toggleSource = (s: JobSource) => {
    setFilters({
      ...filters,
      sources: filters.sources.includes(s)
        ? filters.sources.filter(x => x !== s)
        : [...filters.sources, s],
    });
  };

  const toggleTag = (tag: string) => {
    setFilters({
      ...filters,
      tags: filters.tags.includes(tag)
        ? filters.tags.filter(x => x !== tag)
        : [...filters.tags, tag],
    });
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      types: [],
      tags: [],
      remoteOnly: false,
      sources: [],
      sortBy: 'newest',
    });
  };

  const tabs = [
    { id: 'all', label: 'All listings', count: stats.total },
    { id: 'freelance', label: 'Freelance', count: stats.freelance },
    { id: 'fulltime', label: 'Full-time', count: stats.fullTime },
    { id: 'contract', label: 'Contract', count: stats.contract },
    { id: 'pipeline', label: 'Pipeline', count: stats.bookmarked + stats.applied },
    { id: 'bookmarked', label: 'Saved', count: stats.bookmarked },
    { id: 'applied', label: 'Applied', count: stats.applied },
  ];

  const hasActiveFilters = filters.types.length > 0 || filters.tags.length > 0 || filters.remoteOnly || filters.sources.length > 0;

  return (
    <aside className="w-64 shrink-0 lg:h-[calc(100vh-88px)] lg:overflow-y-auto lg:sticky lg:top-[88px] pr-6">
      <div className="space-y-6 pb-10">
        <div>
          <h3 className="kicker mb-2">Sections</h3>
          <nav>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`nav-btn ${activeTab === tab.id ? 'is-on' : ''}`}
              >
                <span>{tab.label}</span>
                <span className="text-xs tabular-nums">{tab.count}</span>
              </button>
            ))}
          </nav>
        </div>

        <div>
          <h3 className="kicker mb-2">Type</h3>
          {JOB_TYPES.map(t => (
            <label key={t.value} className="flex items-center gap-2 py-1.5 text-sm cursor-pointer" style={{ color: 'var(--soft)' }}>
              <input
                type="checkbox"
                checked={filters.types.includes(t.value)}
                onChange={() => toggleType(t.value)}
                className="checkbox-custom"
              />
              {t.label}
            </label>
          ))}
          <label className="flex items-center gap-2 py-1.5 text-sm cursor-pointer" style={{ color: 'var(--soft)' }}>
            <input
              type="checkbox"
              checked={filters.remoteOnly}
              onChange={() => setFilters({ ...filters, remoteOnly: !filters.remoteOnly })}
              className="checkbox-custom"
            />
            Remote only
          </label>
        </div>

        <div>
          <h3 className="kicker mb-2">Feeds</h3>
          {SOURCES.map(s => (
            <label key={s.value} className="flex items-center gap-2 py-1.5 text-sm cursor-pointer" style={{ color: 'var(--soft)' }}>
              <input
                type="checkbox"
                checked={filters.sources.includes(s.value)}
                onChange={() => toggleSource(s.value)}
                className="checkbox-custom"
              />
              {s.label}
            </label>
          ))}
        </div>

        {availableTags.length > 0 && (
          <div>
            <h3 className="kicker mb-3">Skills</h3>
            <div className="flex flex-wrap gap-1.5">
              {availableTags.slice(0, 20).map(({ tag, count }) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`chip ${filters.tags.includes(tag) ? 'is-on' : ''}`}
                >
                  <TechIcon tag={tag} />
                  {tag}
                  <span className="opacity-60">{count}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {hasActiveFilters && (
          <button onClick={clearFilters} className="linkish text-sm">
            Clear filters
          </button>
        )}
      </div>
    </aside>
  );
}
