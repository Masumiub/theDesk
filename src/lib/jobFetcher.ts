import { Job, JobSource, JobType } from '@/types';
import { uniqueTags } from '@/lib/tags';

const SOURCE_LABELS: Record<JobSource, string> = {
  remoteok: 'Remote OK',
  hackernews: 'Hacker News',
  weworkremotely: 'We Work Remotely',
  github: 'GitHub Jobs',
  stackoverflow: 'Stack Overflow',
  freelancer: 'Freelancer',
  toptal: 'Toptal',
  upwork: 'Upwork',
  remotive: 'Remotive',
  arbeitnow: 'Arbeitnow',
  jobicy: 'Jobicy',
  adzuna: 'Adzuna',
};

function parseDate(dateStr?: string | number): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function timeAgo(date: Date | null): string {
  if (!date) return 'Recently';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function inferJobType(text: string): JobType {
  const lower = text.toLowerCase();
  // Check internship first (Praktikant = intern in German)
  if (/(^|\s)(intern|internship|interns|praktikant|praktikum|student|working student|werkstudent|trainee)(\s|$|[:])/i.test(lower)) return 'internship';
  if (/(^|\s)(freelance|freelancer|self[\s-]employed)(\s|$|[:])/i.test(lower)) return 'freelance';
  if (/(^|\s)(contract|contractor|contract[- ]to[- ]hire|fixed[- ]term|fixed term|zeitvertrag|befristet)(\s|$|[:])/i.test(lower)) return 'contract';
  if (/(^|\s)(part[- ]time|part time|\bpt\b|teilzeit)(\s|$|[:])/i.test(lower)) return 'part-time';
  if (/(^|\s)(per\s*project|project\s*based|gig)/i.test(lower)) return 'freelance';
  return 'full-time';
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractTags(title: string, description: string): string[] {
  const techStack = [
    'javascript', 'typescript', 'react', 'next.js', 'vue', 'angular', 'svelte',
    'node.js', 'node', 'python', 'django', 'flask', 'fastapi', 'ruby', 'rails',
    'golang', 'rust', 'java', 'kotlin', 'scala', 'c++', 'c#', '.net',
    'php', 'laravel', 'symfony', 'swift', 'objective-c', 'ios', 'android',
    'react native', 'flutter', 'aws', 'gcp', 'azure', 'docker', 'kubernetes',
    'k8s', 'devops', 'terraform', 'ci/cd', 'postgresql', 'mysql', 'mongodb',
    'redis', 'graphql', 'rest', 'grpc', 'ai', 'machine learning', 'ml',
    'data science', 'blockchain', 'web3', 'solidity', 'ruby on rails',
    'tailwind', 'css', 'html', 'frontend', 'backend', 'full-stack', 'fullstack',
    'remote', 'senior', 'junior', 'mid-level', 'lead', 'staff', 'principal'
  ];
  const original = `${title} ${description}`;
  let remaining = original.toLowerCase();
  const found: string[] = [];
  if (/\bgolang\b/i.test(original) || /(?<![A-Za-z0-9])Go(?![A-Za-z0-9])/.test(original)) {
    found.push('go');
  }
  const sorted = [...techStack].sort((a, b) => b.length - a.length);
  for (const tech of sorted) {
    const pattern = new RegExp(`(?<![a-z0-9])${escapeRegExp(tech)}(?![a-z0-9])`, 'g');
    if (!pattern.test(remaining)) continue;
    found.push(tech);
    pattern.lastIndex = 0;
    remaining = remaining.replace(pattern, ' ');
  }
  return uniqueTags(found);
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function fetchRemoteOK(): Promise<Job[]> {
  try {
    const res = await fetch('https://remoteok.com/api?tag=developer', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      next: { revalidate: 1800 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data
      .filter((item: any) => item && item.position && item.id)
      .slice(0, 100)
      .map((item: any) => {
        const desc = stripHtml(item.description || '');
        const title = item.position || 'Software Developer';
        return {
          id: `ro-${item.id}`,
          title,
          company: item.company || 'Unknown',
          companyLogo: item.company_logo || item.logo || undefined,
          location: item.location || 'Remote (Worldwide)',
          isRemote: true,
          type: inferJobType(`${title} ${desc}`),
          salary: item.salary_min && item.salary_max ? `$${Math.round(item.salary_min/1000)}k - $${Math.round(item.salary_max/1000)}k` : undefined,
          description: desc,
          descriptionSnippet: desc.slice(0, 280) + (desc.length > 280 ? '…' : ''),
          tags: extractTags(title, desc),
          url: item.url || `https://remoteok.com/remote-jobs/${item.id}`,
          source: 'remoteok' as JobSource,
          sourceLabel: SOURCE_LABELS.remoteok,
          postedAt: timeAgo(parseDate(item.epoch ? item.epoch * 1000 : item.date)),
          postedDate: parseDate(item.epoch ? item.epoch * 1000 : item.date),
        };
      });
  } catch (e) {
    console.error('RemoteOK fetch error:', e);
    return [];
  }
}

export async function fetchHackerNewsWhoIsHiring(): Promise<Job[]> {
  try {
    // Find the latest "Who is hiring?" thread via Algolia HN API
    const searchRes = await fetch(
      'https://hn.algolia.com/api/v1/search?query=Who%20is%20hiring%3F&tags=story,author_whoishiring&hitsPerPage=1',
      { next: { revalidate: 3600 } }
    );
    if (!searchRes.ok) return [];
    const searchData = await searchRes.json();
    const storyId = searchData.hits?.[0]?.objectID;
    if (!storyId) return [];

    const threadRes = await fetch(
      `https://hn.algolia.com/api/v1/items/${storyId}`,
      { next: { revalidate: 1800 } }
    );
    if (!threadRes.ok) return [];
    const thread = await threadRes.json();
    const comments = thread.children || [];

    return comments
      .filter((c: any) => c && c.text && c.author && c.author !== 'whoishiring')
      .slice(0, 80)
      .map((c: any, idx: number) => {
        const text = stripHtml(c.text || '');
        const firstLine = text.split('\n')[0] || '';
        const titleMatch = firstLine.match(/(.+?)\s*\|\s*(.+?)\s*(?:\||$)/);
        const company = titleMatch?.[1]?.trim() || firstLine.slice(0, 50) || 'Company';
        const title = titleMatch?.[2]?.trim() || 'Software Developer';
        const isRemote = /remote|anywhere|worldwide/i.test(text);
        const isFreelance = /freelance|contract|consulting|gig/i.test(text);
        return {
          id: `hn-${c.id}`,
          title: title.length > 100 ? title.slice(0, 100) + '…' : title,
          company: company.length > 60 ? company.slice(0, 60) + '…' : company,
          location: isRemote ? 'Remote' : 'See post',
          isRemote,
          type: isFreelance ? inferJobType(text) : 'full-time',
          description: text,
          descriptionSnippet: text.slice(0, 280) + (text.length > 280 ? '…' : ''),
          tags: extractTags(title, text),
          url: `https://news.ycombinator.com/item?id=${c.id}`,
          source: 'hackernews' as JobSource,
          sourceLabel: SOURCE_LABELS.hackernews,
          postedAt: timeAgo(parseDate(c.created_at_i ? c.created_at_i * 1000 : c.created_at)),
          postedDate: parseDate(c.created_at_i ? c.created_at_i * 1000 : c.created_at),
        };
      });
  } catch (e) {
    console.error('HN fetch error:', e);
    return [];
  }
}

export async function fetchWeWorkRemotely(): Promise<Job[]> {
  try {
    // WWR provides a JSON RSS feed
    const res = await fetch('https://weworkremotely.com/remote-jobs.json', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 1800 },
    });
    if (!res.ok) {
      // Fallback to RSS
      const rssRes = await fetch('https://weworkremotely.com/categories/remote-programming-jobs.rss', {
        next: { revalidate: 1800 },
      });
      if (!rssRes.ok) return [];
      const rssText = await rssRes.text();
      return parseWwrRss(rssText);
    }
    const data = await res.json();
    const items = data?.items || data || [];
    if (!Array.isArray(items)) return [];
    return items.slice(0, 60).map((item: any, idx: number) => {
      const desc = stripHtml(item.description || item.content || '');
      const title = item.title || 'Developer Job';
      const company = item.company_name || item['dc:creator'] || 'Company';
      return {
        id: `wwr-${item.id || idx}`,
        title,
        company,
        companyLogo: item.company_logo || item.logo || undefined,
        location: item.region || 'Remote',
        isRemote: true,
        type: inferJobType(`${title} ${desc}`),
        salary: item.salary || undefined,
        description: desc,
        descriptionSnippet: desc.slice(0, 280) + (desc.length > 280 ? '…' : ''),
        tags: extractTags(title, desc),
        url: item.url || item.link || 'https://weworkremotely.com',
        source: 'weworkremotely' as JobSource,
        sourceLabel: SOURCE_LABELS.weworkremotely,
        postedAt: timeAgo(parseDate(item.pubDate || item.published_at)),
        postedDate: parseDate(item.pubDate || item.published_at),
      };
    });
  } catch (e) {
    console.error('WWR fetch error:', e);
    return [];
  }
}

function parseWwrRss(rssText: string): Job[] {
  const jobs: Job[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  const tagRegex = (tag: string) => new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  let match;
  let idx = 0;
  while ((match = itemRegex.exec(rssText)) !== null && idx < 60) {
    const itemXml = match[1];
    const title = stripHtml((itemXml.match(tagRegex('title'))?.[1] || 'Developer Job').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1'));
    const link = (itemXml.match(tagRegex('link'))?.[1] || '').trim();
    const pubDate = itemXml.match(tagRegex('pubDate'))?.[1];
    const descRaw = itemXml.match(tagRegex('description'))?.[1] || '';
    const desc = stripHtml(descRaw.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1'));
    const companyMatch = title.match(/(.+?):\s*(.+)/);
    const company = companyMatch?.[1]?.trim() || 'Company';
    const jobTitle = companyMatch?.[2]?.trim() || title;
    jobs.push({
      id: `wwr-${idx}-${Date.now()}`,
      title: jobTitle,
      company,
      location: 'Remote',
      isRemote: true,
      type: inferJobType(`${jobTitle} ${desc}`),
      description: desc,
      descriptionSnippet: desc.slice(0, 280) + (desc.length > 280 ? '…' : ''),
      tags: extractTags(jobTitle, desc),
      url: link,
      source: 'weworkremotely',
      sourceLabel: SOURCE_LABELS.weworkremotely,
      postedAt: timeAgo(parseDate(pubDate)),
      postedDate: parseDate(pubDate),
    });
    idx++;
  }
  return jobs;
}

export async function fetchRemotive(): Promise<Job[]> {
  try {
    const res = await fetch('https://remotive.com/api/remote-jobs?category=software-dev&limit=80', {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
      next: { revalidate: 1800 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const items = data?.jobs || [];
    return items.slice(0, 60).map((item: any) => {
      const desc = stripHtml(item.description || '');
      const title = item.title || 'Developer Job';
      return {
        id: `rm-${item.id}`,
        title,
        company: item.company_name || 'Unknown',
        companyLogo: item.company_logo || undefined,
        location: item.candidate_required_location || 'Remote',
        isRemote: true,
        type: inferJobType(`${title} ${desc} ${item.job_type || ''}`),
        salary: item.salary || undefined,
        description: desc,
        descriptionSnippet: desc.slice(0, 280) + (desc.length > 280 ? '…' : ''),
        tags: uniqueTags([...(item.tags || []), ...extractTags(title, desc)]),
        url: item.url || `https://remotive.com/remote-jobs/${item.id}`,
        source: 'remotive' as JobSource,
        sourceLabel: SOURCE_LABELS.remotive,
        postedAt: timeAgo(parseDate(item.publication_date)),
        postedDate: parseDate(item.publication_date),
      };
    });
  } catch (e) {
    console.error('Remotive fetch error:', e);
    return [];
  }
}

export async function fetchJobicy(): Promise<Job[]> {
  try {
    const res = await fetch('https://jobicy.com/api/v2/remote-jobs?count=50&tag=dev', {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
      next: { revalidate: 1800 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const items = data?.jobs || [];
    return items.slice(0, 50).map((item: any) => {
      const desc = stripHtml(item.jobDescription || item.jobExcerpt || '');
      const title = item.jobTitle || 'Developer Job';
      const companyName = item.companyName || 'Unknown';
      return {
        id: `jb-${item.id}`,
        title,
        company: companyName,
        companyLogo: item.companyLogo || undefined,
        location: item.jobGeo || 'Remote',
        isRemote: true,
        type: inferJobType(`${title} ${desc} ${item.jobType?.join(' ') || ''}`),
        salary: item.annualSalaryMin && item.annualSalaryMax
          ? `$${Math.round(item.annualSalaryMin/1000)}k – $${Math.round(item.annualSalaryMax/1000)}k`
          : undefined,
        description: desc,
        descriptionSnippet: desc.slice(0, 280) + (desc.length > 280 ? '…' : ''),
        tags: uniqueTags([...(item.tags || []), ...extractTags(title, desc)]),
        url: item.url || `https://jobicy.com/jobs/${item.id}`,
        source: 'jobicy' as JobSource,
        sourceLabel: 'Jobicy',
        postedAt: timeAgo(parseDate(item.pubDate)),
        postedDate: parseDate(item.pubDate),
      };
    });
  } catch (e) {
    console.error('Jobicy fetch error:', e);
    return [];
  }
}

export async function fetchArbeitnow(): Promise<Job[]> {
  try {
    const res = await fetch('https://www.arbeitnow.com/api/job-board-api', {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    const items = data?.data || [];
    return items
      .filter((item: any) => item.tags?.some((t: string) => /develop|engineer|programm|software|frontend|backend|full[- ]?stack/i.test(t)))
      .slice(0, 40)
      .map((item: any) => {
        const desc = stripHtml(item.description || '');
        const title = item.title || 'Developer Job';
        const isRemote = item.remote || false;
        const tagsFromItem = (item.tags || []).map((t: string) => t.toLowerCase());
        return {
          id: `an-${item.slug || Math.random().toString(36).slice(2)}`,
          title,
          company: item.company_name || 'Unknown',
          location: isRemote ? 'Remote' : (item.location || 'Various'),
          isRemote,
          type: inferJobType(`${title} ${desc} ${item.job_types?.join(' ') || ''}`),
          salary: item.salary || undefined,
          description: desc,
          descriptionSnippet: desc.slice(0, 280) + (desc.length > 280 ? '…' : ''),
          tags: uniqueTags([...tagsFromItem, ...extractTags(title, desc)]),
          url: item.url || `https://www.arbeitnow.com/jobs/${item.slug}`,
          source: 'arbeitnow' as JobSource,
          sourceLabel: SOURCE_LABELS.arbeitnow,
          postedAt: timeAgo(parseDate(item.created_at * 1000)),
          postedDate: parseDate(item.created_at * 1000),
        };
      });
  } catch (e) {
    console.error('Arbeitnow fetch error:', e);
    return [];
  }
}

export async function fetchAllJobs(): Promise<Job[]> {
  const [remoteOk, hnJobs, wwrJobs, remotiveJobs, arbeitnowJobs, jobicyJobs] = await Promise.all([
    fetchRemoteOK(),
    fetchHackerNewsWhoIsHiring(),
    fetchWeWorkRemotely(),
    fetchRemotive(),
    fetchArbeitnow(),
    fetchJobicy(),
  ]);

  const allJobs = [...remoteOk, ...hnJobs, ...wwrJobs, ...remotiveJobs, ...arbeitnowJobs, ...jobicyJobs];

  // Deduplicate by similar title+company
  const seen = new Set<string>();
  const unique = allJobs.filter(job => {
    const key = `${job.title.toLowerCase().slice(0, 50)}|${job.company.toLowerCase().slice(0, 30)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort newest first
  unique.sort((a, b) => {
    const da = a.postedDate?.getTime() || 0;
    const db = b.postedDate?.getTime() || 0;
    return db - da;
  });

  return unique;
}
