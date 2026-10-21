export interface AnalyticsReport {
  days: number;
  asOf: string;
  retentionDays: number;
  timeZone: string;
  priceRangeLimit: number;
  priceBandSizeAMD: number;
  summary: {
    events: number;
    sessions: number;
    views: number;
    engaged: number;
    refund_sessions: number;
    schedule_sessions: number;
    calculator_sessions: number;
    calculations: number;
    downloads: number;
    priced_calculations: number;
    usd_calculations: number;
    unclassified_calculations: number;
  };
  periods: { days: number; sessions: number; calculations: number }[];
  priceRanges: {
    fromAMD: number;
    toAMD: number;
    calculations: number;
    sessions: number;
  }[];
  events: { type: string; field: string | null; count: number }[];
  daily: {
    date: string;
    sessions: number;
    calculations: number;
    refunds: number;
  }[];
  apartments: {
    apartmentId: string;
    sessions: number;
    calculations: number;
    refunds: number;
    downloads: number;
  }[];
  languages: { language: string; views: number }[];
}
export type AnalyticsRequest = <T>(path: string) => Promise<T>;
