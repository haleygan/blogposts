/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BlogPost } from '../types';
import { SITE_AUTHOR } from './siteAuthor';
import wifPost from '../../_posts/2026-06-18-workload-identity-federation-in-gcp.md?raw';

export const DEFAULT_POSTS: BlogPost[] = [
  {
    id: 'gcp-workload-identity-federation',
    title: 'Keyless Authentication to GCP with Workload Identity Federation',
    excerpt:
      'Manage trusts, not secrets — This is how GCP\'s Workload Identity Federation eliminates the need of using service account keys entirely.',
    date: 'June 18, 2026',
    readTime: '30 minutes read',
    tags: ['GCP IAM', 'GitHub Actions', 'Workload Identity Federation'],
    author: SITE_AUTHOR,
    content: wifPost,
    category: 'Cloud',
  },
]; 
