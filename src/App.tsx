import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { DropZone } from './components/DropZone';
import { TopBar } from './components/TopBar';
import { ImageComparison } from './components/ImageComparison';
import { ControlPanel } from './components/ControlPanel';
import { BatchImageList } from './components/BatchImageList';
import type { 
  ImageItem, 
  ResizeOptions, 
  CompressOptions, 
  ImageMetadata 
} from './types';
import { loadImage, processImage } from './utils/imageProcessor';
import { exportImagesAsZip } from './utils/zipUtils';
import { generateBatchNames } from './utils/nameUtils';
import './App.css';

export function App() {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [applyToAll, setApplyToAll] = useState<boolean>(true);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [batchRenameEnabled, setBatchRenameEnabled] = useState<boolean>(true);
  const [batchPattern, setBatchPattern] = useState<string>('');
  const [includeOptimizeSuffix, setIncludeOptimizeSuffix] = useState<boolean>(false);
  const [forceNumberOnFirst, setForceNumberOnFirst] = useState<boolean>(false);

  // Derive active item
  const activeIndex = useMemo(() => {
    if (!activeId) return 0;
    const idx = items.findIndex((i) => i.id === activeId);
    return idx >= 0 ? idx : 0;
  }, [items, activeId]);

  const activeItem = items[activeIndex] || null;

  // Active base file name (without extension)
  const activeBaseName = useMemo(() => {
    return activeItem ? activeItem.name.replace(/\.[^/.]+$/, '') : '';
  }, [activeItem]);

  // Preview batch names for the list
  const previewBatchNames = useMemo(() => {
    if (items.length === 0) return [];
    const pattern =
      batchPattern ||
      (activeItem ? activeItem.name.replace(/\.[^/.]+$/, '').replace(/[-_ ]0*\d+$/, '') : 'image');
    return generateBatchNames(pattern, items.length, { forceNumberOnFirst });
  }, [batchPattern, activeItem, items.length, forceNumberOnFirst]);

  // Handle renaming (single or batch)
  const handleFileNameChange = useCallback(
    (rawName: string) => {
      if (!activeItem) return;

      const cleanInput = rawName.replace(/\.[^/.]+$/, '').trimStart();

      if (batchRenameEnabled && items.length > 1) {
        setBatchPattern(cleanInput);
        const effectiveBase = cleanInput || 'image';
        const batchNames = generateBatchNames(effectiveBase, items.length, { forceNumberOnFirst });
        setItems((prev) =>
          prev.map((item, idx) => {
            const ext = item.name.includes('.') ? item.name.split('.').pop() : '';
            const extStr = ext ? `.${ext}` : '';
            return {
              ...item,
              name: `${batchNames[idx] || effectiveBase}${extStr}`,
            };
          })
        );
      } else {
        setItems((prev) =>
          prev.map((item) => {
            if (item.id === activeItem.id) {
              const ext = item.name.includes('.') ? item.name.split('.').pop() : '';
              const extStr = ext ? `.${ext}` : '';
              return {
                ...item,
                name: `${cleanInput}${extStr}`,
              };
            }
            return item;
          })
        );
      }
    },
    [activeItem, batchRenameEnabled, items.length, forceNumberOnFirst]
  );

  const handleBatchRenameToggle = (enabled: boolean) => {
    setBatchRenameEnabled(enabled);
    if (enabled && items.length > 1) {
      const pattern =
        batchPattern ||
        (activeItem ? activeItem.name.replace(/\.[^/.]+$/, '').replace(/[-_ ]0*\d+$/, '') : 'image');
      setBatchPattern(pattern);
      const batchNames = generateBatchNames(pattern, items.length, { forceNumberOnFirst });
      setItems((prev) =>
        prev.map((item, idx) => {
          const ext = item.name.includes('.') ? item.name.split('.').pop() : '';
          const extStr = ext ? `.${ext}` : '';
          return {
            ...item,
            name: `${batchNames[idx]}${extStr}`,
          };
        })
      );
    }
  };

  const handleToggleForceNumberOnFirst = (val: boolean) => {
    setForceNumberOnFirst(val);
    if (batchRenameEnabled && items.length > 1) {
      const pattern =
        batchPattern ||
        (activeItem ? activeItem.name.replace(/\.[^/.]+$/, '').replace(/[-_ ]0*\d+$/, '') : 'image');
      const batchNames = generateBatchNames(pattern, items.length, { forceNumberOnFirst: val });
      setItems((prev) =>
        prev.map((item, idx) => {
          const ext = item.name.includes('.') ? item.name.split('.').pop() : '';
          const extStr = ext ? `.${ext}` : '';
          return {
            ...item,
            name: `${batchNames[idx]}${extStr}`,
          };
        })
      );
    }
  };

  // Process a single item and return its updated object
  const processSingleItem = useCallback(
    async (item: ImageItem, customResize?: ResizeOptions, customCompress?: CompressOptions): Promise<ImageItem> => {
      const resizeOpts = customResize || item.resize;
      const compressOpts = customCompress || item.compress;

      try {
        const result = await processImage(item.imageElement, resizeOpts, compressOpts);
        return {
          ...item,
          resize: resizeOpts,
          compress: compressOpts,
          processedResult: result,
          isProcessing: false,
          status: 'done',
          errorMessage: undefined,
        };
      } catch (err: any) {
        console.error('Error optimizing image:', item.name, err);
        return {
          ...item,
          resize: resizeOpts,
          compress: compressOpts,
          isProcessing: false,
          status: 'error',
          errorMessage: err?.message || 'Lỗi khi xử lý ảnh',
        };
      }
    },
    []
  );

  // Debounce processing timers
  const processTimerRef = useRef<number | null>(null);

  // Trigger processing for active item and background queue
  const triggerBatchProcessing = useCallback(
    (
      currentItems: ImageItem[],
      targetActiveId: string,
      shouldApplyToAll: boolean,
      newResizeForActive?: Partial<ResizeOptions>,
      newCompressForActive?: Partial<CompressOptions>
    ) => {
      if (processTimerRef.current) {
        window.clearTimeout(processTimerRef.current);
      }

      processTimerRef.current = window.setTimeout(async () => {
        const currentActive = currentItems.find((i) => i.id === targetActiveId) || currentItems[0];
        if (!currentActive) return;

        const updatedActiveResize: ResizeOptions = {
          ...currentActive.resize,
          ...newResizeForActive,
        };
        const updatedActiveCompress: CompressOptions = {
          ...currentActive.compress,
          ...newCompressForActive,
        };

        // 1. Mark items as processing
        setItems((prev) =>
          prev.map((item) => {
            if (item.id === currentActive.id || shouldApplyToAll) {
              return { ...item, isProcessing: true };
            }
            return item;
          })
        );

        // 2. Process active item first for instant user feedback
        const processedActive = await processSingleItem(
          currentActive,
          updatedActiveResize,
          updatedActiveCompress
        );

        setItems((prev) =>
          prev.map((item) => (item.id === processedActive.id ? processedActive : item))
        );

        // 3. If applyToAll is enabled, process other items asynchronously
        if (shouldApplyToAll && currentItems.length > 1) {
          const others = currentItems.filter((i) => i.id !== currentActive.id);
          
          for (const item of others) {
            let itemResize: ResizeOptions = {
              ...item.resize,
              enabled: updatedActiveResize.enabled,
              method: updatedActiveResize.method,
              rotate: updatedActiveResize.rotate,
              flipHorizontal: updatedActiveResize.flipHorizontal,
              flipVertical: updatedActiveResize.flipVertical,
              maintainAspectRatio: updatedActiveResize.maintainAspectRatio,
            };

            // Calculate dimensions proportionally if maintaining aspect ratio and dimensions changed
            if (newResizeForActive?.width || newResizeForActive?.height) {
              if (itemResize.maintainAspectRatio && currentActive.originalWidth > 0) {
                const scale = (updatedActiveResize.width || currentActive.originalWidth) / currentActive.originalWidth;
                itemResize.width = Math.max(1, Math.round(item.originalWidth * scale));
                itemResize.height = Math.max(1, Math.round(item.originalHeight * scale));
              } else {
                itemResize.width = updatedActiveResize.width;
                itemResize.height = updatedActiveResize.height;
              }
            }

            const itemCompress: CompressOptions = {
              ...updatedActiveCompress,
            };

            const processedOther = await processSingleItem(item, itemResize, itemCompress);
            setItems((prev) =>
              prev.map((it) => (it.id === processedOther.id ? processedOther : it))
            );
          }
        }
      }, 150);
    },
    [processSingleItem]
  );

  // Handle image(s) selection
  const handleImagesSelect = async (files: File[]) => {
    if (files.length === 0) return;

    const baseCompress: CompressOptions = activeItem
      ? { ...activeItem.compress }
      : {
          enabled: true,
          format: 'webp',
          quality: 75,
          lossless: false,
        };

    const newItems: ImageItem[] = [];

    for (const file of files) {
      const dataUrl = URL.createObjectURL(file);
      try {
        const img = await loadImage(dataUrl);
        const id = `img-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

        const item: ImageItem = {
          id,
          name: file.name,
          type: file.type,
          size: file.size,
          originalWidth: img.naturalWidth,
          originalHeight: img.naturalHeight,
          dataUrl,
          imageElement: img,
          resize: {
            enabled: true,
            width: img.naturalWidth,
            height: img.naturalHeight,
            maintainAspectRatio: true,
            method: 'smooth',
            rotate: 0,
            flipHorizontal: false,
            flipVertical: false,
          },
          compress: { ...baseCompress },
          processedResult: null,
          isProcessing: true,
          status: 'idle',
        };

        newItems.push(item);
      } catch (err) {
        console.error('Failed to load file', file.name, err);
      }
    }

    if (newItems.length === 0) {
      alert('Không thể đọc các file ảnh đã chọn. Vui lòng chọn file ảnh hợp lệ.');
      return;
    }

    if (!batchPattern || items.length === 0) {
      const initialBase = files[0].name.replace(/\.[^/.]+$/, '').replace(/[-_ ]0*\d+$/, '') || 'image';
      setBatchPattern(initialBase);
    }

    const combinedItems = [...items, ...newItems];
    setItems(combinedItems);

    if (!activeId || items.length === 0) {
      setActiveId(newItems[0].id);
    }

    // Process new items in background
    for (const item of newItems) {
      processSingleItem(item).then((processed) => {
        setItems((prev) =>
          prev.map((it) => (it.id === processed.id ? processed : it))
        );
      });
    }
  };

  // Change Resize options
  const handleResizeChange = (updated: Partial<ResizeOptions>) => {
    if (!activeItem) return;

    const updatedActiveResize = { ...activeItem.resize, ...updated };
    setItems((prev) =>
      prev.map((it) => (it.id === activeItem.id ? { ...it, resize: updatedActiveResize } : it))
    );

    triggerBatchProcessing(items, activeItem.id, applyToAll, updated);
  };

  // Change Compress options
  const handleCompressChange = (updated: Partial<CompressOptions>) => {
    if (!activeItem) return;

    const updatedActiveCompress = { ...activeItem.compress, ...updated };
    setItems((prev) =>
      prev.map((it) => (it.id === activeItem.id ? { ...it, compress: updatedActiveCompress } : it))
    );

    triggerBatchProcessing(items, activeItem.id, applyToAll, undefined, updated);
  };

  // Preset percentage scale (25%, 50%, 75%, 100%)
  const handleScalePreset = (scale: number) => {
    if (!activeItem) return;

    if (applyToAll) {
      setItems((prev) =>
        prev.map((it) => {
          const w = Math.round(it.originalWidth * scale);
          const h = Math.round(it.originalHeight * scale);
          return {
            ...it,
            resize: {
              ...it.resize,
              enabled: true,
              width: w,
              height: h,
            },
            isProcessing: true,
          };
        })
      );

      // Trigger batch re-process
      setTimeout(() => {
        items.forEach((it) => {
          const w = Math.round(it.originalWidth * scale);
          const h = Math.round(it.originalHeight * scale);
          processSingleItem(it, { ...it.resize, enabled: true, width: w, height: h }).then(
            (res) => {
              setItems((prev) => prev.map((item) => (item.id === res.id ? res : item)));
            }
          );
        });
      }, 50);
    } else {
      const w = Math.round(activeItem.originalWidth * scale);
      const h = Math.round(activeItem.originalHeight * scale);
      handleResizeChange({ width: w, height: h });
    }
  };

  // Download single processed image without forced "optimized" suffix
  const handleDownloadSingle = (targetItem?: ImageItem) => {
    const item = targetItem || activeItem;
    if (!item || !item.processedResult) return;

    const link = document.createElement('a');
    let ext = 'png';

    if (item.compress.enabled) {
      ext = item.compress.format === 'jpeg' ? 'jpg' : item.compress.format;
    } else {
      ext = item.name.split('.').pop() || 'png';
    }

    const baseName = item.name.replace(/\.[^/.]+$/, '');
    const suffix = includeOptimizeSuffix
      ? item.compress.enabled
        ? '-optimized'
        : '-resized'
      : '';

    link.download = `${baseName}${suffix}.${ext}`;
    link.href = item.processedResult.dataUrl;
    link.click();
  };

  // Download all as ZIP without forced "optimized" prefix/folder
  const handleDownloadAllZip = async () => {
    if (items.length === 0) return;
    setIsZipping(true);
    try {
      const firstBase = items[0]?.name.replace(/\.[^/.]+$/, '') || 'images';
      await exportImagesAsZip(items, undefined, {
        zipFileName: firstBase,
        includeOptimizeSuffix,
      });
    } catch (err: any) {
      console.error('Error generating zip:', err);
      alert(err?.message || 'Có lỗi xảy ra khi tạo file zip.');
    } finally {
      setIsZipping(false);
    }
  };

  // Remove a single image
  const handleRemoveItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const itemToRemove = items.find((i) => i.id === id);
    if (itemToRemove) {
      URL.revokeObjectURL(itemToRemove.dataUrl);
      if (itemToRemove.processedResult?.dataUrl) {
        URL.revokeObjectURL(itemToRemove.processedResult.dataUrl);
      }
    }

    const remaining = items.filter((i) => i.id !== id);
    setItems(remaining);

    if (activeId === id) {
      if (remaining.length > 0) {
        setActiveId(remaining[0].id);
      } else {
        setActiveId(null);
      }
    }
  };

  // Reset all
  const handleReset = () => {
    items.forEach((item) => {
      URL.revokeObjectURL(item.dataUrl);
      if (item.processedResult?.dataUrl) {
        URL.revokeObjectURL(item.processedResult.dataUrl);
      }
    });
    setItems([]);
    setActiveId(null);
    setBatchPattern('');
  };

  // Navigation between images
  const handlePrevImage = () => {
    if (activeIndex > 0) {
      setActiveId(items[activeIndex - 1].id);
    }
  };

  const handleNextImage = () => {
    if (activeIndex < items.length - 1) {
      setActiveId(items[activeIndex + 1].id);
    }
  };

  // Keyboard navigation & paste support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        handlePrevImage();
      } else if (e.key === 'ArrowRight') {
        handleNextImage();
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        const files = Array.from(e.clipboardData.files).filter((file) =>
          file.type.startsWith('image/')
        );
        if (files.length > 0) {
          handleImagesSelect(files);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('paste', handlePaste);
    };
  }, [activeIndex, items]);

  // If no images loaded, show DropZone
  if (items.length === 0 || !activeItem) {
    return <DropZone onImagesSelect={handleImagesSelect} />;
  }

  const activeMetadata: ImageMetadata = {
    name: activeItem.name,
    type: activeItem.type,
    size: activeItem.size,
    originalWidth: activeItem.originalWidth,
    originalHeight: activeItem.originalHeight,
    dataUrl: activeItem.dataUrl,
  };

  return (
    <div className="app-container">
      <TopBar
        metadata={activeMetadata}
        currentIndex={activeIndex}
        totalCount={items.length}
        onPrevImage={handlePrevImage}
        onNextImage={handleNextImage}
        onAddMore={handleImagesSelect}
        onReset={handleReset}
        onRename={handleFileNameChange}
      />

      <main className="editor-layout">
        <ImageComparison
          originalSrc={activeItem.dataUrl}
          processedSrc={activeItem.processedResult ? activeItem.processedResult.dataUrl : null}
          originalLabel={`Gốc (${activeItem.originalWidth}×${activeItem.originalHeight})`}
          processedLabel={`${activeItem.compress.format.toUpperCase()} (${activeItem.processedResult?.width || activeItem.resize.width}×${activeItem.processedResult?.height || activeItem.resize.height})`}
        />

        <ControlPanel
          metadata={activeMetadata}
          baseFileName={batchRenameEnabled && items.length > 1 ? batchPattern : activeBaseName}
          onFileNameChange={handleFileNameChange}
          batchRenameEnabled={batchRenameEnabled}
          onBatchRenameToggle={handleBatchRenameToggle}
          includeOptimizeSuffix={includeOptimizeSuffix}
          onIncludeOptimizeSuffixChange={setIncludeOptimizeSuffix}
          forceNumberOnFirst={forceNumberOnFirst}
          onToggleForceNumberOnFirst={handleToggleForceNumberOnFirst}
          previewBatchNames={previewBatchNames}
          resize={activeItem.resize}
          compress={activeItem.compress}
          processedResult={activeItem.processedResult}
          isProcessing={activeItem.isProcessing}
          totalImagesCount={items.length}
          applyToAll={applyToAll}
          onApplyToAllChange={setApplyToAll}
          onScalePreset={handleScalePreset}
          onResizeChange={handleResizeChange}
          onCompressChange={handleCompressChange}
          onDownload={() => handleDownloadSingle(activeItem)}
          onDownloadAllZip={handleDownloadAllZip}
          isZipping={isZipping}
        />
      </main>

      {/* Filmstrip dock for multiple images */}
      <BatchImageList
        items={items}
        activeId={activeItem.id}
        isZipping={isZipping}
        onSelect={(id) => setActiveId(id)}
        onRemove={handleRemoveItem}
        onAddMore={handleImagesSelect}
        onDownloadAllZip={handleDownloadAllZip}
        onClearAll={handleReset}
        onDownloadSingle={handleDownloadSingle}
      />
    </div>
  );
}

export default App;
