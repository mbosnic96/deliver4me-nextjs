import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/db/db";
import { Notification } from "@/lib/models/Notification";

export const dynamic = "force-dynamic"; 

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return new Response("Missing userId", { status: 400 });
  }

  // Create a readable stream
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        new TextEncoder().encode("retry: 5000\n\n")
      );

      await dbConnect();

      // Send initial notifications
      const initial = await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      controller.enqueue(
        new TextEncoder().encode(`data: ${JSON.stringify(initial)}\n\n`)
      );

      const interval = setInterval(async () => {
        const latest = await Notification.find({ userId, seen: false })
          .sort({ createdAt: -1 })
          .limit(1)
          .lean();

        if (latest.length > 0) {
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify(latest[0])}\n\n`)
          );
        }
      }, 5000);

      controller.enqueue(new TextEncoder().encode(": connected\n\n")); 
      controller.close = () => {
        clearInterval(interval);
      };
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
