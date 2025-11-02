export interface CMSContent {
  _id: string;
  type: ContentType;
  title: string;
  subtitle?: string;
  content: any;
  isActive: boolean;
  order: number;
  metadata?: {
    backgroundColor?: string;
    textColor?: string;
    backgroundImage?: string;
    layout?: string;
     cardStyle?: 'auto-contrast' | 'light-cards' | 'dark-cards' | 'transparent';
  };
  createdAt?: string;
  updatedAt?: string;
}

export type ContentType = 
  | 'hero' 
  | 'features' 
  | 'testimonials' 
  | 'stats' 
  | 'about' 
  | 'cta' 
  | 'slider' 
  | 'gallery' 
  | 'contact';

export interface UploadedFile {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  size: number;
  mimetype: string;
  uploadedAt: string;
}

// Specific content structures
export interface HeroContent {
  ctaText: string;
  ctaLink: string;
  backgroundImage?: string;
}

export interface FeatureItem {
  title: string;
  description: string;
  icon: string;
}

export interface FeaturesContent {
  items: FeatureItem[];
}

export interface TestimonialItem {
  name: string;
  role: string;
  text: string;
  avatar?: string;
  rating?: number;
}

export interface TestimonialsContent {
  items: TestimonialItem[];
}

export interface StatItem {
  value: string;
  label: string;
  prefix?: string;
  suffix?: string;
}

export interface StatsContent {
  items: StatItem[];
}

export interface AboutContent {
  description: string;
  image?: string;
  buttonText?: string;
  buttonLink?: string;
}

export interface CtaContent {
  buttonText: string;
  buttonLink: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
}





export interface SlideItem {
  title: string;
  description: string;
  image: string;
  link?: string;
  ctaText?: string;
}

export interface SliderContent {
  slides: SlideItem[];
  autoplay?: boolean;
  interval?: number;
}

export interface GalleryImage {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
}

export interface GalleryContent {
  images: GalleryImage[];
  columns?: number;
}

export interface ContactContent {
  email: string;
  phone?: string;
  address?: string;
  formFields?: string[];
}