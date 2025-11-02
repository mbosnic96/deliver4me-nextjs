import { CMSContent } from '@/lib/types/cms';

interface StatsSectionProps {
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

export default function StatsSection({ data, className = '', style }: StatsSectionProps) {
  const { title, subtitle, content, metadata } = data;
  const stats = content.items || [];
  const bgColor = style?.backgroundColor || '#ffffff';
  const customTextColor = style?.color;
  const cardStyle = metadata?.cardStyle || 'auto-contrast';
  const isDarkBg = isColorDark(bgColor);
  let statBg, statTextColor, statValueColor, statBorderColor;
  
  switch (cardStyle) {
    case 'light-cards':
      statBg = 'rgba(255, 255, 255, 0.95) !important';
      statTextColor = '#1f2937';
      statValueColor = '#2563eb';
      statBorderColor = 'rgba(0, 0, 0, 0.1) !important';
      break;
    case 'dark-cards':
      statBg = 'rgba(0, 0, 0, 0.95)';
      statTextColor = '#ffffff';
      statValueColor = '#60a5fa'; 
      statBorderColor = 'rgba(255, 255, 255, 0.1) !important';
      break;
    case 'transparent':
      statBg = 'transparent';
      statTextColor = customTextColor || (isDarkBg ? '#ffffff' : '#1f2937');
      statValueColor = isDarkBg ? '#60a5fa' : '#2563eb';
      statBorderColor = isDarkBg ? 'rgba(255, 255, 255, 0.2) !important' : 'rgba(0, 0, 0, 0.2) !important';
      break;
    case 'auto-contrast':
    default:
      statBg = isDarkBg ? 'rgba(255, 255, 255, 0.95) !important' : 'rgba(0, 0, 0, 0.95) !important';
      statTextColor = isDarkBg ? '#1f2937' : '#ffffff';
      statValueColor = isDarkBg ? '#2563eb' : '#60a5fa';
      statBorderColor = isDarkBg ? 'rgba(255, 255, 255, 0.1) !important' : 'rgba(0, 0, 0, 0.1) !important';
      break;
  }

  const headerTextColor = customTextColor || (isDarkBg ? '#ffffff !important' : '#1f2937 !important');
  const subTextColor = customTextColor || (isDarkBg ? '#e5e7eb !important' : '#4b5563 !important');

  return (
    <section className={`py-16 ${className}`} style={style}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4" style={{ color: headerTextColor }}>
            {title || 'Our Impact'}
          </h2>
          <p className="text-xl max-w-2xl mx-auto opacity-90" style={{ color: subTextColor }}>
            {subtitle || 'Numbers that speak for themselves'}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat: any, index: number) => (
            <div 
              key={index} 
              className="text-center p-6 rounded-lg border-0 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm hover:scale-105"
              style={{
                backgroundColor: statBg,
                border: `1px solid ${statBorderColor}`,
              }}
            >
              <div 
                className="text-4xl md:text-5xl font-bold mb-2"
                style={{ color: statValueColor }}
              >
                {stat.value}{stat.suffix}
              </div>
              <p 
                className="font-medium opacity-90"
                style={{ color: statTextColor }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {stats.length === 0 && (
          <div className="text-center py-12">
            <p style={{ color: subTextColor }}>Nema dodanih statistika.</p>
          </div>
        )}
      </div>
    </section>
  );
}