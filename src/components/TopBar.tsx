import React, { useRef, useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Image as ImageIcon, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Edit2,
  Check
} from 'lucide-react';
import { formatFileSize } from '../utils/imageProcessor';
import type { ImageMetadata } from '../types';
import './TopBar.css';

interface TopBarProps {
  metadata: ImageMetadata;
  currentIndex: number;
  totalCount: number;
  onPrevImage?: () => void;
  onNextImage?: () => void;
  onAddMore?: (files: File[]) => void;
  onReset: () => void;
  onRename?: (newName: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ 
  metadata, 
  currentIndex, 
  totalCount,
  onPrevImage,
  onNextImage,
  onAddMore,
  onReset,
  onRename,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editValue, setEditValue] = useState<string>('');

  const baseName = metadata.name.replace(/\.[^/.]+$/, '');
  const ext = metadata.name.includes('.') ? metadata.name.split('.').pop() : '';

  useEffect(() => {
    setEditValue(baseName);
  }, [baseName]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onAddMore) {
      const files = Array.from(e.target.files).filter((file) =>
        file.type.startsWith('image/')
      );
      if (files.length > 0) {
        onAddMore(files);
      }
      e.target.value = '';
    }
  };

  const handleSaveRename = () => {
    if (editValue.trim() && onRename) {
      onRename(editValue.trim());
    }
    setIsEditing(false);
  };

  return (
    <header className="topbar">
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*"
        multiple
        onChange={handleFileChange}
      />

      <div className="topbar-left">
        <button className="back-btn" onClick={onReset} title="Quay lại màn hình tải ảnh">
          <ArrowLeft size={18} />
          <span>Làm mới</span>
        </button>

        {onAddMore && (
          <button 
            className="topbar-add-btn" 
            onClick={() => fileInputRef.current?.click()}
            title="Thêm ảnh vào danh sách"
          >
            <Plus size={16} />
            <span>Thêm ảnh</span>
          </button>
        )}

        {totalCount > 1 && (
          <div className="batch-nav-group">
            <button
              className="nav-arrow-btn"
              onClick={onPrevImage}
              disabled={currentIndex <= 0}
              title="Ảnh trước"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="batch-index-text">
              {currentIndex + 1} / {totalCount}
            </span>
            <button
              className="nav-arrow-btn"
              onClick={onNextImage}
              disabled={currentIndex >= totalCount - 1}
              title="Ảnh kế tiếp"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        <div className="file-info-badge">
          <ImageIcon size={15} className="file-icon" />

          {isEditing ? (
            <div className="topbar-rename-form">
              <input
                type="text"
                className="topbar-rename-input"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSaveRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveRename();
                  if (e.key === 'Escape') {
                    setEditValue(baseName);
                    setIsEditing(false);
                  }
                }}
                autoFocus
              />
              {ext && <span className="topbar-rename-ext">.{ext}</span>}
              <button 
                type="button" 
                className="topbar-rename-save-btn" 
                onMouseDown={handleSaveRename}
                title="Lưu tên"
              >
                <Check size={12} />
              </button>
            </div>
          ) : (
            <div 
              className="file-name-interactive" 
              onClick={() => onRename && setIsEditing(true)}
              title={onRename ? "Nhấn vào đây để sửa tên ảnh" : metadata.name}
            >
              <span className="file-name">{metadata.name}</span>
              {onRename && <Edit2 size={12} className="name-edit-icon" />}
            </div>
          )}

          <span className="file-dim">
            {metadata.originalWidth} × {metadata.originalHeight} px
          </span>
          <span className="file-size-badge">{formatFileSize(metadata.size)}</span>
        </div>
      </div>

      <div className="topbar-right">
        <div className="logo-badge">
          <span className="logo-dot" />
          <span className="brand-name">Squoosh Studio Pro</span>
        </div>
      </div>
    </header>
  );
};
