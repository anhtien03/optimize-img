import type { CompressOptions, ResizeOptions, ProcessedImageResult } from '../types';

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
