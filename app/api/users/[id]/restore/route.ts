import { NextResponse } from "next/server";
import { userService } from "@/lib/services/UserService";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await userService.restoreUser(params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
