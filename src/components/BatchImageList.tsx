import React, { useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Archive, 
  RefreshCw, 
  AlertCircle,
  FileImage,
  Download
} from 'lucide-react';
import type { ImageItem } from '../types';
import { formatFileSize } from '../utils/imageProcessor';
import './BatchImageList.css';

interface BatchImageListProps {
  items: ImageItem[];
  activeId: string;
  isZipping: boolean;
  onSelect: (id: string) => void;
  onRemove: (id: string, e: React.MouseEvent) => void;
  onAddMore: (files: File[]) => void;
  onDownloadAllZip: () => void;
  onClearAll: () => void;
  onDownloadSingle?: (item: ImageItem) => void;
}

export const BatchImageList: React.FC<BatchImageListProps> = ({
  items,
  activeId,
  isZipping,
  onSelect,
  onRemove,
  onAddMore,
  onDownloadAllZip,
  onClearAll,
  onDownloadSingle,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).filter((file) =>
        file.type.startsWith('image/')
      );
      if (files.length > 0) {
        onAddMore(files);
      }
      e.target.value = ''; // Reset input to allow selecting same file again
    }
  };

  // Calculate batch metrics
  const totalOriginalSize = items.reduce((acc, item) => acc + item.size, 0);
  const totalProcessedSize = items.reduce((acc, item) => {
    return acc + (item.processedResult ? item.processedResult.size : item.size);
  }, 0);
  const totalDiff = totalOriginalSize - totalProcessedSize;
  const totalSavingPercent = totalOriginalSize > 0 
    ? Math.round((totalDiff / totalOriginalSize) * 100) 
    : 0;

  const isAnyProcessing = items.some((item) => item.isProcessing);

  return (
    <div className="batch-filmstrip-bar">
      {/* Hidden file input for adding more */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*"
        multiple
        onChange={handleFileInput}
      />

      {/* Left Info & Summary */}
      <div className="batch-summary">
        <div className="batch-counter">
          <FileImage size={16} className="text-primary" />
          <span className="count-badge">{items.length} ảnh</span>
        </div>

        <div className="batch-size-summary">
          <span className="orig-total">{formatFileSize(totalOriginalSize)}</span>
          <span className="arrow-sep">➔</span>
          <span className="proc-total">{formatFileSize(totalProcessedSize)}</span>
          {totalSavingPercent > 0 && (
            <span className="batch-saving-tag">-{totalSavingPercent}%</span>
          )}
        </div>
      </div>

      {/* Thumbnails list */}
      <div className="batch-items-scroll">
        {items.map((item, index) => {
          const isActive = item.id === activeId;
          const itemOriginalSize = item.size;
          const itemProcessedSize = item.processedResult ? item.processedResult.size : itemOriginalSize;
          const saving = itemOriginalSize > 0 
            ? Math.round(((itemOriginalSize - itemProcessedSize) / itemOriginalSize) * 100) 
            : 0;

          return (
            <div
              key={item.id}
              className={`batch-item-card ${isActive ? 'active' : ''}`}
              onClick={() => onSelect(item.id)}
              title={`${item.name} (${item.originalWidth}x${item.originalHeight})`}
            >
              <div className="thumbnail-wrapper">
                <img src={item.dataUrl} alt={item.name} className="item-thumb" />

                {item.isProcessing ? (
                  <div className="item-status-overlay processing">
                    <RefreshCw size={14} className="spin-icon" />
                  </div>
                ) : item.status === 'error' ? (
                  <div className="item-status-overlay error">
                    <AlertCircle size={14} />
                  </div>
                ) : saving > 0 ? (
                  <span className="item-saving-chip">-{saving}%</span>
                ) : null}

                {onDownloadSingle && item.processedResult && (
                  <button
                    className="item-quick-download-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownloadSingle(item);
                    }}
                    title={`Tải ảnh: ${item.name}`}
                  >
                    <Download size={11} />
                  </button>
                )}

                <button
                  className="item-delete-btn"
                  onClick={(e) => onRemove(item.id, e)}
                  title="Xóa ảnh này khỏi danh sách"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              <div className="item-info">
                <span className="item-index">#{index + 1}</span>
                <span className="item-name">{item.name}</span>
              </div>
            </div>
          );
        })}

        {/* Add more button card */}
        <button
          className="batch-add-btn"
          onClick={() => fileInputRef.current?.click()}
          title="Chọn thêm ảnh từ máy tính"
        >
          <div className="add-icon-circle">
            <Plus size={18} />
          </div>
          <span>Thêm ảnh</span>
        </button>
      </div>

      {/* Right Action buttons */}
      <div className="batch-actions">
        <button
          className="batch-zip-btn"
          onClick={onDownloadAllZip}
          disabled={isZipping || isAnyProcessing}
          title="Tải toàn bộ ảnh đã xử lý về dưới dạng file ZIP"
        >
          {isZipping ? (
            <>
              <RefreshCw size={15} className="spin-icon" />
              <span>Đang tạo ZIP...</span>
            </>
          ) : (
            <>
              <Archive size={15} />
              <span>Tải tất cả ZIP ({items.length})</span>
            </>
          )}
        </button>

        <button
          className="batch-clear-btn"
          onClick={onClearAll}
          title="Xóa toàn bộ danh sách và làm mới"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
};
