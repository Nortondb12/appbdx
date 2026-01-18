import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, download, videoId, format } = await req.json();

    const apiToken = Deno.env.get("FASTSAVER_API_KEY");
    
    if (!apiToken) {
      console.error("FASTSAVER_API_KEY not configured");
      return new Response(
        JSON.stringify({ status: false, error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle download request - proxy to FastSaverAPI
    if (download && videoId && format) {
      console.log("Processing download request for:", videoId, format);
      
      const downloadUrl = `https://fastsaverapi.com/download?video_id=${videoId}&format=${format}&token=${apiToken}`;
      
      try {
        // Call the download endpoint and follow redirects to get final URL
        const downloadResponse = await fetch(downloadUrl, {
          method: "GET",
          redirect: "follow",
        });
        
        // Check if we got a video file or redirect
        const finalUrl = downloadResponse.url;
        const contentType = downloadResponse.headers.get("content-type") || "";
        
        console.log("Download response URL:", finalUrl);
        console.log("Content-Type:", contentType);
        
        // If the response is video content, return the final URL
        if (contentType.includes("video") || contentType.includes("audio") || finalUrl !== downloadUrl) {
          return new Response(
            JSON.stringify({ status: true, downloadUrl: finalUrl }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Try to parse as JSON error
        const responseText = await downloadResponse.text();
        console.log("Download response text:", responseText.substring(0, 200));
        
        try {
          const jsonResponse = JSON.parse(responseText);
          if (jsonResponse.url) {
            return new Response(
              JSON.stringify({ status: true, downloadUrl: jsonResponse.url }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        } catch {
          // Not JSON, might be an error page
        }
        
        return new Response(
          JSON.stringify({ status: false, error: "Failed to get download URL" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (downloadError) {
        console.error("Download error:", downloadError);
        return new Response(
          JSON.stringify({ status: false, error: "Download failed" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Regular video info fetch
    if (!url) {
      return new Response(
        JSON.stringify({ status: false, error: "Video URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return new Response(
        JSON.stringify({ status: false, error: "Invalid URL format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Fetching video info for URL:", url);

    // FastSaverAPI uses GET request with query parameters
    const apiUrl = new URL("https://fastsaverapi.com/get-info");
    apiUrl.searchParams.set("url", url);
    apiUrl.searchParams.set("token", apiToken);

    const response = await fetch(apiUrl.toString(), {
      method: "GET",
      headers: {
        "Accept": "*/*",
      },
    });

    const responseText = await response.text();
    console.log("FastSaver API raw response:", responseText.substring(0, 500));

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse API response as JSON:", parseError);
      return new Response(
        JSON.stringify({ 
          status: false, 
          error: "Invalid response from video service. Please try again." 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("FastSaver API parsed response:", JSON.stringify(data, null, 2));

    // Check if the API returned an error (data.error can be false which is OK)
    if (data.error === true || data.status === false) {
      return new Response(
        JSON.stringify({ 
          status: false, 
          error: data.message || "Failed to fetch video. Please check the URL and try again." 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get media links - for YouTube, we need to construct download URLs
    let media = transformMediaLinks(data);
    
    // For YouTube videos, FastSaverAPI requires /download endpoint
    // We store videoId instead of full URL to keep API token secure
    if (data.hosting === "youtube" && data.shortcode && media.length === 0) {
      const qualities = ["1080p", "720p", "480p", "360p"];
      media = qualities.map(quality => ({
        videoId: data.shortcode,
        quality: quality,
        format: "video"
      }));
      
      // Add audio option
      media.push({
        videoId: data.shortcode,
        quality: "Audio (MP3)",
        format: "mp3"
      });
    }

    // Transform the response to match our expected format
    const result = {
      status: true,
      title: data.title || data.caption || "Untitled Video",
      thumbnail: data.thumb_best || data.thumb || data.thumbnail || data.cover || "",
      duration: data.duration || "",
      platform: data.hosting || "",
      media: media,
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error fetching video:", error);
    return new Response(
      JSON.stringify({ 
        status: false, 
        error: "Unable to process your request. Please try again later." 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Transform various API response formats to our unified media format
function transformMediaLinks(data: any): Array<{ url?: string; videoId?: string; quality?: string; format?: string }> {
  const media: Array<{ url?: string; videoId?: string; quality?: string; format?: string }> = [];

  // Handle different response structures from FastSaverAPI
  if (data.medias && Array.isArray(data.medias)) {
    for (const m of data.medias) {
      if (m.url) {
        media.push({
          url: m.url,
          quality: m.quality || m.resolution || "",
          format: m.extension || m.format || "",
        });
      }
    }
  }

  if (data.url) {
    media.push({
      url: data.url,
      quality: data.quality || "Default",
      format: data.format || "",
    });
  }

  if (data.links && Array.isArray(data.links)) {
    for (const link of data.links) {
      if (link.url || link.link) {
        media.push({
          url: link.url || link.link,
          quality: link.quality || link.resolution || "",
          format: link.type || "",
        });
      }
    }
  }

  // Handle video/audio arrays
  if (data.video && Array.isArray(data.video)) {
    for (const v of data.video) {
      if (v.url) {
        media.push({
          url: v.url,
          quality: v.quality || v.resolution || "Video",
          format: "video",
        });
      }
    }
  }

  if (data.audio && Array.isArray(data.audio)) {
    for (const a of data.audio) {
      if (a.url) {
        media.push({
          url: a.url,
          quality: "Audio",
          format: "audio",
        });
      }
    }
  }

  return media;
}
