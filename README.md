# Instant Video Downloader

You are an expert full-stack web developer.

Build a modern, production-ready web application called “All Video Downloader”.

GOAL:
Users can paste a video link from Facebook, Instagram, YouTube, or TikTok and download the video instantly.

TECH STACK:
- Frontend: React + Tailwind CSS
- Backend: Node.js (Express)
- No authentication required
- Mobile-friendly, clean UI

UI REQUIREMENTS:
1. Centered card layout
2. Input field with placeholder: “Paste video link here…”
3. Large “Download” button
4. Loading spinner while processing
5. Error message if link is invalid
6. Show video thumbnail, title, and quality after fetch
7. Final “Download Video” button

BACKEND LOGIC:
- Create two API routes:
  1. POST /fetch
     - Accepts: { url }
     - Calls external downloader API
     - Returns video metadata and available download links

  2. POST /download
     - Accepts selected download URL
     - Returns direct downloadable link

EXTERNAL API INTEGRATION:
- Use FastSaverAPI (or similar downloader API)
- API key must be stored as an environment secret
- Do NOT expose API key on frontend

FLOW:
1. User pastes video URL
2. Frontend calls /fetch
3. Backend calls external downloader API
4. Show available quality options
5. User clicks Download
6. Browser downloads the video

ERROR HANDLING:
- Invalid URL
- Unsupported platform
- API failure
- Show user-friendly messages

EXTRA:
- Add footer text: “For educational purposes only”
- Clean, simple, fast UX

Deliver a fully working app with clear code structure.


FastSaverAPI – Exact Backend Code (Node.js + Express)
1️⃣ Environment Variable সেট করো (Lovable / VPS)

Lovable → Secrets / Environment

FASTSAVER_API_KEY = u5xSPbB9fJPf8wb7vMxgyvUf


❌ কোডে key লিখবে না
✅ এখানে লিখলেই হবে

2️⃣ Backend: server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const FASTSAVER_API_KEY = process.env.FASTSAVER_API_KEY;

// 🔹 FETCH VIDEO INFO
app.post("/fetch", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "Video URL is required" });
    }

    const response = await fetch("https://fastsaverapi.com/api/downloader", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": FASTSAVER_API_KEY
      },
      body: JSON.stringify({ url })
    });

    const data = await response.json();

    if (!data.status) {
      return res.status(400).json({ error: "Failed to fetch video" });
    }

    res.json(data);

  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// 🔹 DOWNLOAD (redirect to real file)
app.post("/download", (req, res) => {
  const { downloadUrl } = req.body;

  if (!downloadUrl) {
    return res.status(400).json({ error: "Download URL required" });
  }

  res.redirect(downloadUrl);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

3️⃣ Frontend → /fetch call (example)
fetch("/fetch", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    url: "https://www.instagram.com/reel/XXXX"
  })
})
.then(res => res.json())
.then(data => {
  console.log(data);
  window.open(data.media[0].url);
});

🧠 পুরো Flow (এক লাইনে)
User URL → /fetch → FastSaverAPI → download link → /download → file

🔒 কেন API Key কোডে রাখিনি?

Frontend inspect করলে key চুরি হবে

Abuse হলে account block

Production app-এ এটা মারাত্মক ভুল

👉 তুমি যেভাবে করছো (Secrets দিয়ে) — সেটাই Professional way

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://appbdx.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/37ebc62e-6577-424a-85df-6f750dfcd9ca).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
