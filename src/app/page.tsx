'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import JobCard from '@/components/JobCard';
import StatsBar from '@/components/StatsBar';
import KanbanBoard from '@/components/KanbanBoard';
import ResumeUploader from '@/components/ResumeUploader';
import CoverLetterModal from '@/components/CoverLetterModal';
import { Job, FilterState, JobType, JobSource, PipelineStage, ResumeData, PIPELINE_STAGES } from '@/types';
import { getBookmarks, getApplied, getPipeline, getResume } from '@/lib/storage';

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [pipeline, setPipeline] = useState<Record<string, { stage: PipelineStage; date: string }>>({});
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [coverLetterJob, setCoverLetterJob] = useState<Job | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    types: [],
    tags: [],
    remoteOnly: false,
    sources: [],
    sortBy: 'newest',
  });

  const refreshLocalState = useCallback(() => {
    setBookmarks(getBookmarks());
    setApplied(getApplied());
    setPipeline(getPipeline());
    setResume(getResume());
  }, []);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/jobs?' + Date.now(), { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      // Reconstruct Date objects from serialized JSON
      const jobsWithDates = (data.jobs || []).map((j: Job) => ({
        ...j,
        postedDate: j.postedDate ? new Date(j.postedDate) : null,
      }));
      setJobs(jobsWithDates);
      setLastUpdated(data.fetchedAt || new Date().toISOString());
    } catch (e: any) {
      setError(e.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshLocalState();
    fetchJobs();
  }, [fetchJobs, refreshLocalState]);

  // Poll every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => fetchJobs(), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  const availableTags = useMemo(() => {
    const tagCounts = new Map<string, number>();
    jobs.forEach(j => j.tags.forEach(t => tagCounts.set(t, (tagCounts.get(t) || 0) + 1)));
    return Array.from(tagCounts.entries()).map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count);
  }, [jobs]);

  // Pipeline stats
  const pipelineCounts = useMemo(() => {
    const counts: Record<PipelineStage, number> = { saved: 0, applied: 0, interview: 0, offer: 0, rejected: 0 };
    jobs.forEach(j => {
      const stage = pipeline[j.id]?.stage;
      if (stage) counts[stage]++;
    });
    // Auto-count bookmarked/applied that aren't already in pipeline
    let bmCount = 0, apCount = 0;
    jobs.forEach(j => {
      if (!pipeline[j.id]) {
        if (j.bookmarked || bookmarks.has(j.id)) bmCount++;
        if ((j.applied || applied.has(j.id)) && !bookmarks.has(j.id)) apCount++;
      }
    });
    counts.saved += bmCount;
    counts.applied += apCount;
    return counts;
  }, [jobs, pipeline, bookmarks, applied]);

  const filteredJobs = useMemo(() => {
    let result = jobs.map(j => ({
      ...j,
      bookmarked: bookmarks.has(j.id),
      applied: applied.has(j.id) || pipeline[j.id]?.stage === 'applied' || pipeline[j.id]?.stage === 'interview' || pipeline[j.id]?.stage === 'offer',
      pipelineStage: pipeline[j.id]?.stage,
    }));

    if (activeTab === 'pipeline') {
      result = result.filter(j => bookmarks.has(j.id) || applied.has(j.id) || pipeline[j.id]);
    } else if (activeTab === 'bookmarked') {
      result = result.filter(j => j.bookmarked);
    } else if (activeTab === 'applied') {
      result = result.filter(j => j.applied);
    } else if (activeTab === 'freelance') {
      result = result.filter(j => j.type === 'freelance');
    } else if (activeTab === 'fulltime') {
      result = result.filter(j => j.type === 'full-time');
    } else if (activeTab === 'contract') {
      result = result.filter(j => j.type === 'contract');
    }

    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      result = result.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q) ||
        j.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    if (filters.types.length > 0) result = result.filter(j => filters.types.includes(j.type));
    if (filters.remoteOnly) result = result.filter(j => j.isRemote);
    if (filters.sources.length > 0) result = result.filter(j => filters.sources.includes(j.source));
    if (filters.tags.length > 0) {
      result = result.filter(j => filters.tags.some(t => j.tags.map(x => x.toLowerCase()).includes(t.toLowerCase())));
    }
    if (filters.sortBy === 'newest') {
      result.sort((a, b) => (b.postedDate?.getTime() || 0) - (a.postedDate?.getTime() || 0));
    } else if (filters.sortBy === 'relevance' && filters.search.trim()) {
      const q = filters.search.toLowerCase();
      result.sort((a, b) => {
        const aTitle = a.title.toLowerCase().includes(q) ? 2 : 0;
        const bTitle = b.title.toLowerCase().includes(q) ? 2 : 0;
        const aTag = a.tags.some(t => t.toLowerCase().includes(q)) ? 1 : 0;
        const bTag = b.tags.some(t => t.toLowerCase().includes(q)) ? 1 : 0;
        return (bTitle + bTag) - (aTitle + aTag);
      });
    }
    return result;
  }, [jobs, filters, bookmarks, applied, pipeline, activeTab]);

  const stats = useMemo(() => ({
    total: jobs.length,
    freelance: jobs.filter(j => j.type === 'freelance').length,
    fullTime: jobs.filter(j => j.type === 'full-time').length,
    contract: jobs.filter(j => j.type === 'contract').length,
    remote: jobs.filter(j => j.isRemote).length,
    bookmarked: bookmarks.size,
    applied: applied.size + pipelineCounts.interview + pipelineCounts.offer,
    lastUpdated,
  }), [jobs, bookmarks, applied, pipelineCounts, lastUpdated]);

  const activeTabTitle: Record<string, string> = {
    all: 'All listings',
    freelance: 'Freelance',
    fulltime: 'Full-time',
    contract: 'Contract',
    pipeline: 'Pipeline',
    bookmarked: 'Saved',
    applied: 'Applied',
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="masthead">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-3 flex items-end gap-6">
          <div className="shrink-0 pr-6" style={{ borderRight: '1px solid var(--ink)' }}>
            <p className="kicker">Vol. 01 · Live feeds</p>
            <h1 className="display text-3xl leading-none mt-1">The Desk</h1>
          </div>

          <div className="flex-1 max-w-xl">
            <label className="kicker" htmlFor="job-search">Search</label>
            <input
              id="job-search"
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Role, company, or skill"
              className="input-field mt-1"
            />
          </div>

          <div className="hidden md:flex items-center gap-2 pb-1">
            <button
              onClick={() => setResumeModalOpen(true)}
              className="btn-secondary text-xs"
              title="Upload your resume"
            >
              {resume ? 'Resume on file' : 'Add resume'}
            </button>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as 'newest' | 'salary' | 'relevance' })}
              className="input-field py-2 px-3 text-sm w-auto cursor-pointer"
            >
              <option value="newest">Newest</option>
              <option value="relevance">Relevance</option>
            </select>
          </div>

          <button
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="lg:hidden btn-secondary py-2 px-3 mb-1"
          >
            Index
          </button>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-4 lg:px-8">
        <div className="py-5">
          <StatsBar stats={stats} loading={loading} onRefresh={fetchJobs} />
        </div>

        <div className="flex gap-6 pb-10">
          {/* Sidebar */}
          <div className={`${mobileFiltersOpen ? 'fixed inset-0 z-50 lg:static' : 'hidden lg:block'}`} style={mobileFiltersOpen ? { background: 'rgba(28,25,21,0.46)' } : undefined} onClick={() => setMobileFiltersOpen(false)}>
            <div
              className={`${mobileFiltersOpen ? 'w-72 h-full overflow-y-auto p-4' : ''} lg:w-auto lg:h-auto lg:p-0 relative`}
              onClick={(e) => e.stopPropagation()}
              style={mobileFiltersOpen ? { background: 'var(--paper)' } : {}}
            >
              {mobileFiltersOpen && (
                <div className="mb-4 pb-3 flex items-center justify-between lg:hidden" style={{ borderBottom: '1px solid var(--ink)' }}>
                  <h2 className="display text-2xl">Index</h2>
                  <button onClick={() => setMobileFiltersOpen(false)} className="icon-btn">×</button>
                </div>
              )}
              <Sidebar
                filters={filters}
                setFilters={setFilters}
                stats={{
                  total: stats.total,
                  freelance: stats.freelance,
                  fullTime: stats.fullTime,
                  contract: stats.contract,
                  bookmarked: pipelineCounts.saved,
                  applied: pipelineCounts.applied + pipelineCounts.interview + pipelineCounts.offer + pipelineCounts.rejected,
                }}
                activeTab={activeTab}
                setActiveTab={(t) => { setActiveTab(t); setMobileFiltersOpen(false); }}
                availableTags={availableTags}
              />
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4 px-1 flex-wrap gap-3">
              <div>
                <h2 className="display text-3xl">{activeTabTitle[activeTab] || 'Jobs'}</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                  {loading ? 'Pulling listings…' : `${activeTab === 'pipeline' ? Object.values(pipelineCounts).reduce((a, b) => a + b, 0) : filteredJobs.length} on the page`}
                  {(filters.types.length > 0 || filters.tags.length > 0 || filters.remoteOnly || filters.sources.length > 0 || filters.search) && activeTab !== 'pipeline' && (
                    <span className="ml-2" style={{ color: 'var(--accent)' }}>filtered</span>
                  )}
                </p>
              </div>
              {activeTab === 'pipeline' && (
                <div className="flex items-center gap-2 flex-wrap">
                  {PIPELINE_STAGES.map(s => (
                    <span key={s.id} className="kicker px-2 py-1" style={{ border: '1px solid var(--line)' }}>
                      {s.label} {pipelineCounts[s.id]}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {activeTab === 'pipeline' ? (
              <KanbanBoard
                jobs={filteredJobs}
                pipeline={pipeline}
                onUpdate={refreshLocalState}
                onOpenJob={(j) => setSelectedJob(j)}
              />
            ) : loading && jobs.length === 0 ? (
              <div className="space-y-4">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="listing p-5 animate-pulse">
                    <div className="h-4 w-1/3 mb-3" style={{ background: 'var(--line)' }} />
                    <div className="h-3 w-2/3 mb-2" style={{ background: 'var(--line)' }} />
                    <div className="h-3 w-full" style={{ background: 'var(--line)' }} />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="sheet p-10">
                <h3 className="display text-3xl mb-2">The feeds did not answer</h3>
                <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>{error}</p>
                <button onClick={fetchJobs} className="btn-primary">Try again</button>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="sheet p-10">
                <h3 className="display text-3xl mb-2">Nothing under that heading</h3>
                <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>Widen the search or clear a filter.</p>
                <button
                  onClick={() => { setFilters({ search: '', types: [], tags: [], remoteOnly: false, sources: [], sortBy: 'newest' }); setActiveTab('all'); }}
                  className="btn-secondary"
                >Clear all filters</button>
              </div>
            ) : (
              <div>
                {filteredJobs.map(job => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onUpdate={refreshLocalState}
                    isBookmarked={bookmarks.has(job.id)}
                    isApplied={applied.has(job.id) || ['applied', 'interview', 'offer'].includes(pipeline[job.id]?.stage || '')}
                    onGenerateCoverLetter={(j) => setCoverLetterJob(j)}
                    currentStage={pipeline[job.id]?.stage}
                  />
                ))}
              </div>
            )}

            {!loading && jobs.length > 0 && activeTab !== 'pipeline' && (
              <div className="mt-8 text-xs" style={{ color: 'var(--muted)' }}>
                <p>Live only: Hacker News Who is Hiring, We Work Remotely, Remotive, Arbeitnow, Jobicy, and Remote OK.</p>
                <p className="mt-1">Refreshes every 5 minutes. Resume, saved jobs, notes, and letters stay in this browser.</p>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Resume Upload Modal */}
      <ResumeUploader
        open={resumeModalOpen}
        onClose={() => setResumeModalOpen(false)}
        onSaved={(r) => setResume(r)}
      />

      {/* Cover Letter Modal */}
      <CoverLetterModal
        open={!!coverLetterJob}
        job={coverLetterJob}
        onClose={() => setCoverLetterJob(null)}
        onRequestResumeUpload={() => { setResumeModalOpen(true); }}
      />
    </div>
  );
}
