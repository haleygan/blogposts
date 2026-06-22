import type { Plugin } from 'vite';
import { readFileSync, readdirSync } from 'fs';
import { resolve, join } from 'path';

const VIRTUAL_INDEX_ID = 'virtual:post-index';
const RESOLVED_VIRTUAL_INDEX_ID = '\0virtual:post-index';

function parseFrontmatterToMeta(markdown: string) {
  const fields: Record<string, string> = {};
  const text = markdown.trim();

  if (text.startsWith('---')) {
    const end = text.indexOf('---', 3);
    if (end !== -1) {
      const block = text.slice(3, end);
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
    ? tagsMatch[1].split(',').map((t: string) => t.trim().replace(/^["']|["']$/g, '')).filter(Boolean)
    : tagsRaw ? [tagsRaw] : [];

  return {
    id: fields.id ?? '',
    title: fields.title ?? '',
    excerpt: fields.excerpt ?? '',
    date: fields.date ?? '',
    readTime: fields.readTime ?? '',
    tags,
    category: fields.category,
    coverImage: fields.coverImage,
  };
}

function buildIndexModule(postsDir: string): string {
  let files: string[] = [];
  try {
    files = readdirSync(postsDir).filter((f) => f.endsWith('.md'));
  } catch {
    files = [];
  }

  const index = files.map((filename) => {
    const raw = readFileSync(join(postsDir, filename), 'utf-8');
    const meta = parseFrontmatterToMeta(raw);
    return { ...meta, _globPath: `../../blogposts/${filename}` };
  });

  return `export const POST_INDEX = ${JSON.stringify(index)};`;
}

export function markdownPlugin(): Plugin {
  const postsDir = resolve(process.cwd(), 'blogposts');

  return {
    name: 'vite-plugin-markdown',

    resolveId(id) {
      if (id === VIRTUAL_INDEX_ID) return RESOLVED_VIRTUAL_INDEX_ID;
    },

    load(id) {
      if (id === RESOLVED_VIRTUAL_INDEX_ID) {
        return buildIndexModule(postsDir);
      }
    },

    transform(code, id) {
      const cleanId = id.split('?')[0];
      if (!cleanId.endsWith('.md')) return;
      // Export raw markdown as default — content-only, no metadata
      return {
        code: `export default ${JSON.stringify(code)};`,
        map: null,
      };
    },
  };
}
