export type EnquiryStatus = 'NEW' | 'REPLIED' | 'ARCHIVED';

export interface Enquiry {
  id: string;
  /** Both partners, as the couple wrote it. */
  names: string;
  email: string;
  /** Date marker, or null when the couple has not fixed a date. */
  weddingDate: string | null;
  location: string | null;
  message: string;
  status: EnquiryStatus;
  createdAt: string;
  handledAt: string | null;
}
