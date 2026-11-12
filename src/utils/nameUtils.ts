/**
 * Utility functions for image naming, SEO slugification, and batch sequential renaming
 */

/**
 * Common Vietnamese and English domain keywords for auto-segmenting conjoined words
 * e.g. "temnhan" => "tem-nhan", "innamecard" => "in-name-card"
 */
const COMMON_SEO_WORDS = new Set([
  'catalogue', 'catalog', 'brochure', 'standee', 'voucher', 'sticker', 'backdrop',
  'decal', 'innhanh', 'thietke', 'giare',
  'name', 'card', 'danh', 'thiep', 'tem', 'nhan', 'mac', 'hop', 'giay', 'tui', 'vai',
  'bien', 'bang', 'hieu', 'poster', 'banner', 'menu', 'so', 'tay', 'lich', 'tet',
  'thiep', 'cuoi', 'hoa', 'don', 'bien', 'lai', 've', 'moi',
  'to', 'roi', 'gap', 'kep', 'file', 'folder',
  'in', 'an', 'thiet', 'ke', 'gia', 're', 'dep', 'chat', 'luong', 'cao',
  'lay', 'ngay', 'nhanh', 'tphcm', 'hanoi', 'danang', 'saigon',
  'mau', 'san', 'pham', 'logo', 'icon', 'hinh', 'anh',
  'ep', 'kim', 'dap', 'noi', 'can', 'mang', 'bong', 'mo',
]);

/**
 * Smart word segmenter: splits a concatenated token into separated words
 * e.g. "temnhan" => "tem-nhan", "innamecard" => "in-name-card"
 */
export function segmentCompoundWords(slug: string): string {
  const parts = slug.split('-');

  const segmentedParts = parts.map((part) => {
    // If the part is already short (<= 3 chars) or contains numbers, leave it
    if (part.length <= 3 || /\d/.test(part)) return part;

    // If the part is already a single complete dictionary word, don't split
    if (COMMON_SEO_WORDS.has(part)) return part;

    const tokens: string[] = [];
    let i = 0;
    let anyMatch = false;

    while (i < part.length) {
      let matched: string | null = null;
      const maxLen = Math.min(12, part.length - i);

      for (let len = maxLen; len >= 2; len--) {
        const sub = part.substring(i, i + len);
        if (COMMON_SEO_WORDS.has(sub)) {
          matched = sub;
          break;
        }
      }

      if (matched) {
        tokens.push(matched);
        i += matched.length;
        anyMatch = true;
      } else {
        tokens.push(part[i]);
        i++;
      }
    }

    // Only join if we found multiple recognized words
    if (anyMatch && tokens.length > 1) {
      const cleanTokens: string[] = [];
      let tempChars = '';

      for (const t of tokens) {
        if (t.length === 1) {
          tempChars += t;
        } else {
          if (tempChars) {
            cleanTokens.push(tempChars);
            tempChars = '';
          }
          cleanTokens.push(t);
        }
      }
      if (tempChars) {
        cleanTokens.push(tempChars);
      }

      return cleanTokens.join('-');
    }

    return part;
  });

  return segmentedParts.join('-');
}

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
 * 1. Split CamelCase (e.g. "temNhan" => "tem-Nhan")
 * 2. Remove Vietnamese accents and special characters
 * 3. Lowercase all letters
 * 4. Replace spaces, dots, commas, semicolons, and special characters with hyphens '-'
 * 5. Merge duplicate consecutive hyphens '--' into single '-'
 * 6. Trim leading and trailing hyphens
 * 7. Smart word segmentation for conjoined lowercase words (e.g. "temnhan" => "tem-nhan")
 * 
 * Examples:
 * - "tem...nhan,,dep..;moi!" => "tem-nhan-dep-moi"
 * - "temnhan" => "tem-nhan"
 * - "temNhanDecal" => "tem-nhan-decal"
 * - "Báo Giá Thiết Kế Name Card (Đẹp Nhất) 2026.png" => "bao-gia-thiet-ke-name-card-dep-nhat-2026"
 */
export function toSeoSlug(text: string): string {
  if (!text) return '';
  const withoutExt = getBaseName(text);

  // 1. Separate CamelCase / PascalCase words
  const camelSeparated = withoutExt.replace(/([a-z0-9])([A-Z])/g, '$1-$2');

  // 2. Remove Vietnamese accents
  const cleanAscii = removeVietnameseTones(camelSeparated).toLowerCase();

  // 3. Replace all non-alphanumeric characters (including .,;:_!@#$%^&*) with hyphens
  let slug = cleanAscii.replace(/[^a-z0-9]+/g, '-');

  // 4. Merge consecutive hyphens
  slug = slug.replace(/-+/g, '-');

  // 5. Trim leading and trailing hyphens
  slug = slug.replace(/^-+|-+$/g, '');

  // 6. Smart word segmentation for conjoined words like "temnhan" => "tem-nhan"
  slug = segmentCompoundWords(slug);

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
