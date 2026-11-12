import type { CompressOptions, ResizeOptions, ProcessedImageResult, DimensionUnit } from '../types';

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * Convert real world print units (cm, mm, inch) to pixels based on target DPI (e.g. 300 DPI)
 */
export function convertToPixels(value: number, unit: DimensionUnit, dpi: number = 300): number {
  if (unit === 'px') return Math.round(value);
  if (unit === 'cm') return Math.round((value / 2.54) * dpi);
  if (unit === 'mm') return Math.round((value / 25.4) * dpi);
  if (unit === 'inch') return Math.round(value * dpi);
  return Math.round(value);
}

/**
 * Convert pixels to real world print units (cm, mm, inch) based on target DPI
 */
export function convertFromPixels(pixels: number, unit: DimensionUnit, dpi: number = 300): number {
  if (unit === 'px') return pixels;
  if (unit === 'cm') return parseFloat(((pixels / dpi) * 2.54).toFixed(2));
  if (unit === 'mm') return parseFloat(((pixels / dpi) * 25.4).toFixed(1));
  if (unit === 'inch') return parseFloat((pixels / dpi).toFixed(2));
  return pixels;
}

/**
 * High-performance 3x3 convolution sharpening filter
 * Enhances micro-contrast, edge definition, and reduces blurriness from resizing
 * amount: 0 to 100
 */
export function applySharpen(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  amount: number
): void {
  if (amount <= 0 || width <= 0 || height <= 0) return;

  const strength = (amount / 100) * 0.9;
  if (strength <= 0) return;

  const imgData = ctx.getImageData(0, 0, width, height);
  const src = imgData.data;
  const dst = new Uint8ClampedArray(src.length);

  // Copy alpha and borders initially
  dst.set(src);

  const w = width;
  const h = height;
  const s = strength;
  const centerWeight = 1 + 4 * s;

  for (let y = 1; y < h - 1; y++) {
    const rowOffset = y * w;
    const topRowOffset = (y - 1) * w;
    const botRowOffset = (y + 1) * w;

    for (let x = 1; x < w - 1; x++) {
      const idx = (rowOffset + x) * 4;
      const topIdx = (topRowOffset + x) * 4;
      const botIdx = (botRowOffset + x) * 4;
      const leftIdx = (rowOffset + (x - 1)) * 4;
      const rightIdx = (rowOffset + (x + 1)) * 4;

      // Red
      const r =
        src[idx] * centerWeight -
        s * (src[topIdx] + src[botIdx] + src[leftIdx] + src[rightIdx]);
      dst[idx] = r < 0 ? 0 : r > 255 ? 255 : r;

      // Green
      const g =
        src[idx + 1] * centerWeight -
        s * (src[topIdx + 1] + src[botIdx + 1] + src[leftIdx + 1] + src[rightIdx + 1]);
      dst[idx + 1] = g < 0 ? 0 : g > 255 ? 255 : g;

      // Blue
      const b =
        src[idx + 2] * centerWeight -
        s * (src[topIdx + 2] + src[botIdx + 2] + src[leftIdx + 2] + src[rightIdx + 2]);
      dst[idx + 2] = b < 0 ? 0 : b > 255 ? 255 : b;

      // Alpha is kept untouched from initial set()
    }
  }

  ctx.putImageData(new ImageData(dst, width, height), 0, 0);
}

/**
 * High quality multi-step downscaling or direct canvas resizing
 */
