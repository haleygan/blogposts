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
