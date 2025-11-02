import { CMSContent } from '@/lib/types/cms';
import { Button } from '@/components/ui/button';

interface HeroSectionProps {
  data: CMSContent;
  className?: string;
  style?: React.CSSProperties;
}

export default function HeroSection({ data, className = '', style }: HeroSectionProps) {
  const { title, subtitle, content, metadata } = data;
  
  const getTextColorClass = () => {
    if (metadata?.textColor === '#ffffff') return 'text-white';
    if (metadata?.textColor === '#000000') return 'text-gray-900';
    if (style?.backgroundColor && isColorDark(style.backgroundColor)) {
      return 'text-white';
    }
    return 'text-gray-900';
  };

  const textColorClass = getTextColorClass();

  return (
    <section 
      className={`min-h-screen flex items-center justify-center relative ${className}`}
      style={style}
    >
      {content.backgroundImage && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('${content.backgroundImage}')` }}
        >
          <div className="absolute inset-0 bg-black/30"></div>
        </div>
      )}
      
      <div className={`container mx-auto px-4 text-center relative z-10 ${textColorClass}`}>
        <h1 className="text-5xl md:text-7xl font-bold mb-6">
          {title || 'Dobrodošli!'}
        </h1>
        {subtitle && (
        <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
          {subtitle}
        </p>
        )}
        {content.ctaText && (
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            className={`px-8 py-3 text-lg ${
              textColorClass.includes('white') 
                ? 'bg-white text-gray-900 hover:bg-gray-100' 
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
            asChild
          >
            <a href={content.ctaLink || '/'}>
              {content.ctaText}
            </a>
          </Button>
        </div>
        )}
      </div>
    </section>
  );
}

function isColorDark(color: string): boolean {
  if (!color || color === 'transparent') return false;
  
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