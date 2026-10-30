const decimal1 = new Intl.NumberFormat("tr-TR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** 72.4 → "72,4" */
export function formatDecimal(value: number) {
  return decimal1.format(value);
}

/** 72.4 → "%72,4" (Turkish puts the percent sign first). */
export function formatPercent(value: number) {
  return `%${formatDecimal(value)}`;
}

/** 2.8 → "+2,8", -1.4 → "−1,4" (true minus sign), 0 → "0,0". */
export function formatSignedDelta(value: number) {
  const rounded = Math.round(value * 10) / 10;
  if (rounded > 0) return `+${formatDecimal(rounded)}`;
  if (rounded < 0) return `−${formatDecimal(Math.abs(rounded))}`;
  return formatDecimal(0);
}
