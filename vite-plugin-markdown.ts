import type { Plugin } from 'vite';
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, join } from 'path';

interface PostMeta {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  tags: string[];
  category?: string;
  coverImage?: string;
}

function parseFrontmatter(markdown: string): { meta: Record<string, string>; tags: string[]; content: string } {
  const fields: Record<string, string> = {};
  const listFields: Record<string, string[]> = {};
  let listKey: string | null = null;
  let body = markdown.trim();

  if (body.startsWith('---')) {
    const end = body.indexOf('---', 3);
    if (end !== -1) {
      const block = body.slice(3, end);
      body = body.slice(end + 3).trim();
      for (const line of block.split('\n')) {
        // YAML list item (e.g. "  - GCP IAM") — belongs to the most recent list key
        const listItemMatch = line.match(/^\s+-\s+(.*)/);
        if (listItemMatch && listKey) {
          listFields[listKey] = listFields[listKey] ?? [];
          listFields[listKey].push(listItemMatch[1].trim().replace(/^["']|["']$/g, ''));
          continue;
        }
        // Scalar key: value line
        const colon = line.indexOf(':');
        if (colon === -1) continue;
        const key = line.slice(0, colon).trim();
        const val = line.slice(colon + 1).trim().replace(/^["']|["']$/g, '');
        fields[key] = val;
        listKey = val === '' ? key : null;
      }
    }
  }

  // Resolve tags: multi-line list format takes precedence, then inline bracket, then single value
  let tags: string[] = [];
  if (listFields.tags && listFields.tags.length > 0) {
    tags = listFields.tags;
  } else {
    const tagsRaw = fields.tags ?? '';
    const bracketMatch = tagsRaw.match(/^\[(.*)\]$/);
    if (bracketMatch) {
      tags = bracketMatch[1].split(',').map((t) => t.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    } else if (tagsRaw) {
      tags = [tagsRaw];
    }
  }

  return { meta: fields, tags, content: body };
}

function buildPostIndex(postsDir: string): PostMeta[] {
  let files: string[] = [];
  try {
    files = readdirSync(postsDir).filter((f) => f.endsWith('.md'));
  } catch {
    return [];
  }

  return files.map((filename) => {
    const raw = readFileSync(join(postsDir, filename), 'utf-8');
    const { meta, tags } = parseFrontmatter(raw);
    return {
      id: meta.id ?? '',
      title: meta.title ?? '',
      excerpt: meta.excerpt ?? '',
      date: meta.date ?? '',
      readTime: meta.readTime ?? '',
      tags,
      category: meta.category,
      coverImage: meta.coverImage,
    };
  });
}

export function markdownPlugin(): Plugin {
  const postsDir = resolve(process.cwd(), 'blogposts');

  return {
    name: 'vite-plugin-markdown',

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] ?? '';

        if (url.endsWith('/posts-index.json')) {
          const index = buildPostIndex(postsDir);
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify(index));
          return;
        }

        const postMatch = url.match(/\/posts\/([^/]+)\.md$/);
        if (postMatch) {
          const requestedId = postMatch[1];
          let files: string[] = [];
          try {
            files = readdirSync(postsDir).filter((f) => f.endsWith('.md'));
          } catch {
            next();
            return;
          }

          for (const filename of files) {
            const raw = readFileSync(join(postsDir, filename), 'utf-8');
            const { meta, content } = parseFrontmatter(raw);
            if (meta.id === requestedId) {
              res.setHeader('Content-Type', 'text/plain; charset=utf-8');
              res.end(content);
              return;
            }
          }
        }

        next();
      });
    },

    closeBundle() {
      const outDir = resolve(process.cwd(), 'dist');

      const index = buildPostIndex(postsDir);
      writeFileSync(join(outDir, 'posts-index.json'), JSON.stringify(index));

      const postsOutDir = join(outDir, 'posts');
      mkdirSync(postsOutDir, { recursive: true });

      let files: string[] = [];
      try {
        files = readdirSync(postsDir).filter((f) => f.endsWith('.md'));
      } catch {
        return;
      }

      for (const filename of files) {
        const raw = readFileSync(join(postsDir, filename), 'utf-8');
        const { meta, content } = parseFrontmatter(raw);
        if (meta.id) {
          writeFileSync(join(postsOutDir, `${meta.id}.md`), content);
        }
      }
    },
  };
}
