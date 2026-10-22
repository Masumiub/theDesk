'use client';

import type { PipelineStage, ResumeData } from '@/types';

const BOOKMARKS_KEY = 'job-dashboard-bookmarks';
const APPLIED_KEY = 'job-dashboard-applied';
const NOTES_KEY = 'job-dashboard-notes';
const PIPELINE_KEY = 'job-dashboard-pipeline';
const RESUME_KEY = 'job-dashboard-resume';
const COVER_LETTERS_KEY = 'job-dashboard-coverletters';

export function getBookmarks(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

export function toggleBookmark(jobId: string): boolean {
  const bm = getBookmarks();
  if (bm.has(jobId)) bm.delete(jobId); else bm.add(jobId);
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(Array.from(bm)));
  return bm.has(jobId);
}

export function getApplied(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(APPLIED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

export function toggleApplied(jobId: string): boolean {
  const ap = getApplied();
  if (ap.has(jobId)) ap.delete(jobId); else ap.add(jobId);
  localStorage.setItem(APPLIED_KEY, JSON.stringify(Array.from(ap)));
  return ap.has(jobId);
}

export function getNotes(jobId: string): string {
  if (typeof window === 'undefined') return '';
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    const all = raw ? JSON.parse(raw) : {};
    return all[jobId] || '';
  } catch { return ''; }
}

export function saveNotes(jobId: string, notes: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[jobId] = notes;
    localStorage.setItem(NOTES_KEY, JSON.stringify(all));
  } catch {}
}

export function getPipeline(): Record<string, { stage: PipelineStage; date: string }> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(PIPELINE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function setJobStage(jobId: string, stage: PipelineStage): void {
  if (typeof window === 'undefined') return;
  const pipeline = getPipeline();
  if (stage === 'saved' && pipeline[jobId] && pipeline[jobId].stage === 'saved') {
    delete pipeline[jobId];
  } else {
    pipeline[jobId] = { stage, date: new Date().toISOString() };
  }
  localStorage.setItem(PIPELINE_KEY, JSON.stringify(pipeline));
}

export function removeFromPipeline(jobId: string): void {
  if (typeof window === 'undefined') return;
  const pipeline = getPipeline();
  delete pipeline[jobId];
  localStorage.setItem(PIPELINE_KEY, JSON.stringify(pipeline));
}

export function saveResume(resume: ResumeData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(RESUME_KEY, JSON.stringify(resume));
  } catch (e) {
    console.warn('Resume too large for localStorage, trying trimmed version', e);
    // Trim if too large (localStorage ~5MB)
    const trimmed = { ...resume, text: resume.text.slice(0, 200000) };
    try { localStorage.setItem(RESUME_KEY, JSON.stringify(trimmed)); } catch {}
  }
}

export function getResume(): ResumeData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(RESUME_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function clearResume(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(RESUME_KEY);
}

export function getCoverLetter(jobId: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(COVER_LETTERS_KEY);
    const all = raw ? JSON.parse(raw) : {};
    return all[jobId] || null;
  } catch { return null; }
}

export function saveCoverLetter(jobId: string, text: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(COVER_LETTERS_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[jobId] = text;
    localStorage.setItem(COVER_LETTERS_KEY, JSON.stringify(all));
  } catch {}
}

// Simple skill extractor
const COMMON_SKILLS = [
  'javascript','typescript','react','next.js','vue','angular','svelte',
  'node.js','node','express','nestjs','python','django','flask','fastapi',
  'ruby','rails','go','golang','rust','java','kotlin','scala','c++','c#',
  '.net','php','laravel','symfony','swift','ios','android','react native',
  'flutter','aws','gcp','azure','docker','kubernetes','k8s','devops',
  'terraform','ci/cd','jenkins','github actions','postgresql','mysql',
  'mongodb','redis','elasticsearch','graphql','rest','grpc','kafka',
  'ai','ml','machine learning','tensorflow','pytorch','llm','langchain',
  'data science','blockchain','web3','solidity','tailwind','css','html',
  'sass','webpack','vite','redux','frontend','backend','full-stack',
  'fullstack','linux','git','agile','scrum','jira','figma','stripe',
  'firebase','supabase','microservices','serverless'
];

export function extractSkills(text: string): string[] {
  const lower = text.toLowerCase();
  const found = new Set<string>();
  for (const skill of COMMON_SKILLS) {
    const pattern = new RegExp(`(^|[^a-z0-9+#.])${skill.replace(/[.+*?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9+#.]|$)`, 'i');
    if (pattern.test(lower)) found.add(skill === 'node' ? 'node.js' : skill);
  }
  return Array.from(found);
}

export function extractName(text: string): string | undefined {
  // Try to find a name at the start (common resume pattern)
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 5)) {
    // Likely a name: 2-4 words, no punctuation, each word capitalized
    const words = line.split(/\s+/);
    if (words.length >= 2 && words.length <= 4 && /^[A-Z][a-zA-Z'’\-]+(\s+[A-Z][a-zA-Z'’\-]+)+$/.test(line)) {
      return line;
    }
  }
  return undefined;
}

export function extractEmail(text: string): string | undefined {
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match?.[0];
}
