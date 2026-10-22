'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Job, ResumeData } from '@/types';
import { generateCoverLetter } from '@/lib/coverLetter';
import { getResume, getCoverLetter, saveCoverLetter } from '@/lib/storage';
import { uniqueTags } from '@/lib/tags';
import TechTag from '@/components/TechTag';

interface Props {
  open: boolean;
  job: Job | null;
  onClose: () => void;
  onRequestResumeUpload: () => void;
}

export default function CoverLetterModal({ open, job, onClose, onRequestResumeUpload }: Props) {
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [tone, setTone] = useState<'professional' | 'enthusiastic' | 'concise'>('professional');
  const [customHook, setCustomHook] = useState('');
  const [letter, setLetter] = useState('');
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      setResume(getResume());
      if (job) {
        const existing = getCoverLetter(job.id);
        if (existing) {
          setLetter(existing);
          setEditing(true);
        } else {
          setLetter('');
          setEditing(false);
        }
      }
      setCustomHook('');
      setCopied(false);
      setSaved(false);
    }
  }, [open, job]);

  const generated = useMemo(() => {
    if (!job) return '';
    return generateCoverLetter({ job, resume, tone, customHook: customHook.trim() || undefined });
  }, [job, resume, tone, customHook]);

  const handleGenerate = () => {
    setLetter(generated);
    setEditing(true);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (job) saveCoverLetter(job.id, letter);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleDownload = () => {
    const blob = new Blob([letter], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cover Letter - ${job?.company} - ${job?.title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!open || !job) return null;

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="modal-sheet w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head sticky top-0 z-10 p-5 flex items-start justify-between">
          <div>
            <p className="kicker">Correspondence</p>
            <h2 className="display text-3xl mt-1">Cover letter</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
              {job.title} · {job.company}
            </p>
          </div>
          <button onClick={onClose} className="icon-btn text-2xl">×</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Resume status */}
          {!resume && (
            <div className="callout callout-warn p-4">
              <p className="text-sm font-medium">No resume on file</p>
              <p className="text-xs mt-1" style={{ color: 'var(--soft)' }}>Add a resume if you want the letter matched to your skills. Otherwise the draft stays general.</p>
              <button onClick={onRequestResumeUpload} className="btn-secondary text-xs mt-3">Add resume</button>
            </div>
          )}

          {resume && (
            <div className="callout callout-ok p-3 flex items-center justify-between text-sm">
              <span>Using <strong>{resume.fileName}</strong> · {resume.skills.length} skills</span>
              <button onClick={onRequestResumeUpload} className="linkish text-xs">Change</button>
            </div>
          )}

          {/* Tone selection */}
          <div>
            <label className="kicker block mb-2">Tone</label>
            <div className="flex gap-2 flex-wrap">
              {[
                { v: 'professional' as const, label: 'Professional', desc: 'Formal and polished' },
                { v: 'enthusiastic' as const, label: 'Enthusiastic', desc: 'Warm and energetic' },
                { v: 'concise' as const, label: 'Concise', desc: 'Short and direct' },
              ].map(t => (
                <button
                  key={t.v}
                  onClick={() => setTone(t.v)}
                  className={`tone-btn ${tone === t.v ? 'is-on' : ''}`}
                >
                  <div className="font-medium">{t.label}</div>
                  <div className="text-[11px] opacity-70">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom hook */}
          <div>
            <label className="kicker block mb-2">
              Why this company <span className="normal-case tracking-normal">(optional)</span>
            </label>
            <textarea
              value={customHook}
              onChange={(e) => setCustomHook(e.target.value)}
              className="input-field resize-none"
              rows={2}
              placeholder="e.g., I've been using your product for years and love how you approach developer tooling…"
            />
          </div>

          {/* Preview of matched skills */}
          {resume && job.tags.length > 0 && (() => {
            const resumeSkillsLower = resume.skills.map(s => s.toLowerCase());
            const matched = job.tags.filter(t => resumeSkillsLower.includes(t.toLowerCase()));
            const missing = job.tags.filter(t => !resumeSkillsLower.includes(t.toLowerCase())).slice(0, 5);
            return (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="callout p-3">
                  <div className="kicker mb-2">Matches {matched.length}</div>
                  <div className="text-xs flex flex-wrap gap-1">
                    {matched.length > 0 ? uniqueTags(matched).map(s => <TechTag key={s} tag={s} />) : <span style={{ color: 'var(--muted)' }}>No direct matches. The letter will lean on transferable work.</span>}
                  </div>
                </div>
                <div className="callout p-3">
                  <div className="kicker mb-2">Keywords</div>
                  <div className="text-xs flex flex-wrap gap-1">
                    {uniqueTags(matched.length === 0 ? job.tags : missing).map(s => <TechTag key={s} tag={s} />)}
                  </div>
                </div>
              </div>
            );
          })()}

          <button onClick={handleGenerate} className="btn-primary w-full justify-center !py-2.5">
            {letter ? 'Rewrite' : 'Write letter'}
          </button>

          {/* Letter output */}
          {letter && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="kicker">Draft</label>
                <div className="flex items-center gap-3">
                  <button onClick={handleSave} className="linkish text-xs">{saved ? 'Saved' : 'Save'}</button>
                  <button onClick={handleCopy} className="linkish text-xs">{copied ? 'Copied' : 'Copy'}</button>
                  <button onClick={handleDownload} className="linkish text-xs">Download</button>
                </div>
              </div>
              <textarea
                value={letter}
                onChange={(e) => setLetter(e.target.value)}
                className="input-field min-h-[320px] resize-y text-sm leading-relaxed"
              />
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Edit the draft before you send it.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
