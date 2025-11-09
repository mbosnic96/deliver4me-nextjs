import { CMSContent } from '@/lib/types/cms';
import { Button } from '@/components/ui/button';

interface AboutSectionProps {
  data: CMSContent;
  className?: string;
  style?: React.CSSProperties;
}

export default function AboutSection({ data, className = '', style }: AboutSectionProps) {
  const { title, subtitle, content } = data;

  const hasCustomBackground = style?.backgroundColor && style.backgroundColor !== '#ffffff';
  const primaryColor = style?.color || (hasCustomBackground ? '#ffffff' : '#1f2937'); 
  const secondaryColor = style?.color || (hasCustomBackground ? '#e5e7eb' : '#4b5563'); 
  const bodyColor = style?.color || (hasCustomBackground ? '#d1d5db' : '#374151'); 

  return (
    <section className={`py-16 ${className}`} style={style}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {content.image && (
            <div className="order-2 lg:order-1">
              <img 
                src={content.image} 
                alt={title || 'About us'}
                className="rounded-lg shadow-xl w-full h-96 object-contain"
              />
            </div>
          )}
          
       
          <div className={`order-1 lg:order-2 ${!content.image ? 'lg:col-span-2 text-center' : ''}`}>
            <h2 
              className="text-4xl font-bold mb-4"
              style={{ color: primaryColor }}
            >
              {title || 'O nama'}
            </h2>
            
            {content.subtitle && (
            <p 
              className="text-xl mb-6 opacity-90"
              style={{ color: secondaryColor }}
            >
              {subtitle}
            </p>
            )}

            {content.description && (
            <div 
              className="prose prose-lg mb-8"
              style={{ color: bodyColor }}
            >
              {content.description?.split('\n').map((paragraph: string, index: number) => (
                <p key={index} className="mb-4 opacity-90">{paragraph}</p>
              ))}
            </div>
            )}
            
            {content.buttonText && (
              <Button 
                size="lg" 
                asChild
                className='bg-blue-700 hover:bg-blue-800 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:ring-offset-2'
              >
                <a href={content.buttonLink}>
                  {content.buttonText}
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}