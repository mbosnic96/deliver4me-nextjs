import mongoose from 'mongoose';
import CMSContentModel, { ICMSContent } from '@/lib/models/CMSContent';
import { CMSContent } from '@/lib/types/cms';
import { dbConnect } from '@/lib/db/db';

async function ensureDbConnection() {
  if (mongoose.connection.readyState === 0) {
    await dbConnect();
  }
}

export async function getCMSContents(): Promise<CMSContent[]> {
  try {
    await ensureDbConnection();

    const contents = await CMSContentModel.find({ isActive: true }).sort({ order: 1 }).lean();

    return contents as unknown as CMSContent[];
  } catch (error) {
    console.error('Error fetching CMS contents:', error);
    return [];
  }
}

export async function getContentByType(type: string): Promise<CMSContent | null> {
  try {
    await ensureDbConnection();
    const content = await CMSContentModel.findOne({ type, isActive: true }).lean();
    return content as unknown as CMSContent | null;
  } catch (error) {
    console.error(`Error fetching CMS content for type "${type}":`, error);
    return null;
  }
}
