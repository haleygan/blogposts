export function parseFrontmatter(markdown: string) {
  const fields: Record<string, string> = {};
  let content = markdown.trim();

  if (content.startsWith('---')) {
    const end = content.indexOf('---', 3);
    if (end !== -1) {
      const block = content.slice(3, end);
      content = content.slice(end + 3).trim();
      for (const line of block.split('\n')) {
        const colon = line.indexOf(':');
        if (colon === -1) continue;
        const key = line.slice(0, colon).trim();
        const val = line.slice(colon + 1).trim().replace(/^["']|["']$/g, '');
        fields[key] = val;
      }
    }
  }

  const tagsRaw = fields.tags ?? '';
  const tagsMatch = tagsRaw.match(/^\[(.*)\]$/);
  const tags = tagsMatch
    ? tagsMatch[1].split(',').map(t => t.trim().replace(/^["']|["']$/g, '')).filter(Boolean)
    : tagsRaw ? [tagsRaw] : [];

  return { fields, tags, content };
}
