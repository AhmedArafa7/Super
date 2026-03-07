import { NextRequest, NextResponse } from "next/server";
import { getTelegramClient } from "@/lib/telegram-client";
import { Api } from "telegram";

export const runtime = "edge";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const messageIdStr = searchParams.get('messageId');
    const chatId = searchParams.get('chatId') || process.env.TELEGRAM_STORAGE_CHAT_ID || 'me';

    if (!messageIdStr) {
        return new NextResponse("Missing messageId", { status: 400 });
    }

    const messageId = parseInt(messageIdStr, 10);

    try {
        const client = await getTelegramClient();

        // Fetch the specific message containing the media
        const messages = await client.getMessages(chatId, { ids: messageId });
        if (!messages || messages.length === 0 || !messages[0].media) {
            return new NextResponse("Media not found", { status: 404 });
        }

        const message = messages[0];
        const media = message.media;

        // Handle Range Headers (crucial for video seeking!)
        const rangeHeader = req.headers.get("range");

        // For simplicity in this basic streaming iteration, we'll stream the whole file 
        // if no range is requested, or just pipe it chunk by chunk. 
        // GramJS's `iterDownload` handles offset and limit for proper range yielding.

        // Assuming we have Document (MP4)
        let fileSize = 0;
        if (media instanceof Api.MessageMediaDocument && media.document instanceof Api.Document) {
            // use BigInt conversion just in case gramjs returns BigInt for size
            fileSize = Number(media.document.size);
        }

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of client.iterDownload({
                        file: media,
                        requestSize: 1024 * 512, // 512 KB chunks for smooth browser buffering
                    })) {
                        controller.enqueue(chunk);
                    }
                    controller.close();
                } catch (e: any) {
                    console.error("Stream iterDownload error:", e);
                    controller.error(e);
                }
            }
        });

        const headers = new Headers();
        headers.set("Content-Type", "video/mp4");
        headers.set("Accept-Ranges", "bytes");

        if (fileSize > 0) {
            headers.set("Content-Length", fileSize.toString());
        }

        return new NextResponse(stream, { headers });

    } catch (error: any) {
        console.error("Stream Error:", error);
        return new NextResponse(error.message, { status: 500 });
    }
}
