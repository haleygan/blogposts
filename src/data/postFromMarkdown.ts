import type { BlogPost } from '../types';
import { parseFrontmatter } from './parseFrontmatter';

export function postFromMarkdown(raw: string, author: BlogPost['author']): BlogPost {
  const { fields, tags } = parseFrontmatter(raw);
  return {
    id:         fields.id,
    title:      fields.title,
    excerpt:    fields.excerpt,
    date:       fields.date,
    readTime:   fields.readTime,
    tags,
    category:   fields.category,
    coverImage: fields.coverImage || undefined,
    author,
    content:    raw,
  };
}
