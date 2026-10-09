export const EnquiryStatus = {
  NEW: 'NEW',
  REPLIED: 'REPLIED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type EnquiryStatus = (typeof EnquiryStatus)[keyof typeof EnquiryStatus];

export const ENQUIRY_STATUSES = Object.values(EnquiryStatus) as EnquiryStatus[];
