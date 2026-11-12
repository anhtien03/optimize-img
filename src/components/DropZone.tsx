import React, { useRef, useState } from 'react';
import { UploadCloud, Sparkles, ShieldCheck, Zap, Layers } from 'lucide-react';
import './DropZone.css';

interface DropZoneProps {
  onImagesSelect: (files: File[]) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({ onImagesSelect }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith('image/')
      );
      if (files.length > 0) {
        onImagesSelect(files);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).filter((file) =>
        file.type.startsWith('image/')
      );
      if (files.length > 0) {
        onImagesSelect(files);
      }
    }
  };

  // Sample image loader for instant testing with multiple images
  const handleLoadSampleBatch = async () => {
    const createSample = (
      width: number,
      height: number,
      title: string,
      subtitle: string,
      colors: [string, string, string],
      filename: string
    ): Promise<File> => {
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;

        // Background gradient
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, colors[0]);
        grad.addColorStop(0.5, colors[1]);
        grad.addColorStop(1, colors[2]);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Radial glow or decoration
        const radial = ctx.createRadialGradient(
          width / 2,
          height / 2,
          50,
          width / 2,
          height / 2,
          Math.min(width, height) * 0.45
        );
        radial.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
        radial.addColorStop(0.5, 'rgba(139, 92, 246, 0.15)');
        radial.addColorStop(1, 'transparent');
        ctx.fillStyle = radial;
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, Math.min(width, height) * 0.45, 0, Math.PI * 2);
        ctx.fill();

        // Decorative grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 2;
        const step = Math.min(width, height) / 10;
        for (let x = 0; x < width; x += step) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += step) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Text
        const titleFontSize = Math.max(28, Math.round(width / 32));
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.font = `bold ${titleFontSize}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(title, width / 2, height / 2 - 15);

        const subFontSize = Math.max(16, Math.round(titleFontSize * 0.45));
        ctx.font = `${subFontSize}px Inter, sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillText(subtitle, width / 2, height / 2 + titleFontSize * 0.8);

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], filename, { type: 'image/png' }));
          }
        }, 'image/png');
      });
    };

    const [img1, img2, img3] = await Promise.all([
      createSample(
        1920,
        1080,
        'Banner Phong Cảnh 1080p',
        'Squoosh Pro • 1920 × 1080 Full HD',
        ['#0f172a', '#1e1b4b', '#312e81'],
        'demo-scenery-1080p.png'
      ),
      createSample(
        1200,
        1200,
        'Ảnh Vuông Social 1200px',
        'Tối ưu hóa ảnh đại diện & avatar',
        ['#18181b', '#3f3f46', '#71717a'],
        'demo-square-profile.png'
      ),
      createSample(
        1600,
        900,
        'Thiết Kế Đồ Họa Neon Glow',
        'Chuyển đổi WebP & nén chất lượng cao',
        ['#022c22', '#065f46', '#047857'],
        'demo-graphic-neon.png'
      ),
    ]);

    onImagesSelect([img1, img2, img3]);
  };

  return (
    <div className="dropzone-container">
      <div
        className={`dropzone-card ${isDragOver ? 'drag-active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="image/*"
          multiple
          onChange={handleFileInput}
        />

        <div className="dropzone-icon-wrapper">
          <UploadCloud className="upload-icon" />
          <div className="icon-glow" />
        </div>

        <h2 className="dropzone-title">Kéo & Thả ảnh vào đây</h2>
        <p className="dropzone-subtitle">
          hoặc <span className="highlight-text">nhấp để chọn một hoặc nhiều ảnh</span> từ máy tính của bạn
        </p>

        <div className="dropzone-badge-list">
          <span className="badge">WebP</span>
          <span className="badge">MozJPEG</span>
          <span className="badge">PNG</span>
          <span className="badge">AVIF</span>
          <span className="badge" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
            Hỗ trợ chọn nhiều ảnh
          </span>
        </div>

        <div className="dropzone-actions" onClick={(e) => e.stopPropagation()}>
          <button className="sample-btn" onClick={handleLoadSampleBatch}>
            <Sparkles size={16} />
            Dùng thử bộ 3 ảnh mẫu demo
          </button>
        </div>
      </div>

      {/* Feature highlights below */}
      <div className="features-grid">
        <div className="feature-item">
          <Layers className="feature-icon" size={20} />
          <div>
            <h4>Xử lý hàng loạt (Batch)</h4>
            <p>Chọn nhiều ảnh cùng lúc, xem trước so sánh và tải về trọn bộ ZIP 1 cú nhấp.</p>
          </div>
        </div>
        <div className="feature-item">
          <ShieldCheck className="feature-icon" size={20} />
          <div>
            <h4>Bảo mật 100% Client-Side</h4>
            <p>Ảnh được nén trực tiếp trong trình duyệt, không tải lên server nào.</p>
          </div>
        </div>
        <div className="feature-item">
          <Zap className="feature-icon" size={20} />
          <div>
            <h4>Tốc độ xử lý siêu nhanh</h4>
            <p>Tối ưu dung lượng đến 90%, giữ trọn độ sắc nét với thuật toán làm mịn đa bước.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
