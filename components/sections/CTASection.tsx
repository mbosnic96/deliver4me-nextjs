'use client';
import { CMSContent } from '@/lib/types/cms';
import { Button } from '@/components/ui/button';

interface CTASectionProps {
  data: CMSContent;
  className?: string;
  style?: React.CSSProperties;
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

export default function CTASection({ data, className = '', style }: CTASectionProps) {
  const { title, subtitle, content, metadata } = data;

  const bgColor = style?.backgroundColor || '#ffffff';
  const customTextColor = style?.color;
  const isDarkBg = isColorDark(bgColor);

  const hasCustomBackground = style?.backgroundColor && style.backgroundColor !== '#ffffff' && style.backgroundColor !== 'rgb(255, 255, 255)';
  const primaryTextColor = customTextColor || (isDarkBg ? '#ffffff' : '#1f2937');
  const secondaryTextColor = customTextColor || (isDarkBg ? '#e5e7eb' : '#4b5563');
  const primaryButtonBg = isDarkBg ? '#ffffff' : '#2563eb';
  const primaryButtonText = isDarkBg ? '#1f2937' : '#ffffff';
  const primaryButtonHoverBg = isDarkBg ? '#f3f4f6' : '#1d4ed8';

  const secondaryButtonBorder = isDarkBg ? '#ffffff' : '#1f2937';
  const secondaryButtonText = isDarkBg ? '#ffffff' : '#1f2937';
  const secondaryButtonHoverBg = isDarkBg ? '#ffffff' : '#1f2937';
  const secondaryButtonHoverText = isDarkBg ? '#1f2937' : '#ffffff';

  return (
    <section className={`py-20 relative overflow-hidden ${className}`} style={style}>
      {!hasCustomBackground && (
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600 to-purple-700"></div>
          <div className="absolute top-10 left-10 w-72 h-72 bg-white/10 rounded-full mix-blend-overlay filter blur-xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-72 h-72 bg-white/5 rounded-full mix-blend-overlay filter blur-xl animate-pulse animation-delay-2000"></div>
        </div>
      )}
      
      {hasCustomBackground && (
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full mix-blend-overlay filter blur-xl animate-pulse opacity-20"
               style={{ backgroundColor: isDarkBg ? '#ffffff' : '#000000' }}></div>
          <div className="absolute bottom-10 right-10 w-72 h-72 rounded-full mix-blend-overlay filter blur-xl animate-pulse animation-delay-2000 opacity-10"
               style={{ backgroundColor: isDarkBg ? '#ffffff' : '#000000' }}></div>
        </div>
      )}
      
      <div className="container mx-auto px-4 text-center relative z-10">
        <h2 
          className="text-4xl md:text-5xl font-bold mb-6"
          style={{ 
            color: secondaryTextColor,
          }}
        >
          {title}
        </h2>
        
        {subtitle && (
        <p 
          className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto font-light opacity-90"
          style={{ color: secondaryTextColor }}
        >
          {subtitle}
        </p>
        )}
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <Button 
            size="lg" 
            className="px-10 py-4 text-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-3xl"
            style={{
              backgroundColor: primaryButtonBg,
              color: primaryButtonText,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = primaryButtonHoverBg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = primaryButtonBg;
            }}
            asChild
          >
            <a href={content.buttonLink}>
              {content.buttonText}
            </a>
          </Button>
          
          {content.secondaryButtonText && (
            <Button 
              size="lg" 
              variant="outline"
              className="px-10 py-4 text-lg font-bold transition-all duration-300 transform hover:scale-105 border-2"
              style={{
                borderColor: secondaryButtonBorder,
                color: secondaryButtonText,
                backgroundColor: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = secondaryButtonHoverBg;
                e.currentTarget.style.color = secondaryButtonHoverText;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = secondaryButtonText;
              }}
              asChild
            >
              <a href={content.secondaryButtonLink}>
                {content.secondaryButtonText}
              </a>
            </Button>
          )}
        </div>
      </div>

    </section>
  );
}