export async function processImage(
  img: HTMLImageElement,
  resize: ResizeOptions,
  compress: CompressOptions
): Promise<ProcessedImageResult> {
  const startTime = performance.now();

  const targetWidth = resize.enabled ? Math.max(1, Math.round(resize.width)) : img.naturalWidth;
  const targetHeight = resize.enabled ? Math.max(1, Math.round(resize.height)) : img.naturalHeight;

  // Handle Rotation swap if 90 or 270 deg
  const isRotatedQuarter = resize.rotate === 90 || resize.rotate === 270;
  const canvasWidth = isRotatedQuarter ? targetHeight : targetWidth;
  const canvasHeight = isRotatedQuarter ? targetWidth : targetHeight;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  // Smooth filtering
  ctx.imageSmoothingEnabled = resize.method === 'smooth';
  ctx.imageSmoothingQuality = 'high';

  // Apply transformations
  ctx.save();
  ctx.translate(canvasWidth / 2, canvasHeight / 2);
  ctx.rotate((resize.rotate * Math.PI) / 180);
  ctx.scale(resize.flipHorizontal ? -1 : 1, resize.flipVertical ? -1 : 1);

  // Multi-step downsampling for smooth results if downscaling > 50%
  if (
    resize.method === 'smooth' &&
    targetWidth < img.naturalWidth * 0.5 &&
    targetHeight < img.naturalHeight * 0.5
  ) {
    // Step downscale
    let curWidth = img.naturalWidth;
    let curHeight = img.naturalHeight;
    let curCanvas: HTMLCanvasElement = document.createElement('canvas');
    curCanvas.width = curWidth;
    curCanvas.height = curHeight;
    let curCtx = curCanvas.getContext('2d')!;
    curCtx.drawImage(img, 0, 0);

    while (curWidth * 0.5 > targetWidth && curHeight * 0.5 > targetHeight) {
      const nextWidth = Math.floor(curWidth * 0.5);
      const nextHeight = Math.floor(curHeight * 0.5);
      const nextCanvas = document.createElement('canvas');
      nextCanvas.width = nextWidth;
      nextCanvas.height = nextHeight;
      const nextCtx = nextCanvas.getContext('2d')!;
      nextCtx.imageSmoothingEnabled = true;
      nextCtx.imageSmoothingQuality = 'high';
      nextCtx.drawImage(curCanvas, 0, 0, nextWidth, nextHeight);

      curCanvas = nextCanvas;
      curWidth = nextWidth;
      curHeight = nextHeight;
    }

    ctx.drawImage(
      curCanvas,
      -targetWidth / 2,
      -targetHeight / 2,
      targetWidth,
      targetHeight
    );
  } else {
    ctx.drawImage(
      img,
      -targetWidth / 2,
      -targetHeight / 2,
      targetWidth,
      targetHeight
    );
  }

  ctx.restore();

  // Apply sharpening filter if enabled (> 0)
  if (resize.sharpen && resize.sharpen > 0) {
    applySharpen(ctx, canvasWidth, canvasHeight, resize.sharpen);
  }

  // Compress & Output format
  let mimeType = 'image/webp';
  let quality = 0.92;

  if (!compress.enabled) {
    // Chỉ căn chỉnh kích thước / biến đổi ảnh, KHÔNG nén/giảm chất lượng:
    // Nếu ảnh có sẵn mimeType gốc (hoặc png/jpeg), giữ nguyên chất lượng cao nhất (1.0 hoặc lossless)
    mimeType = 'image/png'; // PNG bảo toàn 100% chi tiết không mất mát
    quality = 1.0;
  } else {
    if (compress.format === 'jpeg') mimeType = 'image/jpeg';
    else if (compress.format === 'png') mimeType = 'image/png';
    else if (compress.format === 'avif') mimeType = 'image/avif';
    else if (compress.format === 'webp') mimeType = 'image/webp';

    quality = compress.lossless ? 1.0 : compress.quality / 100;
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else {
          // Fallback if browser doesn't support format (e.g., avif export in older browsers)
          canvas.toBlob(
            (fallbackBlob) => {
              if (fallbackBlob) resolve(fallbackBlob);
              else reject(new Error('Failed to encode image'));
            },
            'image/webp',
            quality
          );
        }
      },
      mimeType,
      quality
    );
  });

  const dataUrl = URL.createObjectURL(blob);
  const endTime = performance.now();

  return {
    blob,
    dataUrl,
    size: blob.size,
    width: canvasWidth,
    height: canvasHeight,
    processTimeMs: Math.round(endTime - startTime),
  };
}
