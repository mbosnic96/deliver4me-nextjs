import { NextRequest } from "next/server";
import { dbConnect } from "@/lib/db/db";
import { Notification } from "@/lib/models/Notification";

export const dynamic = "force-dynamic";

const userLastCheck = new Map<string, Date>();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return new Response("Missing userId", { status: 400 });
  }

  let isControllerClosed = false;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(
          new TextEncoder().encode("retry: 10000\n\n")
        );

        await dbConnect();

        // Send initial notifications
        try {
          const initial = await Notification.find({ userId })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify(initial)}\n\n`)
          );

          userLastCheck.set(userId, new Date());
        } catch (error) {
          console.error("Error fetching initial notifications:", error);
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify([])}\n\n`)
          );
        }

        const interval = setInterval(async () => {
          if (isControllerClosed) {
            clearInterval(interval);
            return;
          }

          try {
            const lastCheck = userLastCheck.get(userId) || new Date(0);
            const now = new Date();

            const newNotifications = await Notification.find({
              userId,
              seen: false,
              createdAt: { $gt: lastCheck }
            })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

            if (newNotifications.length > 0) {
              userLastCheck.set(userId, now);

              for (const notification of newNotifications) {
                if (isControllerClosed) break;
                
                try {
                  controller.enqueue(
                    new TextEncoder().encode(`data: ${JSON.stringify(notification)}\n\n`)
                  );
                } catch (enqueueError) {
                  console.error("Error enqueueing data:", enqueueError);
                  isControllerClosed = true;
                  break;
                }
              }
            }

            userLastCheck.set(userId, now);

          } catch (dbError) {
            console.error("Error fetching new notifications:", dbError);
          }
        }, 5000);

        if (!isControllerClosed) {
          controller.enqueue(new TextEncoder().encode(": connected\n\n"));
        }

      } catch (error) {
        console.error("Stream setup error:", error);
        if (!isControllerClosed) {
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({ error: "Stream setup failed" })}\n\n`)
          );
        }
      }
    },

    cancel() {
      isControllerClosed = true;
      userLastCheck.delete(userId);
      console.log("Stream cancelled for user:", userId);
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control"
    },
  });
}