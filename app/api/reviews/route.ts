import { NextResponse } from "next/server";
import {dbConnect} from "@/lib/db/db";
import Review from "@/lib/models/Review";
import User from "@/lib/models/User";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { loadId, fromUserId, toUserId, rating, comment } = await req.json();

    if (!loadId || !fromUserId || !toUserId || !rating) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // sprijecava duplikat mada ima check api i dialog se ne otvara ako ima check
    const existing = await Review.findOne({ loadId, fromUserId });
    if (existing) {
      return NextResponse.json({ error: "Review already exists" }, { status: 400 });
    }


    const review = await Review.create({
      loadId,
      fromUserId,
      toUserId,
      rating,
      comment,
    });

    const reviews = await Review.find({ toUserId });
    const reviewsCount = reviews.length;
    const averageRating =
      reviews.reduce((acc, r) => acc + r.rating, 0) / reviewsCount;

    await User.findByIdAndUpdate(toUserId, {
      rating: averageRating,
      reviewsCount,
    });

    return NextResponse.json({ success: true, review });
  } catch (err) {
    console.error("Review error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
