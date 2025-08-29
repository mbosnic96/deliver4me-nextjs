import { NextResponse } from "next/server";
import Review from "@/lib/models/Review";

export async function GET(
  req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const userId = resolvedParams.id;

    const reviews = await Review.find({ toUserId: userId }).lean().exec();

    return NextResponse.json(reviews);
  } catch (err: any) {
    console.error("Failed to fetch reviews:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
