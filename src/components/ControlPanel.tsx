import React from 'react';
import type { 
  ResizeOptions, 
  CompressOptions, 
  ImageFormat, 
  ImageMetadata, 
  ProcessedImageResult,
  DimensionUnit,
  DpiPreset
} from '../types';
import { formatFileSize, convertToPixels, convertFromPixels } from '../utils/imageProcessor';
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
  Edit3,
  Printer,
  Focus
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

  const currentUnit: DimensionUnit = resize.unit || 'px';
  const currentDpi: DpiPreset = resize.dpi || 300;

  // Display values for input based on selected unit
  const displayWidth = currentUnit === 'px'
    ? resize.width
    : convertFromPixels(resize.width, currentUnit, currentDpi);

  const displayHeight = currentUnit === 'px'
    ? resize.height
    : convertFromPixels(resize.height, currentUnit, currentDpi);

  const handleDisplayWidthChange = (val: number) => {
    const pxWidth = currentUnit === 'px' ? Math.max(1, Math.round(val)) : convertToPixels(val, currentUnit, currentDpi);
    if (resize.maintainAspectRatio && metadata.originalWidth > 0) {
      const ratio = metadata.originalHeight / metadata.originalWidth;
      onResizeChange({ width: pxWidth, height: Math.max(1, Math.round(pxWidth * ratio)) });
    } else {
      onResizeChange({ width: pxWidth });
    }
  };

  const handleDisplayHeightChange = (val: number) => {
    const pxHeight = currentUnit === 'px' ? Math.max(1, Math.round(val)) : convertToPixels(val, currentUnit, currentDpi);
    if (resize.maintainAspectRatio && metadata.originalHeight > 0) {
      const ratio = metadata.originalWidth / metadata.originalHeight;
      onResizeChange({ height: pxHeight, width: Math.max(1, Math.round(pxHeight * ratio)) });
    } else {
      onResizeChange({ height: pxHeight });
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
            {/* Unit & DPI Mode Bar */}
            <div className="unit-dpi-bar">
              <div className="unit-selector">
                <span className="unit-title">Đơn vị:</span>
                {(['px', 'cm', 'mm'] as DimensionUnit[]).map((u) => (
                  <button
                    key={u}
                    type="button"
                    className={`unit-pill-btn ${currentUnit === u ? 'active' : ''}`}
                    onClick={() => onResizeChange({ unit: u })}
                  >
                    {u}
                  </button>
                ))}
              </div>

              {currentUnit !== 'px' && (
                <div className="dpi-selector">
                  <Printer size={13} className="dpi-icon" />
                  <span className="dpi-title">DPI:</span>
                  {([72, 150, 300] as DpiPreset[]).map((d) => (
                    <button
                      key={d}
                      type="button"
                      className={`dpi-pill-btn ${currentDpi === d ? 'active' : ''}`}
                      onClick={() => onResizeChange({ dpi: d })}
                      title={d === 300 ? 'Chuẩn in ấn sắc nét chất lượng cao' : d === 72 ? 'Màn hình/Web' : 'In thường'}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Print Presets when in cm/mm mode or 300 DPI */}
            {currentUnit !== 'px' && (
              <div className="print-presets-box">
                <span className="print-preset-title">Mẫu kích thước chuẩn 300 DPI:</span>
                <div className="print-preset-chips">
                  <button
                    type="button"
                    className="print-chip"
                    onClick={() => {
                      const w = convertToPixels(9, 'cm', currentDpi);
                      const h = convertToPixels(5.4, 'cm', currentDpi);
                      onResizeChange({ width: w, height: h, maintainAspectRatio: false });
                    }}
                  >
                    📇 Name card (9×5.4cm)
                  </button>
                  <button
                    type="button"
                    className="print-chip"
                    onClick={() => {
                      const w = convertToPixels(5, 'cm', currentDpi);
                      const h = convertToPixels(5, 'cm', currentDpi);
                      onResizeChange({ width: w, height: h, maintainAspectRatio: false });
                    }}
                  >
                    🏷️ Tem vuông (5×5cm)
                  </button>
                  <button
                    type="button"
                    className="print-chip"
                    onClick={() => {
                      const w = convertToPixels(14.8, 'cm', currentDpi);
                      const h = convertToPixels(21, 'cm', currentDpi);
                      onResizeChange({ width: w, height: h, maintainAspectRatio: false });
                    }}
                  >
                    📄 Tờ rơi A5
                  </button>
                </div>
              </div>
            )}

            <div className="dimension-inputs">
              <div className="input-group">
                <label>Rộng (W)</label>
                <div className="input-with-unit">
                  <input
                    type="number"
                    min="0.1"
                    step={currentUnit === 'px' ? '1' : '0.1'}
                    value={displayWidth}
                    onChange={(e) => handleDisplayWidthChange(Number(e.target.value))}
                  />
                  <span>{currentUnit}</span>
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
                    min="0.1"
                    step={currentUnit === 'px' ? '1' : '0.1'}
                    value={displayHeight}
                    onChange={(e) => handleDisplayHeightChange(Number(e.target.value))}
                  />
                  <span>{currentUnit}</span>
                </div>
              </div>
            </div>

            {/* Display actual pixels info when in cm/mm */}
            {currentUnit !== 'px' && (
              <div className="actual-pixels-info">
                <span>Quy đổi: <b>{resize.width} × {resize.height} px</b> (ở {currentDpi} DPI)</span>
              </div>
            )}

            {/* Scale Presets (including zoom up 150%, 200%) */}
            <div className="preset-buttons">
              {[0.5, 0.75, 1, 1.5, 2].map((scale) => (
                <button
                  key={scale}
                  className={`preset-btn ${scale > 1 ? 'scale-up-btn' : ''}`}
                  onClick={() => {
                    if (onScalePreset) {
                      onScalePreset(scale);
                    } else {
                      const w = Math.round(metadata.originalWidth * scale);
                      const h = Math.round(metadata.originalHeight * scale);
                      onResizeChange({ width: w, height: h });
                    }
                  }}
                  title={scale > 1 ? `Phóng to ${scale * 100}%` : `Thu nhỏ ${scale * 100}%`}
                >
                  {scale * 100}% {scale > 1 ? '▲' : ''}
                </button>
              ))}
            </div>

            {/* SHARPENING & ANTI-BLUR FILTER */}
            <div className="sharpen-control-card">
              <div className="sharpen-header">
                <div className="sharpen-title">
                  <Focus size={15} className="sharpen-icon" />
                  <span>Làm nét & Khử mờ (Sharpen)</span>
                </div>
                <span className={`sharpen-badge ${(resize.sharpen || 0) > 0 ? 'active' : ''}`}>
                  {(resize.sharpen || 0) === 0 ? 'Tắt' : `${resize.sharpen}%`}
                </span>
              </div>

              <div className="sharpen-slider-wrapper">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={resize.sharpen || 0}
                  onChange={(e) => onResizeChange({ sharpen: Number(e.target.value) })}
                  className="sharpen-range-slider"
                />
              </div>

              <div className="sharpen-preset-pills">
                {[
                  { label: 'Gốc (0%)', val: 0 },
                  { label: 'Nhẹ (25%)', val: 25 },
                  { label: 'Nét (50%)', val: 50 },
                  { label: 'Siêu nét (80%)', val: 80 },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    className={`sharpen-pill ${(resize.sharpen || 0) === preset.val ? 'active' : ''}`}
                    onClick={() => onResizeChange({ sharpen: preset.val })}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <p className="sharpen-help-tip">
                💡 Tăng độ nét ở viền chi tiết, giúp tem nhãn, logo và chữ in rõ cạnh hơn khi phóng to.
              </p>
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
