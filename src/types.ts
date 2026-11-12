export type ImageFormat = 'webp' | 'jpeg' | 'png' | 'avif';

export type ResizeMethod = 'smooth' | 'pixelated';

export type DimensionUnit = 'px' | 'cm' | 'mm' | 'inch';
export type DpiPreset = 72 | 150 | 300;

export interface ResizeOptions {
  enabled: boolean;
  width: number;
  height: number;
  maintainAspectRatio: boolean;
  method: ResizeMethod;
  rotate: 0 | 90 | 180 | 270;
  flipHorizontal: boolean;
  flipVertical: boolean;
  sharpen: number; // 0 - 100 (0 = off)
  unit?: DimensionUnit;
  dpi?: DpiPreset;
}

export interface CompressOptions {
  enabled: boolean;
  format: ImageFormat;
  quality: number; // 1 - 100
  lossless: boolean;
}

export interface ImageMetadata {
  name: string;
  type: string;
  size: number;
  originalWidth: number;
  originalHeight: number;
  dataUrl: string;
}

export interface ProcessedImageResult {
  blob: Blob;
  dataUrl: string;
  size: number;
  width: number;
  height: number;
  processTimeMs: number;
}

export interface ImageItem {
  id: string;
  name: string;
  type: string;
  size: number;
  originalWidth: number;
  originalHeight: number;
  dataUrl: string;
  imageElement: HTMLImageElement;
  resize: ResizeOptions;
  compress: CompressOptions;
  processedResult: ProcessedImageResult | null;
  isProcessing: boolean;
  status: 'idle' | 'processing' | 'done' | 'error';
  errorMessage?: string;
}

export type BatchDimensionMode = 'exact' | 'scale' | 'maxWidth';
