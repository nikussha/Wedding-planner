export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  published: boolean;
  publishedAt: string | null;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}
