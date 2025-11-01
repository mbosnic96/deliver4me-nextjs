import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/db";
import { PushSubscription } from "@/lib/models/PushSubscription";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { subscription, userId } = body;

    const existingSubscription = await PushSubscription.findOne({
      userId,
      'subscription.endpoint': subscription.endpoint
    });

    if (existingSubscription) {
      await PushSubscription.findByIdAndUpdate(
        existingSubscription._id,
        { subscription },
        { new: true }
      );
    } else {
      const newSubscription = new PushSubscription({
        userId,
        subscription
      });
      await newSubscription.save();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving push subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}