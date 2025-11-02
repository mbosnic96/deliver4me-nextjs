import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db/db';
import CMSContent from '@/lib/models/CMSContent';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function GET() {
  try {
    await dbConnect();
    const contents = await CMSContent.find().sort({ order: 1 });
    return NextResponse.json(contents);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    const body = await request.json();
    
    const lastContent = await CMSContent.findOne().sort({ order: -1 });
    const nextOrder = lastContent ? lastContent.order + 1 : 0;
    
    const content = await CMSContent.create({
      ...body,
      order: nextOrder
    });
    
    return NextResponse.json(content);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}