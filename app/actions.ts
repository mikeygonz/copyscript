"use server"

import { parseStringPromise } from "xml2js"

type TranscriptState = {
  transcript?: string
  error?: string
} | null

async function getYoutubeTranscript(videoId: string): Promise<string> {
  console.log("[v0] Starting InnerTube API fetch for video:", videoId)

  // Step 1: Fetch video page to get INNERTUBE_API_KEY
  console.log("[v0] Step 1: Fetching video page HTML")
  const videoPageResponse = await fetch(`https://www.youtube.com/watch?v=${videoId}`)
  const videoPageHtml = await videoPageResponse.text()
  console.log("[v0] Video page fetched, HTML length:", videoPageHtml.length)

  const apiKeyMatch = videoPageHtml.match(/"INNERTUBE_API_KEY":"([^"]+)"/)
  if (!apiKeyMatch) {
    console.log("[v0] ERROR: Could not extract INNERTUBE_API_KEY from HTML")
    throw new Error("Could not extract API key")
  }
  const apiKey = apiKeyMatch[1]
  console.log("[v0] Successfully extracted API key:", apiKey.substring(0, 10) + "...")

  // Step 2: Call InnerTube player API with Android client context
  console.log("[v0] Step 2: Calling InnerTube player API")
  const playerResponse = await fetch(`https://www.youtube.com/youtubei/v1/player?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      context: {
        client: {
          clientName: "ANDROID",
          clientVersion: "19.09.37",
          androidSdkVersion: 30,
        },
      },
      videoId: videoId,
    }),
  })

  const playerData = await playerResponse.json()
  console.log("[v0] Player API response received")
  console.log("[v0] Has captions object:", !!playerData?.captions)

  // Step 3: Extract caption track URL
  const captionTracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks
  console.log("[v0] Caption tracks found:", captionTracks?.length || 0)

  if (!captionTracks || captionTracks.length === 0) {
    console.log("[v0] ERROR: No caption tracks available")
    console.log("[v0] Player data structure:", JSON.stringify(playerData, null, 2).substring(0, 500))
    throw new Error("No captions available for this video")
  }

  // Get English captions or first available
  const captionTrack = captionTracks.find((track: any) => track.languageCode === "en") || captionTracks[0]
  console.log("[v0] Selected caption track language:", captionTrack.languageCode)
  const captionUrl = captionTrack.baseUrl

  // Step 4: Fetch and parse XML captions
  console.log("[v0] Step 4: Fetching caption XML from:", captionUrl.substring(0, 50) + "...")
  const captionResponse = await fetch(captionUrl)
  const captionXml = await captionResponse.text()
  console.log("[v0] Caption XML fetched, length:", captionXml.length)

  // Parse XML to extract text
  const parsedXml = await parseStringPromise(captionXml)
  const textSegments = parsedXml.transcript.text.map((item: any) => item._)
  console.log("[v0] Successfully parsed", textSegments.length, "text segments")

  return textSegments.join(" ").replace(/\s+/g, " ").trim()
}

export async function getTranscript(_prevState: TranscriptState, formData: FormData): Promise<TranscriptState> {
  const url = formData.get("url") as string
  console.log("[v0] getTranscript called with URL:", url)

  if (!url) {
    return { error: "Please provide a YouTube URL" }
  }

  // Extract video ID from URL
  let videoId: string | null = null
  try {
    const urlObj = new URL(url)
    if (urlObj.hostname.includes("youtube.com")) {
      videoId = urlObj.searchParams.get("v")
    } else if (urlObj.hostname.includes("youtu.be")) {
      videoId = urlObj.pathname.slice(1)
    }

    if (!videoId) {
      return { error: "Invalid YouTube URL" }
    }
    console.log("[v0] Extracted video ID:", videoId)
  } catch {
    return { error: "Invalid URL format" }
  }

  try {
    const transcript = await getYoutubeTranscript(videoId)
    console.log("[v0] SUCCESS: Transcript fetched, length:", transcript.length)
    return { transcript }
  } catch (error) {
    console.log("[v0] ERROR in getTranscript:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return {
      error: `Unable to fetch transcript: ${errorMessage}`,
    }
  }
}
