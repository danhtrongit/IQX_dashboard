/**
 * Shared number formatting utilities
 * Uses dot (.) as thousand separator, no unnecessary decimals
 */

/**
 * Format number with dot as thousand separator
 * @param num - Number to format
 * @param decimals - Number of decimal places (default: 0)
 */
export function formatNumber(num: number | string | null | undefined, decimals = 0): string {
  if (num === null || num === undefined) return '—';

  const value = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(value)) return '—';

  // Round to specified decimals
  const rounded = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();

  // Split integer and decimal parts
  const [intPart, decPart] = rounded.split('.');

  // Add dot as thousand separator to integer part
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  // Return with decimal part if exists and not all zeros
  if (decPart && parseInt(decPart) !== 0) {
    // Remove trailing zeros from decimal
    const trimmedDec = decPart.replace(/0+$/, '');
    return trimmedDec ? `${formattedInt},${trimmedDec}` : formattedInt;
  }

  return formattedInt;
}

/**
 * Format price in VND (multiply by 1000 for display)
 * @param price - Price in thousands (e.g., 74.5 = 74,500 VND)
 */
export function formatPrice(price: number | string | null | undefined): string {
  if (price === null || price === undefined) return '—';

  const value = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(value)) return '—';

  return formatNumber(value * 1000);
}

/**
 * Format price with VND suffix
 */
export function formatPriceVND(price: number | string | null | undefined): string {
  const formatted = formatPrice(price);
  return formatted === '—' ? formatted : `${formatted} VND`;
}

/**
 * Format percent change
 * @param value - Percent value
 * @param showSign - Whether to show + sign for positive values
 */
export function formatPercent(value: number | string | null | undefined, showSign = true): string {
  if (value === null || value === undefined) return '—';

  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '—';

  const sign = showSign && num > 0 ? '+' : '';

  // Format with up to 2 decimals, remove trailing zeros
  const formatted = num.toFixed(2).replace(/\.?0+$/, '');

  return `${sign}${formatted}%`;
}

/**
 * Format ratio (P/E, P/B, etc.) - keep decimals if meaningful
 */
export function formatRatio(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '—';

  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '—';

  // Format with 2 decimals, remove trailing zeros
  return num.toFixed(2).replace(/\.?0+$/, '');
}

/**
 * Format large numbers with suffix (K, M, B, T or Vietnamese equivalents)
 * @param value - Number to format
 * @param options - Formatting options
 */
export function formatCompact(
  value: number | string | null | undefined,
  options: {
    vietnamese?: boolean;
    decimals?: number;
  } = {}
): string {
  if (value === null || value === undefined) return '—';

  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '—';

  const { vietnamese = false, decimals = 0 } = options;
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (absNum >= 1e12) {
    const formatted = formatNumber(absNum / 1e12, decimals);
    return `${sign}${formatted}${vietnamese ? ' nghìn tỷ' : 'T'}`;
  }
  if (absNum >= 1e9) {
    const formatted = formatNumber(absNum / 1e9, decimals);
    return `${sign}${formatted}${vietnamese ? ' tỷ' : 'B'}`;
  }
  if (absNum >= 1e6) {
    const formatted = formatNumber(absNum / 1e6, decimals);
    return `${sign}${formatted}${vietnamese ? ' triệu' : 'M'}`;
  }
  if (absNum >= 1e3) {
    const formatted = formatNumber(absNum / 1e3, decimals);
    return `${sign}${formatted}${vietnamese ? ' nghìn' : 'K'}`;
  }

  return `${sign}${formatNumber(absNum, decimals)}`;
}

/**
 * Format market cap
 */
export function formatMarketCap(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '—';

  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '—';

  return formatCompact(num, { vietnamese: true });
}

/**
 * Format volume
 */
export function formatVolume(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '—';

  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '—';

  return formatNumber(num);
}

/**
 * Format currency with optional sign
 */
export function formatCurrency(
  value: number | string | null | undefined,
  options: { showSign?: boolean; compact?: boolean } = {}
): string {
  if (value === null || value === undefined) return '—';

  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '—';

  const sign = options.showSign && num > 0 ? '+' : '';

  if (options.compact) {
    return `${sign}${formatCompact(num)}`;
  }

  return `${sign}${formatNumber(num)}`;
}
