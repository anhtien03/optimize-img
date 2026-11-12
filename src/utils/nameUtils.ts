/**
 * Utility functions for image naming, SEO slugification, and batch sequential renaming
 */

/**
 * Remove Vietnamese accents / diacritics and convert to clean ASCII
 */
export function removeVietnameseTones(str: string): string {
  if (!str) return '';
  let result = str.trim();

  // Convert Vietnamese 'đ' / 'Đ' to 'd' / 'D'
  result = result.replace(/đ/g, 'd').replace(/Đ/g, 'D');

  // Decompose accented characters and strip diacritical marks
  result = result.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  return result;
}

/**
 * Convert any string or file name into a Google Image SEO-friendly slug
 * Rules:
 * 1. Remove Vietnamese accents and special characters
 * 2. Lowercase all letters
 * 3. Replace spaces, underscores, dots, and special characters with hyphens '-'
 * 4. Merge duplicate consecutive hyphens '--' into '-'
 * 5. Trim leading and trailing hyphens
 * 
 * Examples:
 * - "Báo Giá Thiết Kế Name Card (Đẹp Nhất) 2026.png" => "bao-gia-thiet-ke-name-card-dep-nhat-2026"
 * - "Ảnh-chụp__Sản phẩm mới #01!" => "anh-chup-san-pham-moi-01"
 */
export function toSeoSlug(text: string): string {
  if (!text) return '';
  const withoutExt = getBaseName(text);
  const cleanAscii = removeVietnameseTones(withoutExt).toLowerCase();

  // Replace all non-alphanumeric characters with hyphens
  let slug = cleanAscii.replace(/[^a-z0-9]+/g, '-');

  // Replace multiple consecutive hyphens with a single hyphen
  slug = slug.replace(/-+/g, '-');

  // Trim leading and trailing hyphens
  slug = slug.replace(/^-+|-+$/g, '');

  return slug || 'image';
}

export function getBaseName(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, '').trim();
}

export function getExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop() || '' : '';
}

/**
 * Generate sequential names for a batch of images with SEO support.
 * Examples:
 * - basePattern = "name-card-ep-kim", count = 3
 *   => ["name-card-ep-kim", "name-card-ep-kim-2", "name-card-ep-kim-3"]
 * 
 * - basePattern = "name-card-ep-kim-1", count = 3
 *   => ["name-card-ep-kim-1", "name-card-ep-kim-2", "name-card-ep-kim-3"]
 */
export function generateBatchNames(
  basePattern: string,
  count: number,
  options?: {
    forceNumberOnFirst?: boolean;
    separator?: '-' | '_' | ' ';
    seoOptimized?: boolean;
  }
): string[] {
  let cleanBase = getBaseName(basePattern) || 'image';

  if (options?.seoOptimized) {
    cleanBase = toSeoSlug(cleanBase);
  }

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
