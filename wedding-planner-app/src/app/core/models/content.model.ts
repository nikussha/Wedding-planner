export interface SiteContentEntry {
  title: string | null;
  body: string | null;
}

export type SiteContentMap = Record<string, SiteContentEntry>;
