/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BlogPost } from '../types';
import wifPost from '../../_posts/2026-06-16-workload-identity-federation-in-gcp.md?raw';

export const DEFAULT_POSTS: BlogPost[] = [
  {
    id: 'wif-gcp',
    title: 'Authenticate your workloads without keys: Workload Identity Federation in GCP',
    excerpt:
      'A practical walk-through of WIF in GCP, using GitHub Actions pushing Docker images to Artifact Registry as the example.',
    date: 'June 16, 2026',
    readTime: '14 min read',
    tags: ['GCP', 'Security', 'CI/CD', 'GitHub Actions'],
    author: {
      name: 'Haley',
      bio: 'Technical notes and project writeups, kept in plain language.',
    },
    content: wifPost,
    category: 'Cloud',
  },
];

