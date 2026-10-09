export interface ServiceTier {
  id: string;
  /** Used for the page anchor, e.g. /services#full-planning. */
  slug: string;
  name: string;
  forWho: string;
  startsAt: string;
  /** Empty means the investment is shared with the proposal instead. */
  investment: string | null;
  includedBefore: string[];
  includedOnDay: string[];
  excluded: string[];
}

export interface ProcessStep {
  id: string;
  title: string;
  body: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface Testimonial {
  id: string;
  /** First names only, by convention. */
  names: string;
  /** Venue and season, which is what makes a quote credible. */
  context: string | null;
  quote: string;
}

export interface MarketingContent {
  serviceTiers: ServiceTier[];
  processSteps: ProcessStep[];
  faqs: FaqItem[];
  testimonials: Testimonial[];
}
