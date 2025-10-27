import { NextResponse } from "next/server";
import Review from "@/lib/models/Review";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  req: Request,
  context: RouteContext
) {
  try {
    const { id: userId } = await context.params;

    const reviews = await Review.find({ toUserId: userId }).lean().exec();

    return NextResponse.json(reviews);
  } catch (err: any) {
    console.error("Failed to fetch reviews:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}