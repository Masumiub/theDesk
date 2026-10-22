export type JobType = 'full-time' | 'freelance' | 'contract' | 'part-time' | 'internship';
export type JobSource = 'remoteok' | 'hackernews' | 'weworkremotely' | 'github' | 'stackoverflow' | 'freelancer' | 'toptal' | 'upwork' | 'remotive' | 'arbeitnow' | 'jobicy' | 'adzuna';

export type PipelineStage = 'saved' | 'applied' | 'interview' | 'offer' | 'rejected';

export interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  isRemote: boolean;
  type: JobType;
  salary?: string;
  description: string;
  descriptionSnippet: string;
  tags: string[];
  url: string;
  source: JobSource;
  sourceLabel: string;
  postedAt: string;
  postedDate: Date | null;
  bookmarked?: boolean;
  applied?: boolean;
  pipelineStage?: PipelineStage;
  appliedDate?: string;
}

export interface ResumeData {
  text: string;
  fileName: string;
  uploadedAt: string;
  skills: string[];
  experience: string;
  name?: string;
  email?: string;
}

export interface FilterState {
  search: string;
  types: JobType[];
  tags: string[];
  remoteOnly: boolean;
  sources: JobSource[];
  sortBy: 'newest' | 'salary' | 'relevance';
}

export interface DashboardStats {
  totalJobs: number;
  freelanceCount: number;
  remoteCount: number;
  newToday: number;
}

export const PIPELINE_STAGES: { id: PipelineStage; label: string; icon: string; color: string }[] = [
  { id: 'saved', label: 'Saved', icon: '🔖', color: '#64748b' },
  { id: 'applied', label: 'Applied', icon: '📤', color: '#3b82f6' },
  { id: 'interview', label: 'Interview', icon: '💬', color: '#a855f7' },
  { id: 'offer', label: 'Offer', icon: '🎉', color: '#10b981' },
  { id: 'rejected', label: 'Rejected', icon: '❌', color: '#ef4444' },
];
