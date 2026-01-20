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
          
          // For video downloads, use YTStream API with combined formats (video+audio)
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
          console.log("YTStream response keys:", Object.keys(rapidData));
          
          const requestedFormat = format || "";
          const isNoAudioRequest = requestedFormat.includes("(no audio)");
          const cleanQuality = requestedFormat.replace(" (no audio)", "").replace(/p.*$/, "");
          
          console.log("Requested format:", requestedFormat, "isNoAudio:", isNoAudioRequest, "cleanQuality:", cleanQuality);
          
          let downloadUrl: string | null = null;
          
          if (isNoAudioRequest) {
            // User explicitly wants high quality without audio - use adaptiveFormats
            if (rapidData.adaptiveFormats && Array.isArray(rapidData.adaptiveFormats)) {
              const videoFormats = rapidData.adaptiveFormats.filter((f: any) => 
                f.mimeType?.includes("video/") && f.url
              );
              
              // Find exact quality match
              const exactMatch = videoFormats.find((f: any) => 
                f.qualityLabel?.startsWith(cleanQuality + "p")
              );
              
              if (exactMatch) {
                downloadUrl = exactMatch.url;
                console.log("Found adaptive format:", exactMatch.qualityLabel);
              } else if (videoFormats.length > 0) {
                // Sort by quality and get highest
                videoFormats.sort((a: any, b: any) => {
                  const qualityA = parseInt(a.qualityLabel?.replace(/\D/g, '') || "0");
                  const qualityB = parseInt(b.qualityLabel?.replace(/\D/g, '') || "0");
                  return qualityB - qualityA;
                });
                downloadUrl = videoFormats[0].url;
                console.log("Using highest adaptive format:", videoFormats[0].qualityLabel);
              }
            }
          } else {
            // User wants video WITH audio - use combined formats
            if (rapidData.formats && Array.isArray(rapidData.formats)) {
              const combinedFormats = rapidData.formats.filter((f: any) => 
                f.mimeType?.includes("video/") && f.url
              );
              
              console.log("Available combined formats:", combinedFormats.map((f: any) => f.qualityLabel).join(", "));
              
              // Try to find exact quality match
              const exactMatch = combinedFormats.find((f: any) => 
                f.qualityLabel?.startsWith(cleanQuality + "p")
              );
              
              if (exactMatch) {
                downloadUrl = exactMatch.url;
                console.log("Found exact combined format:", exactMatch.qualityLabel);
              } else if (combinedFormats.length > 0) {
                // Sort by quality and get highest available
                combinedFormats.sort((a: any, b: any) => {
                  const qualityA = parseInt(a.qualityLabel?.replace(/\D/g, '') || "0");
                  const qualityB = parseInt(b.qualityLabel?.replace(/\D/g, '') || "0");
                  return qualityB - qualityA;
                });
                downloadUrl = combinedFormats[0].url;
                console.log("Using highest combined format:", combinedFormats[0].qualityLabel);
              }
            }
          }
          
          if (downloadUrl) {
            return new Response(
              JSON.stringify({ status: true, downloadUrl }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
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
    
    // For YouTube videos, fetch available qualities using YTStream API
    if (data.hosting === "youtube" && media.length === 0) {
      const rapidApiKey = Deno.env.get("RAPIDAPI_KEY");
      
      if (rapidApiKey) {
        try {
          // Extract video ID from YouTube URL
          const videoIdMatch = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
          const ytVideoId = videoIdMatch ? videoIdMatch[1] : null;
          
          if (ytVideoId) {
            console.log("Fetching YouTube qualities using YTStream for:", ytVideoId);
            
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
            console.log("YTStream qualities response - formats:", rapidData.formats?.length, "adaptive:", rapidData.adaptiveFormats?.length);
            
            const qualityMap = new Map<string, { quality: string; hasAudio: boolean }>();
            
            // First, add combined formats (WITH audio) - these are priority
            if (rapidData.formats && Array.isArray(rapidData.formats)) {
              for (const format of rapidData.formats) {
                if (format.qualityLabel && format.mimeType?.includes("video/")) {
                  const baseQuality = format.qualityLabel;
                  if (!qualityMap.has(baseQuality)) {
                    qualityMap.set(baseQuality, { quality: baseQuality, hasAudio: true });
                  }
                }
              }
            }
            
            // Then add adaptive formats (NO audio) for higher qualities
            if (rapidData.adaptiveFormats && Array.isArray(rapidData.adaptiveFormats)) {
              for (const format of rapidData.adaptiveFormats) {
                if (format.qualityLabel && format.mimeType?.includes("video/")) {
                  const baseQuality = format.qualityLabel;
                  // Only add if we don't already have a combined format for this quality
                  if (!qualityMap.has(baseQuality)) {
                    qualityMap.set(baseQuality, { quality: baseQuality + " (no audio)", hasAudio: false });
                  }
                }
              }
            }
            
            // Convert to array and sort by resolution
            const qualities = Array.from(qualityMap.values());
            qualities.sort((a, b) => {
              const resA = parseInt(a.quality.replace(/\D/g, '') || "0");
              const resB = parseInt(b.quality.replace(/\D/g, '') || "0");
              return resB - resA;
            });
            
            if (qualities.length > 0) {
              media = qualities.map(q => ({
                quality: q.quality,
                format: "video",
              }));
              console.log("Found qualities:", qualities.map(q => q.quality).join(", "));
            }
            
            // Add audio option
            media.push({
              quality: "Audio (MP3)",
              format: "mp3",
            });
          }
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
