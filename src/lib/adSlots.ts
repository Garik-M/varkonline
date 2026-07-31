export const AD_SLOTS = ['HOME_LEFT', 'HOME_RIGHT', 'HOME_MOBILE_ROW'] as const;
export type AdSlot = typeof AD_SLOTS[number];

export const SLOT_LABELS: Record<AdSlot, string> = {
  HOME_LEFT: 'Home — Left',
  HOME_RIGHT: 'Home — Right',
  HOME_MOBILE_ROW: 'Home — Mobile Row',
};
