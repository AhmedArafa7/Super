import { NextResponse } from 'next/server';

export const runtime = 'edge';

const DRIVE_API_KEY = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_DRIVE_API_KEY;

function checkDriveEnv() {
  return {
    hasKey: !!DRIVE_API_KEY,
    keyPrefix: DRIVE_API_KEY ? DRIVE_API_KEY.substring(0, 5) : 'none',
    envKeys: Object.keys(process.env).filter(k => k.includes('KEY')).map(k => k.replace(/./g, (c, i) => i < 3 ? c : '*'))
  };
}

export async function POST(req: Request) {
  try {
    const { folderId, fileId } = await req.json();

    if (!DRIVE_API_KEY) {
      return NextResponse.json({ error: true, message: "DRIVE_API_KEY missing in project environment." }, { status: 500 });
    }

    // Handle single file metadata
    if (fileId) {
      const fields = `name,size,mimeType,thumbnailLink,iconLink`;
      const targetUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=${encodeURIComponent(fields)}&key=${DRIVE_API_KEY}`;
      const res = await fetch(targetUrl);
      const data = await res.json();
      if (data.error) return NextResponse.json({ error: true, message: data.error.message }, { status: 400 });
      return NextResponse.json(data);
    }

    // Handle folder listing
    const folderIds = Array.isArray(folderId) ? folderId : [folderId];
    const allFiles: any[] = [];

    for (const id of folderIds) {
      const queryStr = `'${id}' in parents and trashed = false`;
      const fields = `files(id,name,size,mimeType,webViewLink,thumbnailLink)`;
      const targetUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(queryStr)}&fields=${encodeURIComponent(fields)}&key=${DRIVE_API_KEY}`;

      const res = await fetch(targetUrl);
      const data = await res.json();

      if (data.error) {
        console.error(`Google Drive API Error for folder ${id}:`, data.error.message);
        let errorMsg = `خطأ من Google Drive: ${data.error.message}.`;
        
        // [STABILITY] Detect project ID mismatch or API restrictions automatically
        if (data.error.message?.includes('project')) {
          const match = data.error.message.match(/project (\d+)/);
          if (match) {
            errorMsg += ` تنبيه هام: مفتاح الـ API الخاص بك مرتبط بالمشروع رقم (${match[1]})، تأكد من تفعيل Drive API في هذا المشروع تحديداً وليس مشروعاً آخر.`;
          }
        } else if (data.error.message?.includes('blocked')) {
          errorMsg += ` يبدو أن مفتاح الـ API الخاص بك "مقيد" (Restricted). يرجى التأكد من عدم وجود قيود على "Google Drive API" في إعدادات المفتاح هنا: https://console.cloud.google.com/apis/credentials`;
        } else {
          errorMsg += ` تأكد من تفعيل Drive API لمفتاحك.`;
        }

        return NextResponse.json({ 
          error: true, 
          message: errorMsg,
          diagnostics: { googleError: data.error }
        }, { status: 403 });
      }

      if (data.files) {
        allFiles.push(...data.files);
      }
    }

    return NextResponse.json({
      success: true,
      files: allFiles.sort((a, b) => a.name.localeCompare(b.name))
    });

  } catch (err: any) {
    console.error("Critical Drive API Failure:", err);
    return NextResponse.json({
      error: true,
      message: err.message || "Failed to fetch from Google Drive.",
      diagnostics: {
        error: err.message,
        env: checkDriveEnv()
      }
    }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { fileId, name } = await req.json();

    if (!DRIVE_API_KEY) {
      return NextResponse.json({ error: true, message: "DRIVE_API_KEY missing in project environment." }, { status: 500 });
    }

    if (!fileId || !name) {
      return NextResponse.json({ error: true, message: "Missing fileId or new name." }, { status: 400 });
    }

    const targetUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?key=${DRIVE_API_KEY}`;
    const res = await fetch(targetUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name })
    });

    const data = await res.json();
    if (data.error) return NextResponse.json({ error: true, message: data.error.message }, { status: 400 });

    return NextResponse.json({ success: true, file: data });

  } catch (err: any) {
    return NextResponse.json({ error: true, message: err.message }, { status: 500 });
  }
}

export async function GET(request: Request) { return NextResponse.json({ error: "Only POST and PATCH are allowed here." }, { status: 405 }); }
