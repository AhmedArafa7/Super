import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const fileIdParam = searchParams.get('fileId');

    if (!fileIdParam) {
        return new NextResponse("Missing fileId.", { status: 400 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
        return new NextResponse("Bot token missing", { status: 500 });
    }

    try {
        let chunks: { id: string, size: number }[] = [];

        try {
            // Check if it's a JSON array of chunks
            if (fileIdParam.startsWith('[') && fileIdParam.endsWith(']')) {
                chunks = JSON.parse(decodeURIComponent(fileIdParam));
            } else {
                // It's a single file ID, we need to fetch size from Telegram
                const getFileResponse = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileIdParam}`);
                const getFileData = await getFileResponse.json();
                if (!getFileData.ok) {
                    return new NextResponse(getFileData.description || "Failed to get file info", { status: 404 });
                }
                chunks = [{ id: fileIdParam, size: getFileData.result.file_size }];
            }
        } catch (e) {
            return new NextResponse("Invalid fileId parameter format.", { status: 400 });
        }

        const totalSize = chunks.reduce((acc, c) => acc + c.size, 0);

        // Parse Range Header
        const range = req.headers.get('range');
        let start = 0;
        let end = totalSize - 1;

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            if (parts[0]) start = parseInt(parts[0], 10);
            if (parts[1]) end = parseInt(parts[1], 10);
        }

        // Handle edge cases
        if (start >= totalSize || end >= totalSize) {
            return new NextResponse(null, {
                status: 416, // Range Not Satisfiable
                headers: { "Content-Range": `bytes */${totalSize}` }
            });
        }

        const contentLength = end - start + 1;

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    let currentOffset = 0;

                    for (let i = 0; i < chunks.length; i++) {
                        const chunk = chunks[i];
                        const chunkStart = currentOffset;
                        const chunkEnd = currentOffset + chunk.size - 1;

                        // Check if this chunk intersects with the requested range
                        if (start <= chunkEnd && end >= chunkStart) {
                            const localStart = Math.max(0, start - chunkStart);
                            const localEnd = Math.min(chunk.size - 1, end - chunkStart);

                            // Fetch chunk file path
                            const getFileResponse = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${chunk.id}`);
                            const getFileData = await getFileResponse.json();
                            if (!getFileData.ok) throw new Error(getFileData.description);

                            const fileUrl = `https://api.telegram.org/file/bot${botToken}/${getFileData.result.file_path}`;

                            const headers = new Headers();
                            headers.set("Range", `bytes=${localStart}-${localEnd}`);

                            const chunkRes = await fetch(fileUrl, { headers });
                            if (!chunkRes.ok || !chunkRes.body) throw new Error(`Failed to fetch chunk ${i}`);

                            // Pipe the chunk data into the main stream
                            const reader = chunkRes.body.getReader();
                            while (true) {
                                const { done, value } = await reader.read();
                                if (done) break;
                                controller.enqueue(value);
                            }
                        }

                        currentOffset += chunk.size;
                    }
                    controller.close();
                } catch (e: any) {
                    console.error("Multi-chunk Stream Error:", e);
                    controller.error(e);
                }
            }
        });

        const responseHeaders = new Headers();
        responseHeaders.set("Content-Type", "video/mp4");
        responseHeaders.set("Accept-Ranges", "bytes");
        responseHeaders.set("Content-Length", contentLength.toString());

        if (range) {
            responseHeaders.set("Content-Range", `bytes ${start}-${end}/${totalSize}`);
        }

        return new NextResponse(stream, {
            status: range ? 206 : 200,
            headers: responseHeaders
        });

    } catch (error: any) {
        console.error("Stream Error:", error);
        return new NextResponse(error.message, { status: 500 });
    }
}
