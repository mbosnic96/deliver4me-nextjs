import { NextResponse } from "next/server";
import Review from "@/lib/models/Review";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const loadId = searchParams.get("loadId");
  const userId = searchParams.get("userId");

  if (!loadId || !userId) {
    return NextResponse.json({ hasReviewed: false });
  }

  const existing = await Review.findOne({ loadId, fromUserId: userId });
  return NextResponse.json({ hasReviewed: !!existing });
}
