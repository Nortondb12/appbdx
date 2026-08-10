import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { checkRateLimit } from "./rate-limit.ts";

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

      // For YouTube, use RapidAPI with server-side video+audio merging
      if (platform === "youtube" && url) {
        try {
          const rapidApiKey = Deno.env.get("RAPIDAPI_KEY");
          
          if (!rapidApiKey) {
            return new Response(
              JSON.stringify({ status: false, error: "YouTube download service not configured" }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          
          console.log("Calling RapidAPI for YouTube download:", url, "format:", format);
          
          // Extract video ID from YouTube URL (supports regular, shorts, and youtu.be formats)
          const videoIdMatch = url.match(/(?:v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/);
          const ytVideoId = videoIdMatch ? videoIdMatch[1] : null;
          
          if (!ytVideoId) {
            throw new Error("Invalid YouTube URL - could not extract video ID");
          }
          
          // Handle audio download request
          if (format === "Audio (MP3)") {
            // Use YTStream for audio - it works well for audio
            const rapidResponse = await fetch(
              `https://ytstream-download-youtube-videos.p.rapidapi.com/dl?id=${ytVideoId}`,
              {
                method: "GET",
                headers: {
                  "X-RapidAPI-Key": rapidApiKey,
                  "X-RapidAPI-Host": "ytstream-download-youtube-videos.p.rapidapi.com",
                },
              }
            );
            
            const rapidData = await rapidResponse.json();
            
            if (rapidData.adaptiveFormats && Array.isArray(rapidData.adaptiveFormats)) {
              const audioFormats = rapidData.adaptiveFormats.filter((f: any) => 
                f.mimeType?.includes("audio/")
              );
              
              if (audioFormats.length > 0) {
                audioFormats.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));
                return new Response(
                  JSON.stringify({ status: true, downloadUrl: audioFormats[0].url }),
                  { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
              }
            }
            throw new Error("No audio format found");
          }
          
          // For video downloads, use the YouTube rendering API for merged video+audio
          console.log("Requesting merged video+audio for quality:", format);
          
          // Call the render API to get merged video+audio
          const renderResponse = await fetch(
            "https://youtube-video-and-shorts-downloader1.p.rapidapi.com/api/render",
            {
              method: "POST",
              headers: {
                "X-RapidAPI-Key": rapidApiKey,
                "X-RapidAPI-Host": "youtube-video-and-shorts-downloader1.p.rapidapi.com",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                url: url,
                quality: format, // e.g., "1080p60", "720p", etc.
              }),
            }
          );
          
          const renderData = await renderResponse.json();
          console.log("Render API response:", JSON.stringify(renderData).substring(0, 500));
          
          if (renderData.downloadUrl) {
            return new Response(
              JSON.stringify({ status: true, downloadUrl: renderData.downloadUrl }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          
          // If render API fails, try fallback to YTStream for lower qualities
          console.log("Render API did not return downloadUrl, trying YTStream fallback");
          
          const rapidResponse = await fetch(
            `https://ytstream-download-youtube-videos.p.rapidapi.com/dl?id=${ytVideoId}`,
            {
              method: "GET",
              headers: {
                "X-RapidAPI-Key": rapidApiKey,
                "X-RapidAPI-Host": "ytstream-download-youtube-videos.p.rapidapi.com",
              },
            }
          );
          
          const rapidData = await rapidResponse.json();
          const cleanQuality = format.replace(/p.*$/, "");
          
          // Try combined formats first (with audio)
          if (rapidData.formats && Array.isArray(rapidData.formats)) {
            const combinedFormats = rapidData.formats.filter((f: any) => 
              f.mimeType?.includes("video/") && f.url
            );
            
            const exactMatch = combinedFormats.find((f: any) => 
              f.qualityLabel?.startsWith(cleanQuality + "p")
            );
            
            if (exactMatch) {
              return new Response(
                JSON.stringify({ status: true, downloadUrl: exactMatch.url }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
            
            if (combinedFormats.length > 0) {
              combinedFormats.sort((a: any, b: any) => {
                const qualityA = parseInt(a.qualityLabel?.replace(/\D/g, '') || "0");
                const qualityB = parseInt(b.qualityLabel?.replace(/\D/g, '') || "0");
                return qualityB - qualityA;
              });
              return new Response(
                JSON.stringify({ status: true, downloadUrl: combinedFormats[0].url }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
          }
          
          throw new Error("No download URL found - please try a different quality");
        } catch (rapidError) {
          console.error("RapidAPI error:", rapidError);
          const errorMessage = rapidError instanceof Error ? rapidError.message : "Unknown error";
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

    // Check if the response is an HTML error page (API outage)
    if (
      responseText.startsWith("<!DOCTYPE") || 
      responseText.startsWith("<html") || 
      responseText.includes("502 Bad Gateway") || 
      responseText.includes("503 Service") ||
      responseText.includes("504 Gateway") ||
      !response.ok
    ) {
      console.error("FastSaver API returned error page, status:", response.status);
      return new Response(
        JSON.stringify({ 
          status: false, 
          error: "The video service is temporarily unavailable. Please wait a moment and try again.",
          isServiceUnavailable: true
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse API response as JSON:", parseError);
      return new Response(
        JSON.stringify({ 
          status: false, 
          error: "Invalid response from video service. Please try again.",
          isServiceUnavailable: true
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("FastSaver API parsed response:", JSON.stringify(data, null, 2));

    // Check if the API returned an error (data.error can be false which is OK)
    if (data.error === true || data.status === false || data.error === "invalid_url") {
      // Provide more helpful error messages based on error type
      let errorMessage = data.message || "Failed to fetch video. Please check the URL and try again.";
      if (data.error === "invalid_url") {
        errorMessage = "This video URL is not supported or the video may be unavailable. Please try again or use a different video.";
      }
      return new Response(
        JSON.stringify({ 
          status: false, 
          error: errorMessage 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get media links from FastSaverAPI
    let media = transformMediaLinks(data);
    
    // For YouTube videos, fetch available qualities using the rendering API
    if (data.hosting === "youtube" && media.length === 0) {
      const rapidApiKey = Deno.env.get("RAPIDAPI_KEY");
      
      if (rapidApiKey) {
        try {
          console.log("Fetching YouTube qualities using rendering API for:", url);
          
          // Use the getInfo endpoint to get available renderable qualities
          const renderInfoResponse = await fetch(
            `https://youtube-video-and-shorts-downloader1.p.rapidapi.com/api/getInfo?url=${encodeURIComponent(url)}`,
            {
              method: "GET",
              headers: {
                "X-RapidAPI-Key": rapidApiKey,
                "X-RapidAPI-Host": "youtube-video-and-shorts-downloader1.p.rapidapi.com",
              },
            }
          );
          
          const renderInfo = await renderInfoResponse.json();
          console.log("Render getInfo response keys:", Object.keys(renderInfo));
          
          const qualitySet = new Set<string>();
          
          // Get qualities from render.formats (these will have audio after rendering)
          if (renderInfo.render?.formats && Array.isArray(renderInfo.render.formats)) {
            for (const format of renderInfo.render.formats) {
              if (format.qualityLabel) {
                qualitySet.add(format.qualityLabel);
              }
            }
            console.log("Render formats qualities:", Array.from(qualitySet).join(", "));
          }
          
          // Fallback to YTStream if render API doesn't return formats
          if (qualitySet.size === 0) {
            const videoIdMatch = url.match(/(?:v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/);
            const ytVideoId = videoIdMatch ? videoIdMatch[1] : null;
            
            if (ytVideoId) {
              const rapidResponse = await fetch(
                `https://ytstream-download-youtube-videos.p.rapidapi.com/dl?id=${ytVideoId}`,
                {
                  method: "GET",
                  headers: {
                    "X-RapidAPI-Key": rapidApiKey,
                    "X-RapidAPI-Host": "ytstream-download-youtube-videos.p.rapidapi.com",
                  },
                }
              );
              
              const rapidData = await rapidResponse.json();
              
              // Add all available qualities (will be merged with audio on download)
              if (rapidData.adaptiveFormats && Array.isArray(rapidData.adaptiveFormats)) {
                for (const format of rapidData.adaptiveFormats) {
                  if (format.qualityLabel && format.mimeType?.includes("video/")) {
                    qualitySet.add(format.qualityLabel);
                  }
                }
              }
              
              if (rapidData.formats && Array.isArray(rapidData.formats)) {
                for (const format of rapidData.formats) {
                  if (format.qualityLabel && format.mimeType?.includes("video/")) {
                    qualitySet.add(format.qualityLabel);
                  }
                }
              }
            }
          }
          
          // Convert to array and sort by resolution
          const qualities = Array.from(qualitySet);
          qualities.sort((a, b) => {
            const resA = parseInt(a.replace(/\D/g, '') || "0");
            const resB = parseInt(b.replace(/\D/g, '') || "0");
            return resB - resA;
          });
          
          if (qualities.length > 0) {
            media = qualities.map(q => ({
              quality: q, // No "(no audio)" label - all will have audio
              format: "video",
            }));
            console.log("Found qualities:", qualities.join(", "));
          }
          
          // Add audio option
          media.push({
            quality: "Audio (MP3)",
            format: "mp3",
          });
        } catch (rapidError) {
          console.error("Error fetching YouTube qualities:", rapidError);
        }
      }
      
      // Fallback to basic qualities if RapidAPI fails
      if (media.length === 0) {
        console.log("Using fallback quality list");
        media = [
          { quality: "720p", format: "video" },
          { quality: "480p", format: "video" },
          { quality: "360p", format: "video" },
          { quality: "Audio (MP3)", format: "mp3" },
        ];
      }
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

  // Handle TikTok direct download_url from FastSaverAPI
  if (data.download_url) {
    media.push({
      url: data.download_url,
      quality: "HD",
      format: data.type || "video",
    });
    
    // Also add music/audio if available
    if (data.music) {
      media.push({
        url: data.music,
        quality: "Audio",
        format: "audio",
      });
    }
  }

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
