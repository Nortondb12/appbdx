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
          
          // Extract video ID from YouTube URL
          const videoIdMatch = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
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
          
          // For video downloads, use the YouTube Video Downloader API that merges video+audio
          const requestedQuality = format?.replace(/p.*$/, "") || "720";
          console.log("Requesting merged video+audio at quality:", requestedQuality);
          
          // Step 1: Get video info and render config
          const infoResponse = await fetch(
            `https://youtube-video-and-shorts-downloader1.p.rapidapi.com/api/getInfo?url=${encodeURIComponent(url)}`,
            {
              method: "GET",
              headers: {
                "X-RapidAPI-Key": rapidApiKey,
                "X-RapidAPI-Host": "youtube-video-and-shorts-downloader1.p.rapidapi.com",
              },
            }
          );
          
          const infoData = await infoResponse.json();
          console.log("Video info response:", JSON.stringify(infoData, null, 2).substring(0, 2000));
          
          if (infoData.status === "fail" || infoData.error) {
            throw new Error(infoData.message || "Failed to get video info");
          }
          
          // Check for direct download formats with audio
          if (infoData.formats && Array.isArray(infoData.formats)) {
            // Find formats with both video and audio
            const mergedFormats = infoData.formats.filter((f: any) => 
              f.hasVideo && f.hasAudio && f.qualityLabel
            );
            
            console.log("Found merged formats:", mergedFormats.map((f: any) => f.qualityLabel).join(", "));
            
            if (mergedFormats.length > 0) {
              // Try to find exact quality match
              let targetFormat = mergedFormats.find((f: any) => 
                f.qualityLabel?.startsWith(requestedQuality + "p")
              );
              
              // If no exact match, get the highest quality available
              if (!targetFormat) {
                mergedFormats.sort((a: any, b: any) => {
                  const qualityA = parseInt(a.qualityLabel?.replace(/\D/g, '') || "0");
                  const qualityB = parseInt(b.qualityLabel?.replace(/\D/g, '') || "0");
                  return qualityB - qualityA;
                });
                targetFormat = mergedFormats[0];
              }
              
              if (targetFormat?.url) {
                console.log("Found direct merged download at:", targetFormat.qualityLabel);
                return new Response(
                  JSON.stringify({ status: true, downloadUrl: targetFormat.url }),
                  { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
              }
            }
          }
          
          // If direct formats not available, use render API to merge video+audio
          if (infoData.render && infoData.render.formats) {
            console.log("Using render API to merge video+audio");
            
            // Find the best available render format
            const renderFormats = infoData.render.formats.filter((f: any) => f.qualityLabel);
            
            let targetRender = renderFormats.find((f: any) => 
              f.qualityLabel?.startsWith(requestedQuality + "p")
            );
            
            if (!targetRender && renderFormats.length > 0) {
              renderFormats.sort((a: any, b: any) => {
                const qualityA = parseInt(a.qualityLabel?.replace(/\D/g, '') || "0");
                const qualityB = parseInt(b.qualityLabel?.replace(/\D/g, '') || "0");
                return qualityB - qualityA;
              });
              targetRender = renderFormats[0];
            }
            
            if (targetRender) {
              // Trigger rendering to merge video+audio
              const renderUrl = `https://youtube-video-and-shorts-downloader1.p.rapidapi.com/api/render?url=${encodeURIComponent(url)}&format=${targetRender.itag || targetRender.qualityLabel}`;
              
              console.log("Triggering render for:", targetRender.qualityLabel);
              
              const renderResponse = await fetch(renderUrl, {
                method: "GET",
                headers: {
                  "X-RapidAPI-Key": rapidApiKey,
                  "X-RapidAPI-Host": "youtube-video-and-shorts-downloader1.p.rapidapi.com",
                },
              });
              
              const renderData = await renderResponse.json();
              console.log("Render response:", JSON.stringify(renderData, null, 2).substring(0, 1000));
              
              if (renderData.url || renderData.downloadUrl) {
                return new Response(
                  JSON.stringify({ status: true, downloadUrl: renderData.url || renderData.downloadUrl }),
                  { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
              }
            }
          }
          
          // Fallback: Use YTStream combined formats (will be lower quality but has audio)
          console.log("Falling back to YTStream combined formats");
          const ytStreamResponse = await fetch(
            `https://ytstream-download-youtube-videos.p.rapidapi.com/dl?id=${ytVideoId}`,
            {
              method: "GET",
              headers: {
                "X-RapidAPI-Key": rapidApiKey,
                "X-RapidAPI-Host": "ytstream-download-youtube-videos.p.rapidapi.com",
              },
            }
          );
          
          const ytStreamData = await ytStreamResponse.json();
          
          if (ytStreamData.formats && Array.isArray(ytStreamData.formats)) {
            const combinedFormats = ytStreamData.formats.filter((f: any) => 
              f.mimeType?.includes("video/") && f.url
            );
            
            if (combinedFormats.length > 0) {
              // Sort by quality and get the best one
              combinedFormats.sort((a: any, b: any) => {
                const qualityA = parseInt(a.qualityLabel?.replace(/\D/g, '') || "0");
                const qualityB = parseInt(b.qualityLabel?.replace(/\D/g, '') || "0");
                return qualityB - qualityA;
              });
              
              console.log("Using YTStream combined format:", combinedFormats[0].qualityLabel);
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
    
    // For YouTube videos, fetch available qualities using the new merged API
    if (data.hosting === "youtube" && media.length === 0) {
      const rapidApiKey = Deno.env.get("RAPIDAPI_KEY");
      
      if (rapidApiKey) {
        try {
          console.log("Fetching YouTube qualities using merged API for:", url);
          
          // Use the new API that provides merged video+audio downloads
          const infoResponse = await fetch(
            `https://youtube-video-and-shorts-downloader1.p.rapidapi.com/api/getInfo?url=${encodeURIComponent(url)}`,
            {
              method: "GET",
              headers: {
                "X-RapidAPI-Key": rapidApiKey,
                "X-RapidAPI-Host": "youtube-video-and-shorts-downloader1.p.rapidapi.com",
              },
            }
          );
          
          const infoData = await infoResponse.json();
          console.log("Merged API qualities response:", JSON.stringify(infoData, null, 2).substring(0, 1500));
          
          if (infoData.status !== "fail" && !infoData.error) {
            const qualitySet = new Set<string>();
            const qualities: Array<{quality: string; format: string}> = [];
            
            // Get all available qualities from formats (merged video+audio)
            if (infoData.formats && Array.isArray(infoData.formats)) {
              for (const format of infoData.formats) {
                if (format.qualityLabel && format.hasVideo) {
                  const baseQuality = format.qualityLabel.replace(/\d+$/, ''); // Remove fps suffix
                  if (!qualitySet.has(format.qualityLabel)) {
                    qualitySet.add(format.qualityLabel);
                    qualities.push({
                      quality: format.qualityLabel,
                      format: "video"
                    });
                  }
                }
              }
            }
            
            // Also check render formats for higher qualities
            if (infoData.render?.formats && Array.isArray(infoData.render.formats)) {
              for (const format of infoData.render.formats) {
                if (format.qualityLabel && !qualitySet.has(format.qualityLabel)) {
                  qualitySet.add(format.qualityLabel);
                  qualities.push({
                    quality: format.qualityLabel,
                    format: "video"
                  });
                }
              }
            }
            
            // Sort by resolution (highest first)
            qualities.sort((a, b) => {
              const resA = parseInt(a.quality.replace(/\D/g, '') || "0");
              const resB = parseInt(b.quality.replace(/\D/g, '') || "0");
              return resB - resA;
            });
            
            if (qualities.length > 0) {
              media = qualities;
              console.log("Found merged qualities:", qualities.map(q => q.quality).join(", "));
            }
            
            // Add audio option
            media.push({
              quality: "Audio (MP3)",
              format: "mp3",
            });
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
