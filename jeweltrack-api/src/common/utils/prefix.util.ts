/**
 * Automatically derives smart uppercase prefixes from a jewelry shop name.
 * Examples:
 * - "Sri Meenakshi Jewellers" => invoicePrefix: "SMJ-", estimatePrefix: "SMJ-EST-", schemePrefix: "SMJ-SCH-"
 * - "Kalyan Jewellers"        => invoicePrefix: "KJ-",  estimatePrefix: "KJ-EST-",  schemePrefix: "KJ-SCH-"
 * - "Tanishq"                 => invoicePrefix: "TAN-", estimatePrefix: "TAN-EST-", schemePrefix: "TAN-SCH-"
 */
export function generateShopPrefixes(shopName?: string | null): {
  invoicePrefix: string;
  estimatePrefix: string;
  schemePrefix: string;
} {
  if (!shopName || !shopName.trim()) {
    return {
      invoicePrefix: 'BILL-',
      estimatePrefix: 'EST-',
      schemePrefix: 'GS-',
    };
  }

  // Remove special characters and split into words
  const words = shopName
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);

  let acronym = '';
  if (words.length === 1) {
    acronym = words[0].slice(0, 3).toUpperCase();
  } else {
    acronym = words.map((w) => w[0]).join('').slice(0, 4).toUpperCase();
  }

  if (!acronym || acronym.length < 2) {
    acronym = 'JW';
  }

  return {
    invoicePrefix: `${acronym}-`,
    estimatePrefix: `${acronym}-EST-`,
    schemePrefix: `${acronym}-SCH-`,
  };
}
