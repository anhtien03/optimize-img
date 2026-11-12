import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import './ImageComparison.css';

interface ImageComparisonProps {
  originalSrc: string;
  processedSrc: string | null;
  originalLabel?: string;
  processedLabel?: string;
}

export const ImageComparison: React.FC<ImageComparisonProps> = ({
  originalSrc,
  processedSrc,
  originalLabel = 'Gốc (Original)',
  processedLabel = 'Sau nén (Optimized)',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPosition, setSliderPosition] = useState(50); // percentage 0 - 100
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);

  // Pan & Zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const startPanPos = useRef({ x: 0, y: 0 });

  // Reset zoom & pan when image changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSliderPosition(50);
  }, [originalSrc]);

  // Handle Slider Dragging
  const handleSliderMove = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPosition(percentage);
    },
    []
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingSlider) {
        handleSliderMove(e.clientX);
      } else if (isPanning) {
        setPan({
          x: e.clientX - startPanPos.current.x,
          y: e.clientY - startPanPos.current.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDraggingSlider(false);
      setIsPanning(false);
    };

    if (isDraggingSlider || isPanning) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSlider, isPanning, handleSliderMove]);

  // Zoom controls
  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.max(0.2, Math.min(5, Number((prev + delta).toFixed(2)))));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 0.15 : -0.15;
    handleZoom(zoomFactor);
  };

  // Start panning on middle-click or right-click or Alt+Drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.altKey || (e.button === 0 && e.target === containerRef.current)) {
      e.preventDefault();
      setIsPanning(true);
      startPanPos.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  return (
    <div
      className="comparison-viewport"
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
    >
      {/* Zoom / Viewport Toolbar */}
      <div className="viewport-controls">
        <button title="Phóng to (Zoom in)" onClick={() => handleZoom(0.25)}>
          <ZoomIn size={16} />
        </button>
        <span className="zoom-indicator">{Math.round(zoom * 100)}%</span>
        <button title="Thu nhỏ (Zoom out)" onClick={() => handleZoom(-0.25)}>
          <ZoomOut size={16} />
        </button>
        <button title="Đặt lại hiển thị (Reset View)" onClick={resetView}>
          <Maximize2 size={16} />
        </button>
      </div>

      {/* Floating Labels */}
      <div className="badge-comparison-label label-left">{originalLabel}</div>
      <div className="badge-comparison-label label-right">{processedLabel}</div>

      {/* Image Stage */}
      <div
        className="image-canvas-wrapper"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        {/* Right side: Processed / Optimized Image */}
        <img
          src={processedSrc || originalSrc}
          alt="Optimized"
          className="comp-img img-processed"
          draggable={false}
        />

        {/* Left side: Original Image clipped by slider position */}
        <div
          className="img-original-wrapper"
          style={{
            clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
          }}
        >
          <img
            src={originalSrc}
            alt="Original"
            className="comp-img img-original"
            draggable={false}
          />
        </div>

        {/* The Split Divider Handle */}
        <div
          className="slider-divider"
          style={{ left: `${sliderPosition}%` }}
          onMouseDown={(e) => {
            e.stopPropagation();
            setIsDraggingSlider(true);
          }}
        >
          <div className="slider-line" />
          <div className="slider-handle">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M8.5 7l-5 5 5 5V7zm7 10l5-5-5-5v10z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
