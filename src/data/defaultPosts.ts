import { BlogPost } from '../types';
import { SITE_AUTHOR } from './siteAuthor';
import { postFromMarkdown } from './postFromMarkdown';
import wifPost from '../../_posts/2026-06-18-workload-identity-federation-in-gcp.md?raw';

export const DEFAULT_POSTS: BlogPost[] = [
  postFromMarkdown(wifPost, SITE_AUTHOR),
];
