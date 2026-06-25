export interface Photo {
  id: string;
  url: string;
  alt: string | null;
  caption: string | null;
  order: number;
  createdAt: string;
}
