'use client';

import { useState } from 'react';
import { Job, PipelineStage, PIPELINE_STAGES } from '@/types';
import { toggleBookmark, toggleApplied, getNotes, saveNotes, setJobStage } from '@/lib/storage';
import { uniqueTags } from '@/lib/tags';
import TechTag from '@/components/TechTag';

interface JobCardProps {
  job: Job;
  onUpdate: () => void;
  isBookmarked: boolean;
  isApplied: boolean;
  onGenerateCoverLetter: (job: Job) => void;
  currentStage?: PipelineStage;
}

export default function JobCard({ job, onUpdate, isBookmarked, isApplied, onGenerateCoverLetter, currentStage }: JobCardProps) {
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState(() => getNotes(job.id));
  const [expanded, setExpanded] = useState(false);
  const [showStageMenu, setShowStageMenu] = useState(false);

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    toggleBookmark(job.id);
    onUpdate();
  };

  const handleApplied = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    toggleApplied(job.id);
    onUpdate();
  };

  const handleSaveNotes = () => {
    saveNotes(job.id, notes);
  };

  const handleStageChange = (stage: PipelineStage, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setJobStage(job.id, stage);
    setShowStageMenu(false);
    onUpdate();
  };

  const handleCoverLetter = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onGenerateCoverLetter(job);
  };

  const sourceColorMap: Record<string, string> = {
    remoteok: 'source-remoteok',
    hackernews: 'source-hackernews',
    weworkremotely: 'source-weworkremotely',
    remotive: 'source-remotive',
    arbeitnow: 'source-arbeitnow',
    jobicy: 'source-jobicy',
    upwork: 'source-upwork',
    freelancer: 'source-freelancer',
    toptal: 'source-toptal',
    github: 'source-remoteok',
    stackoverflow: 'source-stackoverflow',
  };

  const typeClass = `job-type-badge-${job.type.replace(' ', '').replace('-', '')}`;

  const initials = job.company
    .split(/[\s.-]+/)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  const stageInfo = currentStage ? PIPELINE_STAGES.find(s => s.id === currentStage) : null;

  return (
    <div className="listing px-4 py-5 group">
      <div className="flex gap-4">
        {/* Logo/Avatar */}
        <div className="shrink-0">
          {job.companyLogo ? (
            <img
              src={job.companyLogo}
              alt={job.company}
              className="mark object-contain p-1"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="mark">{initials}</div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="display text-2xl leading-tight">
                  {job.title}
                </h3>
                {isApplied && (
                  <span className="source-badge applied-badge">✓ Applied</span>
                )}
                {stageInfo && stageInfo.id !== 'saved' && (
                  <span className="source-badge">{stageInfo.label}</span>
                )}
              </div>
              <p className="text-sm mb-2" style={{ color: 'var(--muted)' }}>
                <span className="kicker" style={{ color: 'var(--ink)' }}>{job.company}</span>
                <span className="mx-2">/</span>
                <span className="flex items-center gap-1 inline-flex">
                  {job.location}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleBookmark}
                title={isBookmarked ? 'Remove from saved' : 'Save job'}
                className={`icon-btn ${isBookmarked ? 'bookmark-active is-on' : ''}`}
              >
                <svg className="w-5 h-5" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>
              <button
                onClick={() => setShowNotes(!showNotes)}
                title="Add notes"
                className={`icon-btn ${showNotes ? 'is-on' : ''}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowStageMenu(!showStageMenu); }}
                  title="Move to pipeline stage"
                  className="icon-btn"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </button>
                {showStageMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setShowStageMenu(false); }} />
                    <div className="menu" onClick={(e) => e.stopPropagation()}>
                      {PIPELINE_STAGES.map(s => (
                        <button
                          key={s.id}
                          onClick={(e) => handleStageChange(s.id, e)}
                          className={currentStage === s.id ? 'is-on' : ''}
                        >
                          {s.label}
                          {currentStage === s.id ? ' ·' : ''}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Badges Row */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className={`source-badge ${typeClass}`}>
              {job.type.charAt(0).toUpperCase() + job.type.slice(1)}
            </span>
            <span className={`source-badge ${sourceColorMap[job.source] || 'bg-slate-700 text-slate-300'}`}>
              {job.sourceLabel}
            </span>
            {job.isRemote && (
              <span className="source-badge">Remote</span>
            )}
            {job.salary && (
              <span className="source-badge">{job.salary}</span>
            )}
            <span className="text-xs ml-auto flex items-center gap-2" style={{ color: 'var(--muted)' }}>
              <span className="pulse-dot" />
              {job.postedAt}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--soft)' }}>
            {expanded ? job.description : job.descriptionSnippet}
            {job.description.length > 280 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="linkish ml-2 text-xs"
              >
                {expanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </p>

          {/* Tags */}
          {job.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {uniqueTags(job.tags).map(tag => (
                <TechTag key={tag} tag={tag} />
              ))}
            </div>
          )}

          {/* Notes */}
          {showNotes && (
            <div className="note-box mb-3 mt-2 p-3">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={handleSaveNotes}
                placeholder="Notes for this role"
                className="w-full bg-transparent text-sm outline-none resize-none"
                style={{ color: 'var(--ink)' }}
                rows={3}
              />
              <div className="flex justify-end">
                <button
                  onClick={handleSaveNotes}
                  className="linkish text-xs"
                >
                  Save notes
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-xs px-3 py-1.5"
            >
              View Job
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <button
              onClick={handleApplied}
              className={`btn-secondary text-xs px-3 py-1.5 ${isApplied ? 'applied-badge' : ''}`}
            >
              {isApplied ? '✓ Applied' : 'Mark as Applied'}
            </button>
            <button
              onClick={handleCoverLetter}
              className="btn-secondary text-xs px-3 py-1.5 hover:text-purple-300"
            >
              Cover letter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
