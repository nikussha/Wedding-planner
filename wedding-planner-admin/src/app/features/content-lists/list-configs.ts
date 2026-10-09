import { MarketingResource } from '../../core/services/marketing.service';

export type ListFieldType = 'text' | 'textarea' | 'lines' | 'slug';

export interface ListField {
  key: string;
  label: string;
  type: ListFieldType;
  required?: boolean;
  hint?: string;
  /** Rows for a textarea. */
  rows?: number;
}

export interface ListConfig {
  resource: MarketingResource;
  /** Page title. */
  title: string;
  /** One sentence explaining where this appears on the public site. */
  description: string;
  /** Singular noun for buttons: "Add FAQ". */
  itemNoun: string;
  /** Which field to show as the row's headline when collapsed. */
  titleField: string;
  /** What the public site does when the list is empty. */
  emptyNote: string;
  fields: ListField[];
}

/**
 * The four editable lists. Each screen is the same component driven by one of
 * these, so adding a field is a one-line change here rather than a new form.
 */
export const LIST_CONFIGS: Record<string, ListConfig> = {
  faq: {
    resource: 'faq',
    title: 'Questions & answers',
    description:
      'Shown on the home page and again on the Services page, above the enquiry invitation. Answer the money question first — it is the one couples most want answered.',
    itemNoun: 'question',
    titleField: 'question',
    emptyNote: 'With no questions published, the FAQ section does not appear on the site.',
    fields: [
      { key: 'question', label: 'Question', type: 'text', required: true },
      { key: 'answer', label: 'Answer', type: 'textarea', required: true, rows: 4 },
    ],
  },

  testimonials: {
    resource: 'testimonials',
    title: 'Testimonials',
    description:
      'Shown on the home page, late in the page where doubt peaks. Use the couple’s own words, with their permission.',
    itemNoun: 'testimonial',
    titleField: 'names',
    emptyNote:
      'With none published, the testimonials section does not appear at all — which is the right behaviour until you have real quotes. Never write example ones.',
    fields: [
      { key: 'names', label: 'Names', type: 'text', required: true, hint: 'First names, e.g. “Ana & Giorgi”.' },
      {
        key: 'context',
        label: 'Venue and season',
        type: 'text',
        hint: 'What makes a quote credible, e.g. “Kakheti, September 2026”.',
      },
      { key: 'quote', label: 'What they said', type: 'textarea', required: true, rows: 4 },
    ],
  },

  process: {
    resource: 'process',
    title: 'How it works',
    description:
      'The numbered steps on the home page and the About page. They answer “what happens after I enquire?”, which is the commonest hesitation.',
    itemNoun: 'step',
    titleField: 'title',
    emptyNote: 'With no steps published, the process section does not appear on either page.',
    fields: [
      { key: 'title', label: 'Step title', type: 'text', required: true },
      { key: 'body', label: 'What happens', type: 'textarea', required: true, rows: 3 },
    ],
  },

  'service-tiers': {
    resource: 'service-tiers',
    title: 'Services',
    description:
      'The levels of help you offer. These drive the home page cards and the whole Services page, and they are the single biggest factor in whether a couple gets in touch.',
    itemNoun: 'service',
    titleField: 'name',
    emptyNote:
      'With none published, the services sections disappear from the home and Services pages.',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      {
        key: 'slug',
        label: 'Web address',
        type: 'slug',
        required: true,
        hint: 'Lowercase words with hyphens. Becomes the link, e.g. /services#full-planning.',
      },
      {
        key: 'forWho',
        label: 'Who it is for',
        type: 'textarea',
        required: true,
        rows: 2,
        hint: 'One sentence. This is the line that helps a couple recognise themselves.',
      },
      {
        key: 'startsAt',
        label: 'When it starts',
        type: 'text',
        required: true,
        hint: 'e.g. “From booking” or “Six to eight weeks before the day”.',
      },
      {
        key: 'investment',
        label: 'Investment',
        type: 'text',
        hint: 'A figure or range. Left empty, the site says it is shared with the proposal rather than inventing a price.',
      },
      {
        key: 'includedBefore',
        label: 'Included before the wedding',
        type: 'lines',
        required: true,
        rows: 7,
        hint: 'One item per line.',
      },
      {
        key: 'includedOnDay',
        label: 'Included on the day',
        type: 'lines',
        required: true,
        rows: 5,
        hint: 'One item per line.',
      },
      {
        key: 'excluded',
        label: 'Not included',
        type: 'lines',
        rows: 3,
        hint: 'One item per line. Stating exclusions prevents the worst enquiry conversations.',
      },
    ],
  },
};
