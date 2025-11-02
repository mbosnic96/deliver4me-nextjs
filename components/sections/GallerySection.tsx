'use client';

import { useState, useEffect } from 'react';
import { CMSContent } from '@/lib/types/cms';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';

interface GallerySectionProps {
  data: CMSContent;
  className?: string;
  style?: React.CSSProperties;
}

interface GalleryImage {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
}

function isColorDark(color: string): boolean {
  if (!color || color === 'transparent') return false;
  if (color === 'white' || color === '#ffffff' || color === '#fff' || color === 'rgb(255, 255, 255)') return false;
  if (color === 'black' || color === '#000000' || color === '#000' || color === 'rgb(0, 0, 0)') return true;
  if (color === '#1c2434' || color === '#0f172a') return true; 
  if (color === '#f8fafc' || color === '#f1f5f9') return false; 
  
  if (color.startsWith('rgb')) {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      const r = parseInt(match[1]);
      const g = parseInt(match[2]);
      const b = parseInt(match[3]);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance < 0.6;
    }
  }
  
  const hex = color.replace('#', '');
  const fullHex = hex.length === 3 
    ? hex.split('').map(c => c + c).join('')
    : hex;
  
  try {
    const r = parseInt(fullHex.substr(0, 2), 16);
    const g = parseInt(fullHex.substr(2, 2), 16);
    const b = parseInt(fullHex.substr(4, 2), 16);
    
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.6;
  } catch {
    return false;
  }
}

export default function GallerySection({ data, className = '', style }: GallerySectionProps) {
  const { title, subtitle, content, metadata } = data;
  const images: GalleryImage[] = content.images || [];
  const columns = Number(content.columns) || 3;
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const bgColor = style?.backgroundColor || '#ffffff';
  const customTextColor = style?.color;
  const isDarkBg = isColorDark(bgColor);
  const primaryTextColor = customTextColor || (isDarkBg ? '#ffffff' : '#1f2937');
  const secondaryTextColor = customTextColor || (isDarkBg ? '#e5e7eb' : '#4b5563');
  const mutedTextColor = customTextColor || (isDarkBg ? '#9ca3af' : '#6b7280');
  const imageCardBg = isDarkBg ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)';
  const imageBorderColor = isDarkBg ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  const gridMap: Record<number, string> = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
  };

  const gridClass = gridMap[columns] || gridMap[3];

  useEffect(() => {
    if (selectedImage !== null && images[selectedImage]) {
      const img = new Image();
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height });
      };
      img.src = images[selectedImage].src;
    }
  }, [selectedImage, images]);

  const openLightbox = (index: number) => {
    setSelectedImage(index);
    setIsModalOpen(true);
    setImageDimensions(null); 
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (selectedImage === null) return;
    
    if (direction === 'next') {
      const nextIndex = (selectedImage + 1) % images.length;
      setSelectedImage(nextIndex);
      setImageDimensions(null);
    } else {
      const prevIndex = (selectedImage - 1 + images.length) % images.length;
      setSelectedImage(prevIndex);
      setImageDimensions(null);
    }
  };

  const getModalImageStyle = () => {
    if (!imageDimensions) return {};
    
    const viewportWidth = window.innerWidth * 0.9;
    const viewportHeight = window.innerHeight * 0.9; 
    
    const aspectRatio = imageDimensions.width / imageDimensions.height;
    
    let width = imageDimensions.width;
    let height = imageDimensions.height;
    
    if (width > viewportWidth) {
      width = viewportWidth;
      height = width / aspectRatio;
    }
    
    if (height > viewportHeight) {
      height = viewportHeight;
      width = height * aspectRatio;
    }
    
    return {
      width: `${width}px`,
      height: `${height}px`,
      maxWidth: '100%',
      maxHeight: '100%'
    };
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isModalOpen) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          navigateImage('prev');
          break;
        case 'ArrowRight':
          navigateImage('next');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, selectedImage]);

  return (
    <>
      <section className={`py-16 ${className}`} style={style}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 
              className="text-4xl font-bold mb-4"
              style={{ color: primaryTextColor }}
            >
              {title || 'Gallery'}
            </h2>
            {subtitle && (
            <p 
              className="text-xl max-w-2xl mx-auto opacity-90"
              style={{ color: secondaryTextColor }}
            >
              {subtitle || 'Take a look at our work'}
            </p>
            )}
          </div>

          <div className={`grid ${gridClass} gap-4`}>
            {images.map((image: GalleryImage, index: number) => (
              <div 
                key={index} 
                className="group relative overflow-hidden rounded-xl cursor-pointer transform transition-all duration-300 hover:scale-[1.02]"
                style={{
                  backgroundColor: imageCardBg,
                  border: `1px solid ${imageBorderColor}`,
                }}
                onClick={() => openLightbox(index)}
              >
                <div className="aspect-square overflow-hidden rounded-xl">
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                </div>

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-300 flex items-center justify-center">
                  <div className="transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 text-center">
                    <ZoomIn className="w-8 h-8 text-white mb-2 mx-auto" />
                    {image.caption && (
                      <p className="text-white text-sm font-medium px-4">
                        {image.caption}
                      </p>
                    )}
                  </div>
                </div>

                {image.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 md:hidden">
                    <p className="text-white text-sm">{image.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {images.length === 0 && (
            <div className="text-center py-12">
              <p style={{ color: mutedTextColor }}>
                No images added yet.
              </p>
            </div>
          )}
        </div>
      </section>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="fixed z-50 flex items-center justify-center bg-black/95 p-4 border-0">
          {selectedImage !== null && (
            <div className="relative w-full h-full flex items-center justify-center">
             
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => navigateImage('prev')}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 z-50 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors border border-white/20"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => navigateImage('next')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 z-50 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors border border-white/20"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              <div className="absolute top-4 left-4 z-50 bg-black/50 text-white px-3 py-2 rounded-full text-sm border border-white/20">
                {selectedImage + 1} / {images.length}
              </div>

              <div className="flex items-center justify-center w-full h-full p-4">
                <div className="relative max-w-full max-h-full flex items-center justify-center">
                  {!imageDimensions ? (
                    <div className="w-32 h-32 bg-gray-700 rounded-lg animate-pulse flex items-center justify-center">
                      <div className="text-white">Učitavanje...</div>
                    </div>
                  ) : (
                    <>
                      <img
                        src={images[selectedImage].src}
                        alt={images[selectedImage].alt}
                        className="rounded-lg shadow-2xl"
                        style={getModalImageStyle()}
                      />

                      {images[selectedImage].caption && (
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-6 py-3 rounded-lg max-w-2xl text-center backdrop-blur-sm">
                          <p className="text-base font-medium">{images[selectedImage].caption}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {!imageDimensions && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white text-lg">Učitavanje...</div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

   
    </>
  );
}