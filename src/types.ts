/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BlogPostMeta {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  tags: string[];
  coverImage?: string;
  author: {
    name: string;
    avatar?: string;
    bio?: string;
  };
  category?: string;
}

export interface BlogPost extends BlogPostMeta {
  content: string;
}
