/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  readTime: string;
  tags: string[];
  coverImage?: string;
  author: {
    name: string;
    avatar?: string;
    bio?: string;
  };
  githubUrl?: string; // Optional URL linking back to the GitHub file
  category?: string;
}

export interface GithubConfig {
  owner: string;
  repo: string;
  branch: string;
  folderPath: string;
  accessToken?: string; // Optional GitHub Personal Access Token to avoid rate limits
}

export interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  tags: string[];
  link: string;
  iconName: string; // Lucide icon identifier
  tagline: string;
  architectureIntro: string;
  techStack: string[];
  highLevelArchitecture: string;
  designDecisions: Array<{
    title: string;
    description: string;
    tradeoff: string;
  }>;
  dataPipelineFlow?: string[]; // Step-by-step stream flow for data pipeline representation
}
