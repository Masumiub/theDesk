const ALIASES: Record<string, string> = {
  golang: 'go',
  node: 'node.js',
  k8s: 'kubernetes',
  fullstack: 'full-stack',
  'react.js': 'react',
  'vue.js': 'vue',
};

export function uniqueTags(tags: string[], limit = 8): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const key = raw.trim().toLowerCase();
    if (!key) continue;
    const normalized = ALIASES[key] ?? key;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
    if (out.length >= limit) break;
  }
  return out;
}
