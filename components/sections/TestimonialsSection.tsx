'use client';

import { useRef, useEffect } from 'react';
import { CMSContent } from '@/lib/types/cms';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';

interface TestimonialsSectionProps {
  data: CMSContent;
  className?: string;
  style?: React.CSSProperties;
}

interface Testimonial {
  name: string;
  role: string;
  text: string;
  avatar?: string;
  rating?: number;
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

export default function TestimonialsSection({ data, className = '', style }: TestimonialsSectionProps) {
  const { title, subtitle, content, metadata } = data;
  const testimonials: Testimonial[] = content.items || [];
  const navigationPrevRef = useRef<HTMLButtonElement>(null);
  const navigationNextRef = useRef<HTMLButtonElement>(null);
  const paginationRef = useRef<HTMLDivElement>(null);
  const bgColor = style?.backgroundColor || '#ffffff';
  const customTextColor = style?.color;
  const cardStyle = metadata?.cardStyle || 'auto-contrast';
  const isDarkBg = isColorDark(bgColor);
  let cardBg, cardTextColor, cardBorderColor;
  
  switch (cardStyle) {
    case 'light-cards':
      cardBg = 'rgba(255, 255, 255, 0.95) !important';
      cardTextColor = '#1f2937';
      cardBorderColor = 'rgba(0, 0, 0, 0.1) !important';
      break;
    case 'dark-cards':
      cardBg = 'rgba(0, 0, 0, 0.95)';
      cardTextColor = '#ffffff';
      cardBorderColor = 'rgba(255, 255, 255, 0.1) !important';
      break;
    case 'transparent':
      cardBg = 'rgba(255, 255, 255, 0.1)';
      cardTextColor = customTextColor || (isDarkBg ? '#ffffff' : '#1f2937');
      cardBorderColor = isDarkBg ? 'rgba(255, 255, 255, 0.2) !important' : 'rgba(0, 0, 0, 0.2) !important';
      break;
    case 'auto-contrast':
    default:
      cardBg = isDarkBg ? 'rgba(255, 255, 255, 0.95) !important' : 'rgba(0, 0, 0, 0.95) !important';
      cardTextColor = isDarkBg ? '#1f2937' : '#ffffff';
      cardBorderColor = isDarkBg ? 'rgba(255, 255, 255, 0.1) !important' : 'rgba(0, 0, 0, 0.1) !important';
      break;
  }

  const navButtonBg = isDarkBg ? 'rgba(255, 255, 255, 0.95) !important' : 'rgba(255, 255, 255, 0.95) !important';
  const navButtonText = isDarkBg ? '#1f2937' : '#1f2937';
  const navButtonHoverBg = isDarkBg ? 'rgba(255, 255, 255, 1) !important' : 'rgba(243, 244, 246, 1) !important';
  const paginationColor = isDarkBg ? 'rgba(255, 255, 255, 0.3) !important' : 'rgba(209, 213, 219, 1) !important';
  const paginationActiveColor = isDarkBg ? 'rgba(255, 255, 255, 0.9) !important' : 'rgba(59, 130, 246, 1) !important';
  const headerTextColor = customTextColor || (isDarkBg ? '#ffffff' : '#1f2937');
  const subTextColor = customTextColor || (isDarkBg ? '#e5e7eb' : '#4b5563');

  const renderStars = (rating: number = 5) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        className={i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
      />
    ));
  };

  if (testimonials.length === 0) {
    return (
      <section className={`py-16 ${className}`} style={style}>
        <div className="container mx-auto px-4 text-center">
          <p style={{ color: subTextColor }}>Nema dodanih recenzzija aplikacije.</p>
        </div>
      </section>
    );
  }

  return (
    <section className={`py-16 ${className}`} style={style}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4" style={{ color: headerTextColor }}>
            {title}
          </h2>
          {subtitle && (
          <p className="text-xl max-w-2xl mx-auto opacity-90" style={{ color: subTextColor }}>
            {subtitle}
          </p>
          )}
        </div>

        <div className="relative">
          <button
            ref={navigationPrevRef}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
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
            aria-label="Prethodni"
          >
            <ChevronLeft size={24} />
          </button>

          <button
            ref={navigationNextRef}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 z-10 w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
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
            aria-label="Sljedeči"
          >
            <ChevronRight size={24} />
          </button>

          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={30}
            slidesPerView={1}
            breakpoints={{
              640: {
                slidesPerView: 1,
                spaceBetween: 20,
              },
              768: {
                slidesPerView: 2,
                spaceBetween: 30,
              },
              1024: {
                slidesPerView: 3,
                spaceBetween: 30,
              },
            }}
            navigation={{
              prevEl: navigationPrevRef.current,
              nextEl: navigationNextRef.current,
            }}
            pagination={{
              clickable: true,
              el: paginationRef.current,
              renderBullet: function (index, className) {
                return `<span class="${className}" style="background-color: ${paginationColor} !important"></span>`;
              },
            }}
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
            }}
            loop={testimonials.length > 3}
            onInit={(swiper) => {
              // @ts-ignore
              swiper.params.navigation.prevEl = navigationPrevRef.current;
              // @ts-ignore
              swiper.params.navigation.nextEl = navigationNextRef.current;
              // @ts-ignore
              swiper.params.pagination.el = paginationRef.current;
              swiper.navigation.init();
              swiper.navigation.update();
              swiper.pagination.init();
              swiper.pagination.update();
            }}
          >
            {testimonials.map((testimonial: Testimonial, index: number) => (
              <SwiperSlide key={index}>
                <Card 
                  className="border-0 shadow-lg h-full mx-2 backdrop-blur-sm transition-all duration-300 hover:shadow-xl"
                  style={{
                    backgroundColor: cardBg,
                    border: `1px solid ${cardBorderColor}`,
                  }}
                >
                  <CardContent className="p-6 h-full flex flex-col">
                    <div className="mb-4 text-center flex justify-center gap-1">
                      {renderStars(testimonial.rating)}
                    </div>
                    <blockquote 
                      className="italic mb-6 flex-grow text-center opacity-90"
                      style={{ color: cardTextColor }}
                    >
                      "{testimonial.text}"
                    </blockquote>
                    <div className="flex items-center gap-3 justify-center mt-auto">
                      {testimonial.avatar && (
                        <img 
                          src={testimonial.avatar} 
                          alt={testimonial.name}
                          className="w-12 h-12 rounded-full object-cover border-2"
                          style={{ borderColor: cardBorderColor }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <div className="text-center">
                        <p 
                          className="font-semibold"
                          style={{ color: cardTextColor }}
                        >
                          {testimonial.name}
                        </p>
                        <p 
                          className="text-sm opacity-90"
                          style={{ color: cardTextColor }}
                        >
                          {testimonial.role}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </SwiperSlide>
            ))}
          </Swiper>

          <div 
            ref={paginationRef} 
            className="flex justify-center gap-2 mt-8 !bottom-0"
            style={{
              '--swiper-pagination-color': paginationActiveColor,
              '--swiper-pagination-bullet-inactive-color': paginationColor,
            } as React.CSSProperties}
          />
        </div>
      </div>
    </section>
  );
}