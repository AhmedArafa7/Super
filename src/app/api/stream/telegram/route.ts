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

        let contentType = "application/octet-stream";
        let fileName = "file";
        
        try {
          const firstChunk = chunks[0];
          const getFilePathRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${firstChunk.id}`);
          const pathData = await getFilePathRes.json();
          
          if (pathData.ok && pathData.result.file_path) {
            const filePath = pathData.result.file_path;
            fileName = filePath.split('/').pop() || 'file';
            const ext = fileName.split('.').pop()?.toLowerCase();
            
            const mimeMap: Record<string, string> = {
              'pdf': 'application/pdf',
              'jpg': 'image/jpeg',
              'jpeg': 'image/jpeg',
              'png': 'image/png',
              'gif': 'image/gif',
              'mp4': 'video/mp4',
              'mkv': 'video/x-matroska',
              'mp3': 'audio/mpeg',
              'wav': 'audio/wav',
              'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'doc': 'application/msword',
              'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'xls': 'application/vnd.ms-excel',
              'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
              'ppt': 'application/vnd.ms-powerpoint',
              'txt': 'text/plain',
              'zip': 'application/zip',
              'rar': 'application/x-rar-compressed'
            };
            
            if (ext && mimeMap[ext]) {
              contentType = mimeMap[ext];
            } else if (ext && ['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(ext)) {
              contentType = 'video/mp4';
            } else {
              // Conscience Check: If no extension, try to guess or use PDF as a logical default for academic hub
              // Many course materials are PDFs.
              contentType = "application/pdf"; 
              if (!fileName.includes('.')) fileName += ".pdf";
            }
          }
        } catch (e) {
          contentType = "application/pdf"; // Fallback to PDF for academic context
        }

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    let currentOffset = 0;
                    for (let i = 0; i < chunks.length; i++) {
                        const chunk = chunks[i];
                        const chunkStart = currentOffset;
                        const chunkEnd = currentOffset + chunk.size - 1;

                        if (start <= chunkEnd && end >= chunkStart) {
                            const localStart = Math.max(0, start - chunkStart);
                            const localEnd = Math.min(chunk.size - 1, end - chunkStart);

                            const getFileResponse = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${chunk.id}`);
                            const getFileData = await getFileResponse.json();
                            if (!getFileData.ok) throw new Error(getFileData.description);

                            const fileUrl = `https://api.telegram.org/file/bot${botToken}/${getFileData.result.file_path}`;

                            const headers = new Headers();
                            headers.set("Range", `bytes=${localStart}-${localEnd}`);

                            const chunkRes = await fetch(fileUrl, { headers });
                            if (!chunkRes.ok || !chunkRes.body) throw new Error(`Failed to fetch chunk ${i}`);

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
                    controller.error(e);
                }
            }
        });

        const responseHeaders = new Headers();
        
        // Final Conscience Fix: Force browser to recognize as full-page PDF
        responseHeaders.set("Content-Type", contentType);
        // Using a simpler filename format to avoid browser rendering quirks
        responseHeaders.set("Content-Disposition", `inline; filename=${JSON.stringify(fileName)}`);
        responseHeaders.set("X-Content-Type-Options", "nosniff");
        responseHeaders.set("X-Frame-Options", "ALLOWALL");
        responseHeaders.set("Accept-Ranges", "bytes");
        responseHeaders.set("Content-Length", contentLength.toString());
        responseHeaders.set("Cache-Control", "public, max-age=31536000, immutable");

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
