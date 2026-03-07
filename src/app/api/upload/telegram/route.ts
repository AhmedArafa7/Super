import { NextRequest, NextResponse } from "next/server";
import { getTelegramClient } from "@/lib/telegram-client";
import { CustomFile } from "telegram/client/uploads";

export const runtime = "edge";
// Prevent maximum duration issues on Vercel for large file uploads
export const maxDuration = 300;

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const chatId = process.env.TELEGRAM_STORAGE_CHAT_ID || "me"; // Defaults to Saved Messages
        const client = await getTelegramClient();

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Using CustomFile to retain original filename and size information for GramJS
        const customFile = new CustomFile(file.name, file.size, "", buffer);

        console.log(`Uploading ${file.name} (${file.size} bytes) to chat ${chatId}...`);

        // Upload the file to Telegram
        const message = await client.sendFile(chatId, {
            file: customFile,
            workers: 4, // Concurrent upload workers
        });

        return NextResponse.json({
            success: true,
            messageId: message.id,
            chatId: chatId,
            fileName: file.name
        });

    } catch (error: any) {
        console.error("Telegram Upload Error:", error);
        return NextResponse.json({ error: error.message || "Failed to upload to Telegram" }, { status: 500 });
    }
}
