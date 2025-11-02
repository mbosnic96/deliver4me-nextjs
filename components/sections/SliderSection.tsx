'use client';

import { useState, useEffect } from 'react';
import { CMSContent } from '@/lib/types/cms';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SliderSectionProps {
  data: CMSContent;
  className?: string;
  style?: React.CSSProperties;
}

interface Slide {
  title: string;
  description: string;
  image: string;
  link?: string;
  ctaText?: string;
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

export default function SliderSection({ data, className = '', style }: SliderSectionProps) {
  const { title, subtitle, content, metadata } = data;
  const slides: Slide[] = content.slides || [];
  const [currentSlide, setCurrentSlide] = useState(0);

  const bgColor = style?.backgroundColor || '#ffffff';
  const customTextColor = style?.color;
  const isDarkBg = isColorDark(bgColor);
  const primaryTextColor = customTextColor || (isDarkBg ? '#ffffff' : '#1f2937');
  const secondaryTextColor = customTextColor || (isDarkBg ? '#e5e7eb' : '#4b5563');
  const mutedTextColor = customTextColor || (isDarkBg ? '#9ca3af' : '#6b7280');
  const buttonBg = isDarkBg ? '#ffffff' : '#000000';
  const buttonText = isDarkBg ? '#1f2937' : '#ffffff';
  const buttonHoverBg = isDarkBg ? '#f3f4f6' : '#374151';
  const navButtonBg = isDarkBg ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
  const navButtonHoverBg = isDarkBg ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)';
  const navButtonText = '#ffffff';
  const dotActive = isDarkBg ? '#ffffff' : '#ffffff'; 
  const dotInactive = isDarkBg ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.5)';

  useEffect(() => {
    if (!content.autoplay || slides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, content.interval || 5000);

    return () => clearInterval(interval);
  }, [slides.length, content.autoplay, content.interval]);

  if (slides.length === 0) {
    return (
      <section className={`py-16 ${className}`} style={style}>
        <div className="container mx-auto px-4 text-center">
          <p style={{ color: mutedTextColor }}>No slides added yet.</p>
        </div>
      </section>
    );
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <section className={`py-16 relative ${className}`} style={style}>
      <div className="container mx-auto px-4">
        {(title || subtitle) && (
          <div className="text-center mb-12">
            {title && (
              <h2 
                className="text-4xl font-bold mb-4"
                style={{ color: primaryTextColor }}
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <p 
                className="text-xl max-w-2xl mx-auto opacity-90"
                style={{ color: secondaryTextColor }}
              >
                {subtitle}
              </p>
            )}
          </div>
        )}

        <div className="relative h-96 md:h-[500px] rounded-lg overflow-hidden">
          {slides.map((slide: Slide, index: number) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-500 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white max-w-2xl px-4">
                  <h3 className="text-3xl md:text-4xl font-bold mb-4 drop-shadow-lg">
                    {slide.title}
                  </h3>
                  <p className="text-lg md:text-xl mb-6 drop-shadow-md opacity-95">
                    {slide.description}
                  </p>
                  {slide.ctaText && (
                    <Button 
                      asChild
                      className="backdrop-blur-sm border border-white/20"
                      style={{
                        backgroundColor: buttonBg,
                        color: buttonText,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = buttonHoverBg;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = buttonBg;
                      }}
                    >
                      <a href={slide.link || '#'}>
                        {slide.ctaText}
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {slides.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full transition-all duration-300 backdrop-blur-sm border border-white/20 hover:scale-110"
                style={{
                  backgroundColor: navButtonBg,
                  color: navButtonText,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = navButtonHoverBg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = navButtonBg;
                }}
                aria-label="Previous slide"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full transition-all duration-300 backdrop-blur-sm border border-white/20 hover:scale-110"
                style={{
                  backgroundColor: navButtonBg,
                  color: navButtonText,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = navButtonHoverBg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = navButtonBg;
                }}
                aria-label="Next slide"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          {slides.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 backdrop-blur-sm bg-black/30 rounded-full p-2">
              {slides.map((_: Slide, index: number) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentSlide ? 'scale-125' : 'scale-100'
                  }`}
                  style={{
                    backgroundColor: index === currentSlide ? dotActive : dotInactive,
                  }}
                  aria-label={`Go to slide ${index + 1}`}
                  aria-current={index === currentSlide ? 'true' : 'false'}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}