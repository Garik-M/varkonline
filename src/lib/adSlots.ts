export const PAGES = ['home', 'eligibility', 'affordability', 'calculator', 'blog', 'compare'] as const;
export type Page = typeof PAGES[number];

export const POSITIONS = ['left', 'right', 'top', 'bottom'] as const;
export type Position = typeof POSITIONS[number];

export const PAGE_LABELS: Record<Page, string> = {
  home: 'Home',
  eligibility: 'Eligibility',
  affordability: 'Affordability',
  calculator: 'Calculator',
  blog: 'Blog',
  compare: 'Compare',
};

export const POSITION_LABELS: Record<Position, string> = {
  left: 'Left Sidebar',
  right: 'Right Sidebar',
  top: 'Top Row',
  bottom: 'Bottom Row',
};

// Generate all possible slot combinations
export const AD_SLOTS: readonly string[] = PAGES.flatMap(
  (page) => POSITIONS.map((position) => `${page}_${position}`)
);

export type AdSlot = typeof AD_SLOTS[number];

export const SLOT_LABELS: Record<AdSlot, string> = AD_SLOTS.reduce((acc, slot) => {
  const [page, position] = slot.split('_') as [Page, Position];
  acc[slot] = `${PAGE_LABELS[page]} — ${POSITION_LABELS[position]}`;
  return acc;
}, {} as Record<AdSlot, string>);

export function isValidSlot(value: string): value is AdSlot {
  return (AD_SLOTS as readonly string[]).includes(value);
}

export function isValidPage(value: string): value is Page {
  return (PAGES as readonly string[]).includes(value);
}

export function isValidPosition(value: string): value is Position {
  return (POSITIONS as readonly string[]).includes(value);
}

export function isValidPageArray(value: string[]): boolean {
  return value.every(isValidPage);
}

export function isValidPositionArray(value: string[]): boolean {
  return value.every(isValidPosition);
}

export function slotFromPageAndPosition(page: Page, position: Position): AdSlot {
  return `${page}_${position}` as AdSlot;
}

// Get all possible slot combinations from pages and positions arrays
export function getSlotsFromPagesAndPositions(pages: Page[], positions: Position[]): AdSlot[] {
  const result: AdSlot[] = [];
  for (const page of pages) {
    for (const position of positions) {
      result.push(slotFromPageAndPosition(page, position));
    }
  }
  return result;
}
