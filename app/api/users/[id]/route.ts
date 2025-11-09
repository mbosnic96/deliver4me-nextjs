import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { userService } from '@/lib/services/UserService';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const user = await userService.getUserById(id);
    
    if (!user || user.isDeleted) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    return NextResponse.json(user);
  } catch (err: any) {
    console.error("GET /api/users/[id] error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    
    if (session.user.id !== id && session.user.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden - You can only update your own profile" }, { status: 403 });
    }

    const body = await request.json();
    
    if (session.user.role !== 'admin' && body.role) {
      return NextResponse.json({ error: "Forbidden - You cannot change your own role" }, { status: 403 });
    }

    await userService.updateUser(id, body);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    
    if (session.user.id !== id && session.user.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden - You can only update your own location" }, { status: 403 });
    }

    const body = await request.json();
    await userService.updateLocation(id, body);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to update location:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Account deletion (only user themselves or admin)
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    
    if (session.user.id !== id && session.user.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden - You can only delete your own account" }, { status: 403 });
    }

    await userService.requestAccountDeletion(id); 
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}