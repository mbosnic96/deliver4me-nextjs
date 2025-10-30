'use server';
import fs from 'fs/promises';
import path from 'path';

export async function uploadBase64Image(base64Data: string, folder: string): Promise<string> {
  const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid base64 image data');
  }

  const fileType = matches[1].split('/')[1];
  const buffer = Buffer.from(matches[2], 'base64');
  const fileName = `${Date.now()}.${fileType}`;
  
  const uploadDir = path.join(process.cwd(), 'uploads', folder);
  const filePath = path.join(uploadDir, fileName);

  try {
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(filePath, buffer);
    
    // return a dynamic route URL
    return `/api/uploads/${folder}/${fileName}`;
  } catch (error) {
    console.error('Error saving file:', error);
    throw new Error('Failed to save image');
  }
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    const uploadRoot = path.join(process.cwd(), 'uploads');
    const relativePath = filePath.replace('/api/uploads/', '');
    const fullPath = path.join(uploadRoot, relativePath);
    await fs.unlink(fullPath);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error('Failed to delete file');
  }
}