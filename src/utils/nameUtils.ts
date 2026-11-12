/**
 * Utility functions for image naming and batch sequential renaming
 */

export function getBaseName(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, '').trim();
}

export function getExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop() || '' : '';
}

/**
 * Generate sequential names for a batch of images.
 * Examples:
 * - basePattern = "name-card-ep-kim", count = 3
 *   => ["name-card-ep-kim", "name-card-ep-kim-2", "name-card-ep-kim-3"]
 * 
 * - basePattern = "name-card-ep-kim-1", count = 3
 *   => ["name-card-ep-kim-1", "name-card-ep-kim-2", "name-card-ep-kim-3"]
 * 
 * - basePattern = "name-card_01", count = 3
 *   => ["name-card_01", "name-card_02", "name-card_03"]
 */
export function generateBatchNames(
  basePattern: string,
  count: number,
  options?: {
    forceNumberOnFirst?: boolean;
    separator?: '-' | '_' | ' ';
  }
): string[] {
  const cleanBase = getBaseName(basePattern) || 'image';
  if (count <= 0) return [];
  if (count === 1) return [cleanBase];

  // Check if base ends with a delimiter and number, e.g. "photo-1", "banner_02", "card 1"
  const trailingNumRegex = /^(.*?)([-_ ])0*(\d+)$/;
  const match = cleanBase.match(trailingNumRegex);

  if (match) {
    const prefix = match[1];
    const sep = match[2];
    const rawDigits = cleanBase.match(/^(.*?)([-_ ])(\d+)$/)?.[3] || '1';
    const startNum = parseInt(rawDigits, 10);
    const padLength = rawDigits.length > 1 && rawDigits.startsWith('0') ? rawDigits.length : 0;

    return Array.from({ length: count }, (_, i) => {
      const currentNum = startNum + i;
      const numStr = padLength > 0 ? String(currentNum).padStart(padLength, '0') : String(currentNum);
      return `${prefix}${sep}${numStr}`;
    });
  }

  // If basePattern does NOT have trailing numbers (e.g. "name-card-ep-kim")
  const sep = options?.separator || '-';

  if (options?.forceNumberOnFirst) {
    return Array.from({ length: count }, (_, i) => `${cleanBase}${sep}${i + 1}`);
  }

  // Natural style: 1st image is base, subsequent images have -2, -3, -4...
  return Array.from({ length: count }, (_, i) => {
    if (i === 0) return cleanBase;
    return `${cleanBase}${sep}${i + 1}`;
  });
}
