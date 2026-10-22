'use client';

import { useState, useRef, useCallback } from 'react';
import { saveResume, getResume, clearResume, extractSkills, extractName, extractEmail } from '@/lib/storage';
import { uniqueTags } from '@/lib/tags';
import TechTag from '@/components/TechTag';
import type { ResumeData } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (resume: ResumeData) => void;
}

export default function ResumeUploader({ open, onClose, onSaved }: Props) {
  const [existing, setExisting] = useState<ResumeData | null>(() => getResume());
  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [manualText, setManualText] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const parsePdf = async (file: File): Promise<string> => {
    setStatus('Reading PDF…');
    try {
      const arrayBuffer = await file.arrayBuffer();
      // Dynamic import to reduce initial bundle
      const pdfjs = await import('pdfjs-dist');
      // Use CDN worker to avoid bundling issues
      // @ts-ignore
      pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/5.6.205/pdf.worker.min.mjs`;

      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }
      return fullText;
    } catch (e) {
      console.error('PDF parse error:', e);
      throw new Error('Could not parse this PDF. Try pasting the text manually, or use TXT format.');
    }
  };

  const handleFile = useCallback(async (file: File) => {
    setError('');
    setParsing(true);
    setStatus('Processing…');
    try {
      let text = '';
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') {
        text = await parsePdf(file);
      } else if (ext === 'txt' || ext === 'md' || ext === 'rtf') {
        text = await file.text();
      } else if (ext === 'doc' || ext === 'docx') {
        setError('DOC/DOCX parsing requires server-side processing. Please save as PDF or TXT, or paste your resume text manually.');
        setParsing(false);
        setManualMode(true);
        return;
      } else {
        // Try as text
        text = await file.text().catch(() => '');
      }

      if (!text || text.length < 50) {
        setError('Could not extract enough text. Please paste your resume text manually.');
        setParsing(false);
        setManualMode(true);
        return;
      }

      const skills = extractSkills(text);
      const name = extractName(text);
      const email = extractEmail(text);
      // Rough experience extraction: grab chunks that look like experience
      const expLines = text.split('\n')
        .filter(l => l.trim().length > 40)
        .slice(0, 15)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      const resumeData: ResumeData = {
        text,
        fileName: file.name,
        uploadedAt: new Date().toISOString(),
        skills,
        experience: expLines,
        name,
        email,
      };

      saveResume(resumeData);
      setExisting(resumeData);
      setStatus(`✓ Parsed successfully! Found ${skills.length} skills.`);
      onSaved(resumeData);
      setTimeout(() => {
        setParsing(false);
        onClose();
      }, 1200);
    } catch (e: any) {
      setError(e.message || 'Failed to parse file');
      setParsing(false);
    }
  }, [onSaved, onClose]);

  const handleManualSave = () => {
    if (manualText.length < 50) {
      setError('Please paste at least a short resume summary.');
      return;
    }
    setError('');
    const skills = extractSkills(manualText);
    const name = extractName(manualText);
    const email = extractEmail(manualText);
    const expLines = manualText.split('\n').filter(l => l.trim().length > 40).slice(0, 15).join(' ').replace(/\s+/g, ' ').trim();
    const resumeData: ResumeData = {
      text: manualText,
      fileName: 'manual-entry.txt',
      uploadedAt: new Date().toISOString(),
      skills,
      experience: expLines,
      name,
      email,
    };
    saveResume(resumeData);
    setExisting(resumeData);
    onSaved(resumeData);
    onClose();
  };

  const handleClear = () => {
    clearResume();
    setExisting(null);
    setManualText('');
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="modal-sheet w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="kicker">On file</p>
            <h2 className="display text-3xl mt-1">Resume</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
              Used only to match skills and draft letters. It stays in this browser.
            </p>
          </div>
          <button onClick={onClose} className="icon-btn text-2xl">×</button>
        </div>

        {existing && !manualMode && (
          <div className="callout callout-ok mb-5 p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="kicker mb-1">Loaded</div>
                <p className="text-sm"><strong>{existing.fileName}</strong></p>
                {existing.name && <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Name: {existing.name}</p>}
                {existing.email && <p className="text-sm" style={{ color: 'var(--muted)' }}>Email: {existing.email}</p>}
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                  {existing.skills.length} skills detected • Uploaded {new Date(existing.uploadedAt).toLocaleString()}
                </p>
                {existing.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {uniqueTags(existing.skills, 15).map(s => (
                      <TechTag key={s} tag={s} />
                    ))}
                    {existing.skills.length > 15 && <span className="text-xs" style={{ color: 'var(--muted)' }}>+{existing.skills.length - 15} more</span>}
                  </div>
                )}
              </div>
              <button onClick={handleClear} className="btn-secondary text-xs" style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}>
                Remove
              </button>
            </div>
          </div>
        )}

        {!manualMode ? (
          <>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const file = e.dataTransfer.files[0];
                if (file) handleFile(file);
              }}
              className="dropzone p-10 text-center cursor-pointer"
              style={{
                borderStyle: 'dashed',
                borderColor: dragging ? 'var(--ink)' : 'var(--line)',
                background: dragging ? 'var(--sheet)' : 'transparent',
              }}
              onClick={() => fileInput.current?.click()}
            >
              <p className="display text-2xl mb-1">
                {parsing ? status : 'Drop a resume, or click to browse'}
              </p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Supports PDF, TXT, MD • Your resume stays in your browser
              </p>
              <input
                ref={fileInput}
                type="file"
                accept=".pdf,.txt,.md,.rtf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </div>

            {parsing && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm" style={{ color: 'var(--muted)' }}>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {status}
              </div>
            )}

            {error && (
              <div className="callout callout-warn mt-4 p-3 text-sm">{error}</div>
            )}

            <div className="mt-4 text-center">
              <button
                onClick={() => setManualMode(true)}
                className="linkish text-sm"
              >
                Or paste resume text manually →
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Paste the text. Name, email, and skills are read from it.</p>
            <textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              className="input-field min-h-[250px] resize-y font-mono text-xs"
              placeholder={`Jane Doe
jane.doe@email.com
(555) 123-4567

EXPERIENCE
Senior Software Engineer | Acme Corp | 2021–Present
- Built React/TypeScript dashboards serving 1M+ users
- Designed REST APIs using Node.js and PostgreSQL
- Led migration to AWS ECS/Kubernetes...`}
            />
            {error && (
              <div className="callout callout-warn p-3 text-sm">{error}</div>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => { setManualMode(false); setError(''); }} className="btn-secondary">Cancel</button>
              <button onClick={handleManualSave} className="btn-primary">Save Resume</button>
            </div>
          </div>
        )}

        <div className="mt-5 pt-4 text-xs" style={{ borderTop: '1px solid var(--line)', color: 'var(--muted)' }}>
          Stored in this browser only. Nothing is sent to a server.
        </div>
      </div>
    </div>
  );
}
