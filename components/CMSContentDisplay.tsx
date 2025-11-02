import { getCMSContents } from '@/lib/cms-utils';
import HeroSection from '@/components/sections/HeroSection';
import FeaturesSection from '@/components/sections/FeaturesSection';
import TestimonialsSection from '@/components/sections/TestimonialsSection';
import StatsSection from '@/components/sections/StatsSection';
import AboutSection from '@/components/sections/AboutSection';
import CTASection from '@/components/sections/CTASection';
import SliderSection from '@/components/sections/SliderSection';
import GallerySection from '@/components/sections/GallerySection';
import ContactSection from '@/components/sections/ContactSection';

export default async function CMSContentDisplay() {
  const contents = await getCMSContents();

  if (!contents || contents.length === 0) {
    return <DefaultHomepage />;
  }

  return (
    <div className="min-h-screen">
      {contents.map((content) => {
        if (!content.isActive) return null;

        const getTextColorClass = (textColor?: string) => {
          if (textColor === '#ffffff') return 'text-white';
          if (textColor === '#000000') return 'text-gray-900';
          return '';
        };

        const sectionProps = {
          key: content._id,
          data: content,
          className: getTextColorClass(content.metadata?.textColor),
          style: {
            backgroundColor: content.metadata?.backgroundColor || undefined,
            color: content.metadata?.textColor || undefined,
            backgroundImage: content.metadata?.backgroundImage
              ? `url('${content.metadata.backgroundImage}')`
              : undefined,
          },
        };

        switch (content.type) {
          case 'hero':
            return <HeroSection {...sectionProps} />;
          case 'features':
            return <FeaturesSection {...sectionProps} />;
          case 'testimonials':
            return <TestimonialsSection {...sectionProps} />;
          case 'stats':
            return <StatsSection {...sectionProps} />;
          case 'about':
            return <AboutSection {...sectionProps} />;
          case 'cta':
            return <CTASection {...sectionProps} />;
          case 'slider':
            return <SliderSection {...sectionProps} />;
          case 'gallery':
            return <GallerySection {...sectionProps} />;
          case 'contact':
            return <ContactSection {...sectionProps} />;
          default:
            return null;
        }
      })}
    </div>
  );
}

function DefaultHomepage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Dobrodošli na Vaš Website
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Počnite dodavati sadržaj putem našeg CMS-a kako biste prilagodili ovu početnu stranicu.
        </p>
        <a 
          href="/cms" 
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Idi na CMS
        </a>
      </div>
    </div>
  );
}