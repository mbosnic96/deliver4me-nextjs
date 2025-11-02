import { CMSContent } from '@/lib/types/cms';

export async function getCMSContents(): Promise<CMSContent[]> {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/cms/content`, {
      next: { 
        tags: ['cms-content'] 
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch CMS content');
    }

    const contents = await response.json();
    
    return contents
      .filter((content: CMSContent) => content.isActive)
      .sort((a: CMSContent, b: CMSContent) => a.order - b.order);
  } catch (error) {
    console.error('Error fetching CMS contents:', error);
    return [];
  }
}

export async function getContentByType(type: string): Promise<CMSContent | null> {
  const contents = await getCMSContents();
  return contents.find(content => content.type === type) || null;
}