import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        if (file.size > 50 * 1024 * 1024) {
            return NextResponse.json({ error: "حجم الملف يتجاوز الحد الأقصى لـ Telegram Bot (50MB)." }, { status: 400 });
        }

        const chatId = process.env.TELEGRAM_STORAGE_CHAT_ID || "me";
        const botToken = process.env.TELEGRAM_BOT_TOKEN;

        if (!botToken) {
            return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN is not configured" }, { status: 500 });
        }

        const mimeType = file.type || "";
        let telegramMethod = "sendDocument";
        let fieldName = "document";

        if (mimeType.startsWith("video/")) {
            telegramMethod = "sendVideo";
            fieldName = "video";
        } else if (mimeType.startsWith("audio/")) {
            telegramMethod = "sendAudio";
            fieldName = "audio";
        }

        const telegramFormData = new FormData();
        telegramFormData.append('chat_id', chatId);
        telegramFormData.append(fieldName, file);

        const response = await fetch(`https://api.telegram.org/bot${botToken}/${telegramMethod}`, {
            method: 'POST',
            body: telegramFormData
        });

        const data = await response.json();

        if (!data.ok) {
            throw new Error(data.description || "Failed to upload to Telegram");
        }

        // Get the file_id based on the type
        const result = data.result;
        const fileId = result.video?.file_id || result.audio?.file_id || result.document?.file_id || result.voice?.file_id;

        return NextResponse.json({
            success: true,
            fileId: fileId,
            chatId: chatId,
            fileName: file.name,
            type: fieldName
        });

    } catch (error: any) {
        console.error("Telegram Upload Error:", error);
        return NextResponse.json({ error: error.message || "Internal Upload Error" }, { status: 500 });
    }
}
