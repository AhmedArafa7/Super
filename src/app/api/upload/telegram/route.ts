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
            return NextResponse.json({ error: "حجم الملف يتجاوز الحد الأقصى لبوتات تيليجرام (50MB)." }, { status: 400 });
        }

        const chatId = process.env.TELEGRAM_STORAGE_CHAT_ID || "me";
        const botToken = process.env.TELEGRAM_BOT_TOKEN;

        if (!botToken) {
            return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN is not configured in .env" }, { status: 500 });
        }

        console.log(`Uploading ${file.name} (${file.size} bytes) via Bot API to chat ${chatId}...`);

        const telegramFormData = new FormData();
        telegramFormData.append('chat_id', chatId);
        telegramFormData.append('video', file);

        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendVideo`, {
            method: 'POST',
            body: telegramFormData
        });

        const data = await response.json();

        if (!data.ok) {
            throw new Error(data.description || "Failed to upload to Telegram");
        }

        return NextResponse.json({
            success: true,
            fileId: data.result.video.file_id,
            chatId: chatId,
            fileName: file.name
        });

    } catch (error: any) {
        console.error("Telegram Bot Upload Error:", error);
        return NextResponse.json({ error: error.message || "Failed to upload to Telegram" }, { status: 500 });
    }
}
