/// <reference types="vite/client" />

declare module '*.md?raw' {
  const content: string;
  export default content;
}

declare module '*.md' {
  const content: string;
  export default content;
}

declare module 'virtual:post-index' {
  interface PostMeta {
    id: string;
    title: string;
    excerpt: string;
    date: string;
    readTime: string;
    tags: string[];
    category?: string;
    coverImage?: string;
    _globPath: string;
  }
  export const POST_INDEX: PostMeta[];
}
