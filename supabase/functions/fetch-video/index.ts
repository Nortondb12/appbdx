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
    const { url, download, videoId, format, platform } = await req.json();

    const apiToken = Deno.env.get("FASTSAVER_API_KEY");

    // Handle download request
    if (download) {
      console.log("Processing download request for:", platform, videoId, format);

      // For YouTube, use self-hosted Cobalt API
      if (platform === "youtube" && url) {
        try {
          console.log("Calling self-hosted Cobalt API for URL:", url);
          
          const cobaltResponse = await fetch("http://135.181.95.9:9000/api/json", {
            method: "POST",
            headers: {
              "Accept": "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ url }),
          });

          const cobaltData = await cobaltResponse.json();
          console.log("Cobalt API response:", JSON.stringify(cobaltData, null, 2));

          if (cobaltData.status === "error") {
            throw new Error(cobaltData.error?.code || "Cobalt API error");
          }

          // Cobalt returns different statuses: redirect, tunnel, picker
          if (cobaltData.url) {
            return new Response(
              JSON.stringify({ status: true, downloadUrl: cobaltData.url }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          // If picker (multiple options), use the first video
          if (cobaltData.picker && cobaltData.picker.length > 0) {
            return new Response(
              JSON.stringify({ status: true, downloadUrl: cobaltData.picker[0].url }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          throw new Error("No download URL in response");
        } catch (cobaltError) {
          console.error("Cobalt API error:", cobaltError);
          const errorMessage = cobaltError instanceof Error ? cobaltError.message : "Unknown error";
          return new Response(
            JSON.stringify({ status: false, error: `YouTube download failed: ${errorMessage}` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // For other platforms, the media URLs are already direct download URLs
      // Just return success - the frontend already has the URL
      return new Response(
        JSON.stringify({ status: false, error: "Direct download URL should be used" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Regular video info fetch
    if (!url) {
      return new Response(
        JSON.stringify({ status: false, error: "Video URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!apiToken) {
      console.error("FASTSAVER_API_KEY not configured");
      return new Response(
        JSON.stringify({ status: false, error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

    // Get media links from FastSaverAPI
    let media = transformMediaLinks(data);
    
    // For YouTube videos, FastSaverAPI only returns metadata
    // We'll use Cobalt API for actual downloads, so just provide quality options
    if (data.hosting === "youtube" && media.length === 0) {
      const qualities = ["1080p", "720p", "480p", "360p"];
      media = qualities.map(quality => ({
        quality: quality,
        format: "video",
        // No URL - will use Cobalt API for download
      }));
      
      // Add audio option
      media.push({
        quality: "Audio (MP3)",
        format: "mp3",
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
      // Include original URL for YouTube downloads via Cobalt
      originalUrl: data.hosting === "youtube" ? url : undefined,
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
function transformMediaLinks(data: any): Array<{ url?: string; quality?: string; format?: string }> {
  const media: Array<{ url?: string; quality?: string; format?: string }> = [];

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
