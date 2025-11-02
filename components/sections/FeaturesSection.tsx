import { CMSContent } from '@/lib/types/cms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Star, Heart, Shield, Rocket, Zap } from 'lucide-react';

interface FeaturesSectionProps {
  data: CMSContent;
  className?: string;
  style?: React.CSSProperties;
}

const getIcon = (iconName: string) => {
  const icons: { [key: string]: React.ReactNode } = {
    check: <Check className="w-8 h-8" />,
    star: <Star className="w-8 h-8" />,
    heart: <Heart className="w-8 h-8" />,
    shield: <Shield className="w-8 h-8" />,
    rocket: <Rocket className="w-8 h-8" />,
    lightning: <Zap className="w-8 h-8" />,
  };
  return icons[iconName.toLowerCase()] || <Star className="w-8 h-8" />;
};

export default function FeaturesSection({ data, className = '', style }: FeaturesSectionProps) {
  const { title, subtitle, content, metadata } = data;
  const features = content.items || [];

  const bgColor = style?.backgroundColor || '#ffffff';
  const customTextColor = style?.color;
  const cardStyle = metadata?.cardStyle || 'auto-contrast';
  const isDarkBg = isColorDark(bgColor);
  let cardBg, cardTextColor;
  
  switch (cardStyle) {
    case 'light-cards':
      cardBg = 'rgba(255, 255, 255, 0.95)';
      cardTextColor = '#1f2937';
      break;
    case 'dark-cards':
      cardBg = 'rgba(0, 0, 0, 0.95)';
      cardTextColor = '#ffffff';
      break;
    case 'transparent':
      cardBg = 'rgba(255, 255, 255, 0.1)';
      cardTextColor = customTextColor || (isDarkBg ? '#ffffff' : '#1f2937');
      break;
    case 'auto-contrast':
    default:
      cardBg = isDarkBg ? 'rgba(255, 255, 255, 0.95) !important' : 'rgba(0, 0, 0, 0.95) !important';
      cardTextColor = isDarkBg ? '#1f2937' : '#ffffff';
      break;
  }

  const headerTextColor = customTextColor || (isDarkBg ? '#ffffff' : '#1f2937');
  const subTextColor = customTextColor || (isDarkBg ? '#e5e7eb' : '#4b5563');

  return (
    <section className={`py-16 ${className}`} style={style}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4" style={{ color: headerTextColor }}>
            {title || 'Our Features'}
          </h2>
          <p className="text-xl max-w-2xl mx-auto opacity-90" style={{ color: subTextColor }}>
            {subtitle || 'Discover what makes us different'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature: any, index: number) => (
            <Card
              key={index}
              className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm hover:scale-105"
              style={{
                backgroundColor: cardBg,
                color: cardTextColor,
                border: `1px solid ${isDarkBg ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              }}
            >
              <CardHeader>
                <div className="flex justify-center mb-4" style={{ color: cardTextColor }}>
                  {getIcon(feature.icon)}
                </div>
                <CardTitle className="text-xl font-semibold" style={{ color: cardTextColor }}>
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p style={{ color: cardTextColor }} className="opacity-90">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {features.length === 0 && (
          <div className="text-center py-12">
            <p style={{ color: subTextColor }}>Nema dodanih stavki.</p>
          </div>
        )}
      </div>
    </section>
  );
}

export function isColorDark(color: string): boolean {
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