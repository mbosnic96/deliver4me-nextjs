import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db/db';
import CMSContent from '@/lib/models/CMSContent';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    const { items } = await request.json();
    
    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid items array' }, { status: 400 });
    }
    
    const updates = items.map((item: { id: string; order: number }) => 
      CMSContent.findByIdAndUpdate(
        item.id, 
        { order: item.order }, 
        { new: true }
      )
    );
    
    await Promise.all(updates);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}