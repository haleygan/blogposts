import type { BlogPost } from '../types';
import { SITE_AUTHOR } from './siteAuthor';
import { postFromMarkdown } from './postFromMarkdown';

const modules = import.meta.glob('../../_posts/*.md', { as: 'raw', eager: true }) as Record<string, string>;

export const DEFAULT_POSTS: BlogPost[] = Object.values(modules)
  .map(raw => postFromMarkdown(raw, SITE_AUTHOR))
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
