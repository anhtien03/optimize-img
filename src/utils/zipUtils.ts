import JSZip from 'jszip';
import type { ImageItem } from '../types';

export interface ZipExportOptions {
  zipFileName?: string;
  includeOptimizeSuffix?: boolean;
}

export async function exportImagesAsZip(
  items: ImageItem[],
  onProgress?: (percent: number, currentFileName: string) => void,
  options?: ZipExportOptions
): Promise<void> {
  const zip = new JSZip();

  const validItems = items.filter((item) => item.processedResult?.blob);

  if (validItems.length === 0) {
    throw new Error('Chưa có ảnh nào được xử lý thành công.');
  }

  const nameCountMap: Record<string, number> = {};

  validItems.forEach((item, index) => {
    const ext = item.compress.enabled
      ? item.compress.format === 'jpeg'
        ? 'jpg'
        : item.compress.format
      : item.name.split('.').pop() || 'png';

    const baseName = item.name.replace(/\.[^/.]+$/, '');
    const suffix = options?.includeOptimizeSuffix
      ? item.compress.enabled
        ? '-optimized'
        : '-resized'
      : '';

    let finalFileName = `${baseName}${suffix}.${ext}`;

    if (nameCountMap[finalFileName]) {
      nameCountMap[finalFileName]++;
      finalFileName = `${baseName}${suffix}-${nameCountMap[finalFileName]}.${ext}`;
    } else {
      nameCountMap[finalFileName] = 1;
    }

    if (item.processedResult?.blob) {
      zip.file(finalFileName, item.processedResult.blob);
    }

    if (onProgress) {
      onProgress(Math.round(((index + 1) / validItems.length) * 50), item.name);
    }
  });

  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      if (onProgress) {
        onProgress(50 + Math.round(metadata.percent * 0.5), 'Đang nén file zip...');
      }
    }
  );

  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = url;

  // Derive zip download name cleanly without "optimized-"
  const firstBase = validItems[0]?.name.replace(/\.[^/.]+$/, '') || 'images';
  const cleanZipName = options?.zipFileName
    ? options.zipFileName.replace(/\.zip$/i, '')
    : options?.includeOptimizeSuffix
    ? `optimized-${firstBase}`
    : firstBase;

  link.download = `${cleanZipName}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 10000);
}
