import React from 'react';
import type { 
  ResizeOptions, 
  CompressOptions, 
  ImageFormat, 
  ImageMetadata, 
  ProcessedImageResult 
} from '../types';
import { formatFileSize } from '../utils/imageProcessor';
import { 
  Download, 
  RotateCw, 
  FlipHorizontal, 
  FlipVertical, 
  Lock, 
  Unlock, 
  Sliders, 
  Layers, 
  Sparkles, 
  RefreshCw, 
  Archive,
  Edit3
} from 'lucide-react';
import './ControlPanel.css';

interface ControlPanelProps {
  metadata: ImageMetadata;
  baseFileName: string;
  onFileNameChange: (name: string) => void;
  onApplySeoSlug?: () => void;
  isSeoOptimized?: boolean;
  includeDimensionsInName: boolean;
  onIncludeDimensionsChange: (val: boolean) => void;
  batchRenameEnabled: boolean;
  onBatchRenameToggle: (val: boolean) => void;
  includeOptimizeSuffix: boolean;
  onIncludeOptimizeSuffixChange: (val: boolean) => void;
  forceNumberOnFirst: boolean;
  onToggleForceNumberOnFirst: (val: boolean) => void;
  previewBatchNames: string[];
  resize: ResizeOptions;
  compress: CompressOptions;
  processedResult: ProcessedImageResult | null;
  isProcessing: boolean;
  totalImagesCount?: number;
  applyToAll?: boolean;
  onApplyToAllChange?: (val: boolean) => void;
  onScalePreset?: (scale: number) => void;
  onResizeChange: (options: Partial<ResizeOptions>) => void;
  onCompressChange: (options: Partial<CompressOptions>) => void;
  onDownload: () => void;
  onDownloadAllZip?: () => void;
  isZipping?: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  metadata,
  baseFileName,
  onFileNameChange,
  onApplySeoSlug,
  isSeoOptimized = false,
  includeDimensionsInName,
  onIncludeDimensionsChange,
  batchRenameEnabled,
  onBatchRenameToggle,
  includeOptimizeSuffix,
  onIncludeOptimizeSuffixChange,
  forceNumberOnFirst,
  onToggleForceNumberOnFirst,
  previewBatchNames,
  resize,
  compress,
  processedResult,
  isProcessing,
  totalImagesCount = 1,
  applyToAll = true,
  onApplyToAllChange,
  onScalePreset,
  onResizeChange,
  onCompressChange,
  onDownload,
  onDownloadAllZip,
  isZipping = false,
}) => {
  // Compute size savings
  const originalSize = metadata.size;
  const processedSize = processedResult ? processedResult.size : originalSize;
  const diffBytes = originalSize - processedSize;
  const savingPercent = Math.round((diffBytes / originalSize) * 100);
  const isSmaller = diffBytes > 0;

  // Active extension
  const activeExt = compress.enabled
    ? compress.format === 'jpeg'
      ? 'jpg'
      : compress.format
    : metadata.name.split('.').pop() || 'png';

  const dimSuffix = includeDimensionsInName && processedResult
    ? `-${processedResult.width}x${processedResult.height}`
    : '';

  const downloadFileName = `${baseFileName}${dimSuffix}${
    includeOptimizeSuffix ? (compress.enabled ? '-optimized' : '-resized') : ''
  }.${activeExt}`;

  // Handle Dimension inputs with aspect ratio
  const handleWidthChange = (w: number) => {
    if (resize.maintainAspectRatio && metadata.originalWidth > 0) {
      const ratio = metadata.originalHeight / metadata.originalWidth;
      onResizeChange({ width: w, height: Math.round(w * ratio) });
    } else {
      onResizeChange({ width: w });
    }
  };

  const handleHeightChange = (h: number) => {
    if (resize.maintainAspectRatio && metadata.originalHeight > 0) {
      const ratio = metadata.originalWidth / metadata.originalHeight;
      onResizeChange({ height: h, width: Math.round(h * ratio) });
    } else {
      onResizeChange({ height: h });
    }
  };

  const handleRotate = () => {
    const nextRotate = ((resize.rotate + 90) % 360) as 0 | 90 | 180 | 270;
    onResizeChange({ rotate: nextRotate });
  };

  return (
    <aside className="control-panel">
      {/* BATCH MODE BANNER */}
      {totalImagesCount > 1 && (
        <div className="batch-mode-card">
          <div className="batch-mode-header">
            <Layers size={15} className="batch-icon" />
            <span className="batch-mode-title">Chế độ hàng loạt ({totalImagesCount} ảnh)</span>
          </div>
          <label className="batch-mode-toggle">
            <input
              type="checkbox"
              checked={applyToAll}
              onChange={(e) => onApplyToAllChange?.(e.target.checked)}
            />
            <span className="toggle-label">Áp dụng thông số kích thước & nén cho tất cả ảnh</span>
          </label>
        </div>
      )}

      {/* SECTION: FILE NAME & BATCH RENAME */}
      <div className="panel-section filename-panel-section">
        <div className="section-header">
          <div className="section-title">
            <Edit3 size={16} />
            <span>Tên file & Đặt tên hàng loạt</span>
          </div>
          {totalImagesCount > 1 && (
            <span className="batch-badge-pill">
              {batchRenameEnabled ? 'Đang bật hàng loạt' : 'Chỉ ảnh hiện tại'}
            </span>
          )}
        </div>

        <div className="section-content">
          <div className="filename-input-group">
            <div className="filename-label-row">
              <label className="input-sublabel">Tên ảnh (hoặc từ khóa SEO):</label>
              {onApplySeoSlug && (
                <button
                  type="button"
                  className="seo-slugify-btn"
                  onClick={onApplySeoSlug}
                  title="Xóa dấu tiếng Việt, chuyển chữ thường và nối dấu '-' chuẩn Google Image SEO"
                >
                  <Sparkles size={13} />
                  <span>Chuẩn hóa SEO</span>
                </button>
              )}
            </div>
            <div className="filename-input-wrapper">
              <input
                type="text"
                className="filename-input"
                value={baseFileName}
                onChange={(e) => onFileNameChange(e.target.value)}
                placeholder="Nhập tên ảnh hoặc từ khóa SEO..."
                spellCheck={false}
              />
              <span className="ext-badge">.{activeExt}</span>
            </div>
            {isSeoOptimized && baseFileName && (
              <div className="seo-indicator">
                <span className="seo-check-badge">✓ Chuẩn SEO Google</span>
              </div>
            )}
          </div>

          {totalImagesCount > 1 && (
            <div className="batch-rename-card">
              <label className="batch-toggle-label">
                <input
                  type="checkbox"
                  checked={batchRenameEnabled}
                  onChange={(e) => onBatchRenameToggle(e.target.checked)}
                />
                <span className="toggle-text">Đổi tên tự động theo thứ tự ({totalImagesCount} ảnh)</span>
              </label>

              {batchRenameEnabled && (
                <div className="numbering-style-row">
                  <span className="style-label">Quy cách:</span>
                  <button
                    type="button"
                    className={`style-pill-btn ${!forceNumberOnFirst ? 'active' : ''}`}
                    onClick={() => onToggleForceNumberOnFirst(false)}
                    title="Ảnh đầu không số, các ảnh sau -2, -3..."
                  >
                    name, name-2, ...
                  </button>
                  <button
                    type="button"
                    className={`style-pill-btn ${forceNumberOnFirst ? 'active' : ''}`}
                    onClick={() => onToggleForceNumberOnFirst(true)}
                    title="Đánh số từ 1 cho tất cả: name-1, name-2..."
                  >
                    name-1, name-2, ...
                  </button>
                </div>
              )}

              {batchRenameEnabled && previewBatchNames.length > 0 && (
                <div className="filename-preview-box">
                  <div className="preview-label-header">
                    <span>Xem trước tên file tải về:</span>
                  </div>
                  <div className="preview-chips-list">
                    {previewBatchNames.slice(0, 5).map((pName, idx) => (
                      <span key={idx} className="preview-filename-chip">
                        <b className="chip-idx">#{idx + 1}</b> {pName}{dimSuffix}.{activeExt}
                      </span>
                    ))}
                    {previewBatchNames.length > 5 && (
                      <span className="preview-more-chip">+{previewBatchNames.length - 5} ảnh nữa</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="naming-options-list">
            <div className="suffix-option-box">
              <label className="suffix-checkbox-label">
                <input
                  type="checkbox"
                  checked={includeDimensionsInName}
                  onChange={(e) => onIncludeDimensionsChange(e.target.checked)}
                />
                <span>Kèm kích thước vào tên ảnh (vd: -800x600)</span>
              </label>
              <span className="suffix-description">
                {includeDimensionsInName
                  ? 'Đang bật: tên file sẽ có thêm -[rộng]x[cao]'
                  : 'Tùy chọn: giúp nhận biết độ phân giải của ảnh nhanh chóng'}
              </span>
            </div>

            <div className="suffix-option-box">
              <label className="suffix-checkbox-label">
                <input
                  type="checkbox"
                  checked={includeOptimizeSuffix}
                  onChange={(e) => onIncludeOptimizeSuffixChange(e.target.checked)}
                />
                <span>Thêm hậu tố "-optimized" khi tải ảnh</span>
              </label>
              <span className="suffix-description">
                {!includeOptimizeSuffix 
                  ? '✨ Đang xuất tên sạch: không có chữ "optimize"'
                  : 'Đang bật: tên file tải về sẽ thêm -optimized'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: RESIZE & TRANSFORM */}
      <div className="panel-section">
        <div className="section-header">
          <div className="section-title">
            <Sliders size={16} />
            <span>Căn chỉnh kích thước (Resize)</span>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={resize.enabled}
              onChange={(e) => onResizeChange({ enabled: e.target.checked })}
            />
            <span className="slider round"></span>
          </label>
        </div>

        {resize.enabled && (
          <div className="section-content">
            <div className="dimension-inputs">
              <div className="input-group">
                <label>Rộng (W)</label>
                <div className="input-with-unit">
                  <input
                    type="number"
                    min="1"
                    value={resize.width}
                    onChange={(e) => handleWidthChange(Number(e.target.value))}
                  />
                  <span>px</span>
                </div>
              </div>

              <button
                className={`aspect-btn ${resize.maintainAspectRatio ? 'active' : ''}`}
                title="Khóa tỷ lệ khung hình"
                onClick={() =>
                  onResizeChange({ maintainAspectRatio: !resize.maintainAspectRatio })
                }
              >
                {resize.maintainAspectRatio ? <Lock size={15} /> : <Unlock size={15} />}
              </button>

              <div className="input-group">
                <label>Cao (H)</label>
                <div className="input-with-unit">
                  <input
                    type="number"
                    min="1"
                    value={resize.height}
                    onChange={(e) => handleHeightChange(Number(e.target.value))}
                  />
                  <span>px</span>
                </div>
              </div>
            </div>

            {/* Scale Presets */}
            <div className="preset-buttons">
              {[0.25, 0.5, 0.75, 1].map((scale) => (
                <button
                  key={scale}
                  className="preset-btn"
                  onClick={() => {
                    if (onScalePreset) {
                      onScalePreset(scale);
                    } else {
                      const w = Math.round(metadata.originalWidth * scale);
                      const h = Math.round(metadata.originalHeight * scale);
                      onResizeChange({ width: w, height: h });
                    }
                  }}
                >
                  {scale * 100}%
                </button>
              ))}
            </div>

            {/* Transform Controls (Rotate & Flip) */}
            <div className="transform-row">
              <button className="transform-btn" onClick={handleRotate} title="Xoay 90°">
                <RotateCw size={15} /> Xoay {resize.rotate}°
              </button>
              <button
                className={`transform-btn ${resize.flipHorizontal ? 'active' : ''}`}
                onClick={() => onResizeChange({ flipHorizontal: !resize.flipHorizontal })}
                title="Lật ngang"
              >
                <FlipHorizontal size={15} /> Lật ngang
              </button>
              <button
                className={`transform-btn ${resize.flipVertical ? 'active' : ''}`}
                onClick={() => onResizeChange({ flipVertical: !resize.flipVertical })}
                title="Lật dọc"
              >
                <FlipVertical size={15} /> Lật dọc
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: COMPRESS & FORMAT */}
      <div className="panel-section">
        <div className="section-header">
          <div className="section-title">
            <Layers size={16} />
            <span>Nén & Tối ưu dung lượng</span>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={compress.enabled}
              onChange={(e) => onCompressChange({ enabled: e.target.checked })}
            />
            <span className="slider round"></span>
          </label>
        </div>

        {!compress.enabled ? (
          <div className="uncompressed-notice">
            <p className="notice-text">
              ✨ <strong>Chế độ chỉ căn chỉnh:</strong> Giữ nguyên độ sắc nét cao nhất (Lossless 100%), không nén giảm chất lượng.
            </p>
          </div>
        ) : (
          <div className="section-content">
            {/* Format Selector Pills */}
            <div className="format-selector">
              {(['webp', 'jpeg', 'png', 'avif'] as ImageFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  className={`format-pill ${compress.format === fmt ? 'active' : ''}`}
                  onClick={() => onCompressChange({ format: fmt })}
                >
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Quality Slider (unless PNG is lossless) */}
            {compress.format !== 'png' && (
              <div className="slider-control">
                <div className="slider-label">
                  <span>Chất lượng (Quality)</span>
                  <span className="slider-val">{compress.quality}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={compress.quality}
                  onChange={(e) => onCompressChange({ quality: Number(e.target.value) })}
                />
              </div>
            )}

            {/* Effort or Lossless option for WebP / PNG */}
            {(compress.format === 'webp' || compress.format === 'png') && (
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={compress.lossless}
                  onChange={(e) => onCompressChange({ lossless: e.target.checked })}
                />
                <span>Chế độ không giảm chất lượng (Lossless)</span>
              </label>
            )}
          </div>
        )}
      </div>

      {/* SECTION 3: STATS & DOWNLOAD ACTION */}
      <div className="panel-footer">
        <div className="stats-box">
          <div className="stats-header">
            <span className="stats-tag">
              {isProcessing ? (
                <>
                  <RefreshCw size={12} className="spin-icon" /> Đang xử lý...
                </>
              ) : (
                <>
                  <Sparkles size={12} /> {compress.enabled ? 'Đã tối ưu' : 'Đã căn chỉnh'} ({processedResult?.processTimeMs || 0}ms)
                </>
              )}
            </span>
            {compress.enabled ? (
              <span className={`saving-tag ${isSmaller ? 'positive' : 'negative'}`}>
                {isSmaller ? `-${savingPercent}%` : `+${Math.abs(savingPercent)}%`}
              </span>
            ) : (
              <span className="saving-tag neutral">Nguyên bản</span>
            )}
          </div>

          <div className="stats-sizes">
            <div className="size-item">
              <span className="size-label">Gốc:</span>
              <span className="size-val">{formatFileSize(originalSize)}</span>
            </div>
            <div className="size-arrow">➔</div>
            <div className="size-item">
              <span className="size-label">{compress.enabled ? 'Sau nén:' : 'Sau xử lý:'}</span>
              <span className="size-val highlight">{formatFileSize(processedSize)}</span>
            </div>
          </div>
        </div>

        <button
          className="download-action-btn"
          onClick={onDownload}
          disabled={isProcessing}
          title={`Tải xuống: ${downloadFileName}`}
        >
          <Download size={18} />
          <div className="download-btn-label">
            <span className="download-btn-main">Tải ảnh đang chọn ({formatFileSize(processedSize)})</span>
            <span className="download-btn-filename">{downloadFileName}</span>
          </div>
        </button>

        {totalImagesCount > 1 && onDownloadAllZip && (
          <button
            className="download-zip-panel-btn"
            onClick={onDownloadAllZip}
            disabled={isZipping || isProcessing}
            title="Tải toàn bộ tất cả ảnh về dưới dạng file ZIP"
          >
            {isZipping ? (
              <>
                <RefreshCw size={16} className="spin-icon" />
                <span>Đang nén file ZIP...</span>
              </>
            ) : (
              <>
                <Archive size={16} />
                <span>Tải tất cả {totalImagesCount} ảnh (.ZIP)</span>
              </>
            )}
          </button>
        )}
      </div>
    </aside>
  );
};
