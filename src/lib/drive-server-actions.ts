'use server';

/**
 * [STABILITY_ANCHOR: DRIVE_SERVER_ACTIONS_V1.0]
 * محرك معالجة ملفات جوجل درايف برمجياً عبر السيرفر.
 * يسمح باستخدام مفتاح API الخاص بالمشروع بأمان دون الحاجة لـ Worker خارجي.
 */

const DRIVE_API_KEY = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_DRIVE_API_KEY;

export async function fetchDriveFilesServer(folderId: string | string[]) {
  if (!DRIVE_API_KEY) {
    return { error: true, message: "DRIVE_API_KEY missing in project environment." };
  }

  const folderIds = Array.isArray(folderId) ? folderId : [folderId];
  const allFiles: any[] = [];

  try {
    for (const id of folderIds) {
      const queryStr = `'${id}'+in+parents+and+trashed=false`;
      const fields = `files(id,name,size,mimeType,webViewLink,thumbnailLink)`;
      const targetUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(queryStr)}&fields=${encodeURIComponent(fields)}&key=${DRIVE_API_KEY}`;

      const res = await fetch(targetUrl);
      const data = await res.json();

      if (data.error) {
        console.error(`Google Drive API Error for folder ${id}:`, data.error.message);
        continue;
      }

      if (data.files) {
        allFiles.push(...data.files);
      }
    }

    return { 
      success: true, 
      files: allFiles.sort((a, b) => a.name.localeCompare(b.name)) 
    };
  } catch (err: any) {
    return { error: true, message: err.message || "Failed to fetch from Google Drive." };
  }
}

export async function fetchDriveMetadataServer(fileId: string) {
  if (!DRIVE_API_KEY) return null;

  try {
    const fields = `name,size,mimeType,thumbnailLink,iconLink`;
    const targetUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=${encodeURIComponent(fields)}&key=${DRIVE_API_KEY}`;

    const res = await fetch(targetUrl);
    const data = await res.json();
    if (data.error) return null;
    return data;
  } catch (e) {
    return null;
  }
}
