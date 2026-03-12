import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "NexusAI/Bot 1.0",
        "Accept": "text/html"
      },
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch URL" }, { status: 500 });
    }

    const html = await response.text();
    
    // Extract og:image via strict regex
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
                         html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["'][^>]*>/i);

    // Fallback: looking for twitter:image, then any main image
    let imageUrl = null;
    
    if (ogImageMatch && ogImageMatch[1]) {
      imageUrl = ogImageMatch[1];
    } else {
      const twitterImageMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
                                html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["'][^>]*>/i);
      if (twitterImageMatch && twitterImageMatch[1]) {
        imageUrl = twitterImageMatch[1];
      }
    }

    if (imageUrl) {
      // Decode entities if any (simple conversion)
      imageUrl = imageUrl.replace(/&amp;/g, '&');
      
      // Handle relative URLs
      if (imageUrl.startsWith('/')) {
        const urlObj = new URL(url);
        imageUrl = `${urlObj.origin}${imageUrl}`;
      }
      
      return NextResponse.json({ image: imageUrl });
    }

    return NextResponse.json({ error: "No image metadata found" }, { status: 404 });
  } catch (error) {
    console.error("OG Extraction Error:", error);
    return NextResponse.json({ error: "Failed to process URL" }, { status: 500 });
  }
}
