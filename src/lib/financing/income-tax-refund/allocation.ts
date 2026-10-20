/** Whole-AMD largest-remainder allocation, bounded by each nonnegative weight.
 * It describes quarterly benefits across payment rows, never receipt dates. */
export function allocateAmount(
  total: number,
  capacities: readonly number[],
): number[] {
  const sum = capacities.reduce((a, b) => a + BigInt(b), 0n);
  if (!sum || !total) return capacities.map(() => 0);
  const numerators = capacities.map(
    (capacity) => BigInt(total) * BigInt(capacity),
  );
  const amounts = numerators.map((value) => Number(value / sum));
  let remainder = total - amounts.reduce((a, b) => a + b, 0);
  const order = numerators
    .map((value, index) => ({ index, fraction: value % sum }))
    .sort((a, b) =>
      a.fraction === b.fraction
        ? a.index - b.index
        : a.fraction > b.fraction
          ? -1
          : 1,
    );
  for (const { index } of order)
    if (remainder > 0 && amounts[index] < capacities[index]) {
      amounts[index]++;
      remainder--;
    }
  return amounts;
}

export function allocateQuarterRefund(
  total: number,
  interest: readonly number[],
  tax: readonly number[],
): number[] {
  const base = interest.map((value, index) => Math.min(value, tax[index]));
  const baseTotal = base.reduce((a, b) => a + b, 0);
  if (baseTotal >= total) return allocateAmount(total, base);
  const extra = allocateAmount(
    total - baseTotal,
    interest.map((value, index) => value - base[index]),
  );
  return base.map((value, index) => value + extra[index]);
}
