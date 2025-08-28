'use server'

import { uploadBase64Image } from '@/lib/file-utils'

export async function uploadProfileImage(base64Data: string) {
  try {
    return await uploadBase64Image(base64Data, 'profile')
  } catch (error) {
    console.error('Upload failed:', error)
    throw new Error('Failed to upload image')
  }
}