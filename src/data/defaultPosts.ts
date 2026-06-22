import type { BlogPostMeta } from '../types';
import { SITE_AUTHOR } from './siteAuthor';
import { POST_INDEX } from 'virtual:post-index';

type RawMeta = Omit<BlogPostMeta, 'author'> & { _globPath: string };

const contentLoaders = import.meta.glob('../../blogposts/*.md', {
  import: 'default',
}) as Record<string, () => Promise<string>>;

export const CONTENT_LOADERS: Record<string, () => Promise<string>> = {};

export const DEFAULT_POSTS: BlogPostMeta[] = (POST_INDEX as RawMeta[])
  .map(({ _globPath, ...meta }) => {
    const loader = contentLoaders[_globPath];
    if (loader) CONTENT_LOADERS[meta.id] = loader;
    return { ...meta, author: SITE_AUTHOR };
  })
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
