'use client';

import type { Job, ResumeData } from '@/types';

interface Params {
  job: Job;
  resume: ResumeData | null;
  tone?: 'professional' | 'enthusiastic' | 'concise';
  customHook?: string;
}

export function generateCoverLetter({ job, resume, tone = 'professional', customHook }: Params): string {
  const candidateName = resume?.name || '[Your Name]';
  const candidateEmail = resume?.email || '[your.email@example.com]';
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Find matching skills between resume and job
  const resumeSkills = resume?.skills || [];
  const jobSkills = job.tags.map(t => t.toLowerCase());
  const matching = resumeSkills.filter(s => jobSkills.includes(s.toLowerCase()));
  const relevantSkills = matching.length > 0 ? matching : (job.tags.slice(0, 4) || ['software development']);

  // Build an experience snippet
  const expSnippet = buildExperienceSnippet(resume?.experience || '', job);

  // Openings
  const openings: Record<string, string> = {
    professional: `I am writing to express my strong interest in the ${job.title} position at ${job.company}. With a proven track record of building robust, scalable software and a deep alignment with the work ${job.company} is doing, I am confident I would be a valuable addition to your team.`,
    enthusiastic: `I was thrilled to come across the ${job.title} opening at ${job.company}! As someone who has long admired ${job.company}'s work and has spent years honing exactly the skills this role demands, I couldn't wait to apply.`,
    concise: `I'm writing to apply for the ${job.title} position at ${job.company}. My background aligns closely with your requirements, and I'm eager to bring my expertise to your team.`,
  };

  // Skills paragraph
  let skillsPara = '';
  if (matching.length >= 2) {
    skillsPara = `My technical background directly aligns with the core requirements of this role. I have extensive hands-on experience with ${formatList(relevantSkills.slice(0, 4))}, which I see are central to this position. `;
  } else {
    skillsPara = `I bring strong proficiency in ${formatList(relevantSkills.slice(0, 3))}, along with a track record of quickly mastering new technologies. `;
  }

  if (job.isRemote) {
    skillsPara += `I have ${resume ? 'consistently thrived in' : 'significant experience with'} remote and distributed work environments, and I value the asynchronous communication and outcome-focused culture that remote teams require. `;
  }

  // Custom hook
  const hookLine = customHook
    ? `${customHook}\n\n`
    : '';

  // Closing
  const closings: Record<string, string> = {
    professional: `I would welcome the opportunity to discuss how my experience and enthusiasm can contribute to ${job.company}'s continued success. Thank you for considering my application — I look forward to the possibility of speaking with you.`,
    enthusiastic: `I would be absolutely delighted to discuss this role further and share more about how I can contribute from day one. Thank you so much for your time, and I'm excited about the possibility of joining ${job.company}!`,
    concise: `I'd welcome the chance to discuss how I can contribute to ${job.company}. Thank you for your consideration.`,
  };

  // Determine employment-type phrasing
  const typePhrasing: Record<string, string> = {
    'full-time': 'full-time role',
    'freelance': 'freelance engagement',
    'contract': 'contract opportunity',
    'part-time': 'part-time position',
    'internship': 'internship opportunity',
  };

  const letter = `${candidateName}
${candidateEmail}
${today}

Hiring Manager
${job.company}

Dear Hiring Manager,

${hookLine}${openings[tone]}

${expSnippet}${skillsPara}

What draws me to ${job.company} specifically is the chance to contribute to meaningful work in ${job.type === 'freelance' ? 'a focused project capacity' : 'a long-term capacity'}, and to bring my problem-solving skills to a team that values quality and impact. I approach every ${typePhrasing[job.type] || 'role'} with a strong sense of ownership, clear communication, and a commitment to shipping reliable, well-tested software.

${closings[tone]}

Warm regards,
${candidateName}`;

  return letter;
}

function buildExperienceSnippet(experience: string, job: Job): string {
  if (!experience) {
    return `Throughout my career as a software developer, I've designed, built, and shipped production systems — from frontend interfaces to backend services — with an emphasis on clean architecture, performance, and user experience. `;
  }

  // Try to extract a meaningful recent experience sentence
  const sentences = experience
    .split(/[.!?]\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 30 && s.length < 300);

  // Find a sentence relevant to the job
  const jobKeywords = [...job.tags.map(t => t.toLowerCase()), job.title.toLowerCase()];
  const relevant = sentences.find(s => {
    const low = s.toLowerCase();
    return jobKeywords.some(k => low.includes(k));
  });

  if (relevant) {
    return `${relevant}. `;
  }
  if (sentences.length > 0) {
    return `${sentences[0]}. `;
  }
  return `Throughout my career, I have built deep expertise across the software development lifecycle — from requirements gathering and design to implementation, testing, and deployment. `;
}

function formatList(items: string[]): string {
  const clean = items.filter(Boolean);
  if (clean.length === 0) return 'software development';
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]} and ${clean[1]}`;
  return `${clean.slice(0, -1).join(', ')}, and ${clean[clean.length - 1]}`;
}
