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

      // For YouTube, use RapidAPI YTStream
      if (platform === "youtube" && url) {
        try {
          const rapidApiKey = Deno.env.get("RAPIDAPI_KEY");
          
          if (!rapidApiKey) {
            return new Response(
              JSON.stringify({ status: false, error: "YouTube download service not configured" }),
              { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          
          console.log("Calling RapidAPI for YouTube URL:", url);
          
          // Extract video ID from YouTube URL
          const videoIdMatch = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
          const ytVideoId = videoIdMatch ? videoIdMatch[1] : null;
          
          if (!ytVideoId) {
            throw new Error("Invalid YouTube URL - could not extract video ID");
          }
          
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
          console.log("RapidAPI full response:", JSON.stringify(rapidData, null, 2));
          
          if (rapidData.status === "fail" || rapidData.error) {
            throw new Error(rapidData.msg || rapidData.message || "Failed to get download link");
          }
          
          // Find the requested quality or best available
          const requestedQuality = format?.replace("p", "") || "720";
          let downloadUrl = null;
          let selectedQuality = null;

          // For audio downloads, search adaptiveFormats for audio
          if (format === "Audio (MP3)") {
            if (rapidData.adaptiveFormats && Array.isArray(rapidData.adaptiveFormats)) {
              // Find audio format by checking mimeType
              const audioFormats = rapidData.adaptiveFormats.filter((f: any) => 
                f.mimeType?.includes("audio/")
              );
              
              if (audioFormats.length > 0) {
                // Sort by bitrate descending to get best quality
                audioFormats.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));
                downloadUrl = audioFormats[0].url;
                selectedQuality = "Audio";
                console.log("Found audio format with bitrate:", audioFormats[0].bitrate);
              }
            }
          } else {
            // Parse the requested format to respect user's explicit choice
            const requestedFormat = format || "";
            const isNoAudioRequest = requestedFormat.includes("(no audio)");
            const cleanQuality = requestedFormat.replace(" (no audio)", "").replace(/p.*$/, "");
            
            console.log("Requested format:", requestedFormat, "Clean quality:", cleanQuality, "No audio requested:", isNoAudioRequest);
            
            // If user explicitly requested a "(no audio)" quality, use adaptiveFormats directly
            if (isNoAudioRequest) {
              console.log("User explicitly requested video-only stream, searching adaptiveFormats");
              if (rapidData.adaptiveFormats && Array.isArray(rapidData.adaptiveFormats)) {
                const videoFormats = rapidData.adaptiveFormats.filter((f: any) => 
                  f.mimeType?.includes("video/")
                );
                
                // Find exact match for requested quality
                const exactMatch = videoFormats.find((f: any) => {
                  const label = f.qualityLabel || "";
                  return label.startsWith(cleanQuality + "p");
                });
                
                if (exactMatch) {
                  downloadUrl = exactMatch.url;
                  selectedQuality = exactMatch.qualityLabel + " (no audio)";
                  console.log("Found requested video-only format:", selectedQuality);
                } else {
                  // Fallback to highest quality video-only if exact match not found
                  videoFormats.sort((a: any, b: any) => {
                    const qualityA = parseInt(a.qualityLabel?.replace(/\D/g, '') || "0");
                    const qualityB = parseInt(b.qualityLabel?.replace(/\D/g, '') || "0");
                    return qualityB - qualityA;
                  });
                  if (videoFormats.length > 0) {
                    downloadUrl = videoFormats[0].url;
                    selectedQuality = videoFormats[0].qualityLabel + " (no audio)";
                    console.log("Using highest video-only format:", selectedQuality);
                  }
                }
              }
            } else {
              // User wants audio - check combined formats first
              if (rapidData.formats && Array.isArray(rapidData.formats)) {
                const combinedFormats = rapidData.formats.filter((f: any) => 
                  f.mimeType?.includes("video/")
                );
                
                // Try exact quality match in combined formats
                const exactMatch = combinedFormats.find((f: any) => 
                  f.qualityLabel?.startsWith(cleanQuality + "p") || f.qualityLabel?.startsWith(requestedQuality + "p")
                );
                
                if (exactMatch) {
                  downloadUrl = exactMatch.url;
                  selectedQuality = exactMatch.qualityLabel;
                  console.log("Found combined video+audio:", selectedQuality);
                } else if (combinedFormats.length > 0) {
                  // No exact match - get highest quality available with audio
                  combinedFormats.sort((a: any, b: any) => {
                    const qualityA = parseInt(a.qualityLabel?.replace(/\D/g, '') || "0");
                    const qualityB = parseInt(b.qualityLabel?.replace(/\D/g, '') || "0");
                    return qualityB - qualityA;
                  });
                  downloadUrl = combinedFormats[0].url;
                  selectedQuality = combinedFormats[0].qualityLabel;
                  console.log("Using best combined format:", selectedQuality);
                }
              }
              
              // Fallback: if no combined URL found, try adaptive formats
              if (!downloadUrl && rapidData.adaptiveFormats && Array.isArray(rapidData.adaptiveFormats)) {
                console.log("Fallback: searching adaptiveFormats for video");
                const videoFormats = rapidData.adaptiveFormats.filter((f: any) => 
                  f.mimeType?.includes("video/")
                );
                
                const exactMatch = videoFormats.find((f: any) => 
                  f.qualityLabel?.startsWith(cleanQuality + "p")
                );
                
                if (exactMatch) {
                  downloadUrl = exactMatch.url;
                  selectedQuality = exactMatch.qualityLabel + " (no audio)";
                } else if (videoFormats.length > 0) {
                  videoFormats.sort((a: any, b: any) => {
                    const qualityA = parseInt(a.qualityLabel?.replace(/\D/g, '') || "0");
                    const qualityB = parseInt(b.qualityLabel?.replace(/\D/g, '') || "0");
                    return qualityB - qualityA;
                  });
                  downloadUrl = videoFormats[0].url;
                  selectedQuality = videoFormats[0].qualityLabel + " (no audio)";
                }
              }
            }
          }

          // Log what we found
          console.log("Selected download URL:", downloadUrl ? "found" : "not found");
          console.log("Selected quality:", selectedQuality);
          
          if (downloadUrl) {
            return new Response(
              JSON.stringify({ status: true, downloadUrl }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          
          throw new Error("No download URL found for requested quality");
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
    
    // For YouTube videos, fetch ACTUAL available qualities from RapidAPI
    if (data.hosting === "youtube" && media.length === 0) {
      const rapidApiKey = Deno.env.get("RAPIDAPI_KEY");
      
      if (rapidApiKey) {
        try {
          // Extract video ID from YouTube URL
          const videoIdMatch = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
          const ytVideoId = videoIdMatch ? videoIdMatch[1] : null;
          
          if (ytVideoId) {
            console.log("Fetching actual YouTube qualities for video:", ytVideoId);
            
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
            console.log("RapidAPI response for qualities:", JSON.stringify(rapidData, null, 2).substring(0, 1000));
            
            if (rapidData.status !== "fail" && !rapidData.error) {
              // Map to track unique qualities (key: resolution number, value: quality info)
              const qualityMap = new Map<number, { quality: string; hasAudio: boolean; format: string }>();
              
              // 1. First, add combined formats (video+audio) - these are preferred
              if (rapidData.formats && Array.isArray(rapidData.formats)) {
                for (const format of rapidData.formats) {
                  if (format.qualityLabel && format.mimeType?.includes("video/")) {
                    const resMatch = format.qualityLabel.match(/(\d+)p/);
                    const resolution = resMatch ? parseInt(resMatch[1]) : 0;
                    
                    if (resolution > 0) {
                      qualityMap.set(resolution, {
                        quality: format.qualityLabel,
                        hasAudio: true,
                        format: "video"
                      });
                    }
                  }
                }
              }
              
              // 2. Add adaptive formats (video-only for higher qualities not in combined)
              if (rapidData.adaptiveFormats && Array.isArray(rapidData.adaptiveFormats)) {
                for (const format of rapidData.adaptiveFormats) {
                  if (format.qualityLabel && format.mimeType?.includes("video/")) {
                    const resMatch = format.qualityLabel.match(/(\d+)p/);
                    const resolution = resMatch ? parseInt(resMatch[1]) : 0;
                    
                    // Only add if we don't have a combined format for this resolution
                    if (resolution > 0 && !qualityMap.has(resolution)) {
                      qualityMap.set(resolution, {
                        quality: format.qualityLabel + " (no audio)",
                        hasAudio: false,
                        format: "video"
                      });
                    }
                  }
                }
              }
              
              // 3. Sort by resolution (highest first) and convert to media array
              const sortedQualities = Array.from(qualityMap.entries())
                .sort((a, b) => b[0] - a[0])
                .map(([_, info]) => ({
                  quality: info.quality,
                  format: info.format,
                }));
              
              if (sortedQualities.length > 0) {
                media = sortedQualities;
                console.log("Found actual qualities:", sortedQualities.map(q => q.quality).join(", "));
              }
              
              // 4. Add audio option if available
              const hasAudio = rapidData.adaptiveFormats?.some((f: any) => f.mimeType?.includes("audio/"));
              if (hasAudio) {
                media.push({
                  quality: "Audio (MP3)",
                  format: "mp3",
                });
              }
            }
          }
        } catch (rapidError) {
          console.error("Error fetching YouTube qualities:", rapidError);
          // Fall through to fallback
        }
      }
      
      // Fallback to basic qualities if RapidAPI fails or returns nothing
      if (media.length === 0) {
        console.log("Using fallback quality list");
        const qualities = ["1080p", "720p", "480p", "360p"];
        media = qualities.map(quality => ({
          quality: quality,
          format: "video",
        }));
        media.push({
          quality: "Audio (MP3)",
          format: "mp3",
        });
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
