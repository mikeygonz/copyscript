"use server"

import { YoutubeTranscript } from "@danielxceron/youtube-transcript"
import { YoutubeTranscript as YoutubeTranscriptAlt } from "youtube-transcript"

type TranscriptItem = {
  text: string
  offset: number
  duration: number
}

type VideoMetadata = {
  title: string
  thumbnail: string
  duration: string
  channelName?: string
  channelUrl?: string
}

type TranscriptState = {
  transcript?: TranscriptItem[]
  metadata?: VideoMetadata
  error?: string
} | null

function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

async function getYoutubeVideoMetadata(videoId: string, transcriptItems?: TranscriptItem[]): Promise<VideoMetadata | null> {
  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`)
    if (!response.ok) {
      return null
    }
    const data = await response.json()
    
    // Calculate duration from transcript if available
    // Find the maximum end time (offset + duration) across all items
    let duration = ''
    if (transcriptItems && transcriptItems.length > 0) {
      let maxEndTime = 0
      console.log("[v0] Calculating duration from", transcriptItems.length, "items")
      
      // Check a sample to determine if values are in seconds or milliseconds
      const sampleOffset = transcriptItems[0]?.offset || 0
      const sampleDuration = transcriptItems[0]?.duration || 0
      const likelyMilliseconds = sampleOffset > 1000 || sampleDuration > 1000
      
      console.log("[v0] Sample offset:", sampleOffset, "Sample duration:", sampleDuration)
      console.log("[v0] Likely milliseconds:", likelyMilliseconds)
      
      for (const item of transcriptItems) {
        const offsetValue = typeof item.offset === 'number' && !isNaN(item.offset) ? item.offset : 0
        const durationValue = typeof item.duration === 'number' && !isNaN(item.duration) ? item.duration : 0
        
        // Convert to seconds based on detected format
        const offsetSeconds = likelyMilliseconds ? offsetValue / 1000 : offsetValue
        const durationSeconds = likelyMilliseconds ? durationValue / 1000 : durationValue
        
        const endTime = offsetSeconds + durationSeconds
        
        if (endTime > maxEndTime) {
          maxEndTime = endTime
        }
      }
      
      // Also check the last item specifically
      const lastItem = transcriptItems[transcriptItems.length - 1]
      const lastOffset = typeof lastItem.offset === 'number' && !isNaN(lastItem.offset) ? lastItem.offset : 0
      const lastDuration = typeof lastItem.duration === 'number' && !isNaN(lastItem.duration) ? lastItem.duration : 0
      const lastOffsetSeconds = likelyMilliseconds ? lastOffset / 1000 : lastOffset
      const lastDurationSeconds = likelyMilliseconds ? lastDuration / 1000 : lastDuration
      const lastEndTime = lastOffsetSeconds + lastDurationSeconds
      
      console.log("[v0] Max end time calculated:", maxEndTime, "seconds")
      console.log("[v0] Last item offset:", lastOffset, "->", lastOffsetSeconds, "seconds")
      console.log("[v0] Last item duration:", lastDuration, "->", lastDurationSeconds, "seconds")
      console.log("[v0] Last item end time:", lastEndTime, "seconds")
      
      // Use the maximum of our calculated max and the last item's end time
      const finalDuration = Math.max(maxEndTime, lastEndTime)
      
      if (finalDuration > 0) {
        duration = formatDuration(finalDuration)
        console.log("[v0] Formatted duration:", duration)
      }
    }
    
    return {
      title: data.title || '',
      thumbnail: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      duration,
      channelName: data.author_name || undefined,
      channelUrl: data.author_url || undefined,
    }
  } catch (error) {
    console.log("[v0] ERROR fetching video metadata:", error)
    return null
  }
}

async function getYoutubeTranscript(videoId: string): Promise<TranscriptItem[]> {
  console.log("[v0] Fetching transcript for video:", videoId)
  console.log("[v0] Environment:", process.env.NODE_ENV)
  console.log("[v0] Vercel:", process.env.VERCEL ? "Yes" : "No")

  // In production/Vercel, skip libraries and use custom fetch directly
  // Libraries don't work in serverless environments
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    console.log("[v0] Production detected - using custom fetch implementation")
    try {
      const transcriptItems = await fetchTranscriptCustom(videoId)
      console.log("[v0] Successfully fetched", transcriptItems.length, "transcript items with custom implementation")
      return transcriptItems
    } catch (customError) {
      console.log("[v0] Custom fetch failed:", customError instanceof Error ? customError.message : String(customError))
      throw customError
    }
  }

  // In development, try libraries first, then fallback to custom fetch
  try {
    console.log("[v0] Development mode - attempting with @danielxceron/youtube-transcript")
    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId) as any[]
    console.log("[v0] Successfully fetched", transcriptItems.length, "transcript items with primary library")
    return processTranscriptItems(transcriptItems)
  } catch (primaryError) {
    console.log("[v0] Primary library failed:", primaryError instanceof Error ? primaryError.message : String(primaryError))
    
    // Try alternative library as fallback
    try {
      console.log("[v0] Attempting with youtube-transcript (alternative)")
      const transcriptItems = await YoutubeTranscriptAlt.fetchTranscript(videoId) as any[]
      console.log("[v0] Successfully fetched", transcriptItems.length, "transcript items with alternative library")
      return processTranscriptItems(transcriptItems)
    } catch (altError) {
      console.log("[v0] Alternative library also failed:", altError instanceof Error ? altError.message : String(altError))
      
      // Fallback to custom fetch
      console.log("[v0] Attempting custom fetch implementation")
      const transcriptItems = await fetchTranscriptCustom(videoId)
      console.log("[v0] Successfully fetched", transcriptItems.length, "transcript items with custom implementation")
      return transcriptItems
    }
  }
}

async function fetchTranscriptCustom(videoId: string): Promise<TranscriptItem[]> {
  console.log("[v0] Custom fetch: Fetching video page for", videoId)
  
  // Custom implementation using fetch that Vercel will track
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`
  
  // Fetch the video page to get transcript data
  const pageResponse = await fetch(videoUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    }
  })
  
  if (!pageResponse.ok) {
    throw new Error(`Failed to fetch video page: ${pageResponse.status}`)
  }
  
  const html = await pageResponse.text()
  console.log("[v0] Custom fetch: Video page fetched, length:", html.length)
  
  // Try to find caption tracks using multiple strategies
  let captionTracks: any[] | null = null
  
  // Strategy 1: Look for ytInitialPlayerResponse in various formats
  const playerResponsePatterns = [
    /var ytInitialPlayerResponse\s*=\s*({.+?});/s,
    /"ytInitialPlayerResponse"\s*:\s*({.+?}),"responseContext"/s,
    /ytInitialPlayerResponse\s*=\s*({.+?});/s,
    /window\["ytInitialPlayerResponse"\]\s*=\s*({.+?});/s,
  ]
  
  for (const pattern of playerResponsePatterns) {
    const match = html.match(pattern)
    if (match) {
      try {
        const playerResponse = JSON.parse(match[1])
        captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks ||
                       playerResponse?.captions?.playerCaptionsRenderer?.captionTracks ||
                       playerResponse?.captions?.captionTracks
        
        if (captionTracks && Array.isArray(captionTracks) && captionTracks.length > 0) {
          console.log("[v0] Custom fetch: Found", captionTracks.length, "caption tracks via player response")
          break
        }
      } catch (e) {
        console.log("[v0] Custom fetch: Pattern matched but JSON parse failed:", e instanceof Error ? e.message : String(e))
        continue
      }
    }
  }
  
  // Strategy 2: Look for captionTracks directly in the HTML
  if (!captionTracks || captionTracks.length === 0) {
    const captionPatterns = [
      /"captionTracks"\s*:\s*(\[[\s\S]{0,50000}\])/,
      /captionTracks["\s]*:[\s]*(\[[\s\S]{0,50000}\])/,
    ]
    
    for (const pattern of captionPatterns) {
      const match = html.match(pattern)
      if (match) {
        try {
          captionTracks = JSON.parse(match[1])
          if (Array.isArray(captionTracks) && captionTracks.length > 0) {
            console.log("[v0] Custom fetch: Found caption tracks via direct match")
            break
          }
        } catch (e) {
          console.log("[v0] Custom fetch: Failed to parse caption tracks directly:", e instanceof Error ? e.message : String(e))
          continue
        }
      }
    }
  }
  
  // Strategy 3: Look for ytInitialData which might contain captions
  if (!captionTracks || captionTracks.length === 0) {
    const ytInitialDataMatch = html.match(/var ytInitialData\s*=\s*({.+?});/s)
    if (ytInitialDataMatch) {
      try {
        const initialData = JSON.parse(ytInitialDataMatch[1])
        // Navigate through possible paths
        captionTracks = initialData?.contents?.twoColumnWatchNextResults?.results?.results?.contents?.[0]?.videoPrimaryInfoRenderer?.videoActions?.menuRenderer?.topLevelButtons?.[0]?.toggleButtonRenderer?.defaultServiceEndpoint?.signalServiceEndpoint?.actions?.[0]?.openPopupAction?.popup?.transcriptRenderer?.captionTracks ||
                       initialData?.playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks
        if (captionTracks && Array.isArray(captionTracks) && captionTracks.length > 0) {
          console.log("[v0] Custom fetch: Found caption tracks via ytInitialData")
        }
      } catch (e) {
        console.log("[v0] Custom fetch: Failed to parse ytInitialData:", e instanceof Error ? e.message : String(e))
      }
    }
  }
  
  // Strategy 4: Try to find transcript URL patterns directly
  if (!captionTracks || captionTracks.length === 0) {
    // Look for transcript API URLs in the HTML
    const transcriptUrlMatch = html.match(/https:\/\/www\.youtube\.com\/api\/timedtext[^"'\s]+/g)
    if (transcriptUrlMatch && transcriptUrlMatch.length > 0) {
      console.log("[v0] Custom fetch: Found transcript URL pattern, attempting direct fetch")
      // Try to fetch the first transcript URL found
      try {
        const transcriptUrl = transcriptUrlMatch[0].replace(/\\u0026/g, '&')
        const transcriptResponse = await fetch(transcriptUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          }
        })
        if (transcriptResponse.ok) {
          const xmlText = await transcriptResponse.text()
          return parseTranscriptXML(xmlText)
        }
      } catch (e) {
        console.log("[v0] Custom fetch: Failed to fetch transcript URL:", e instanceof Error ? e.message : String(e))
      }
    }
  }
  
  if (!captionTracks || captionTracks.length === 0) {
    // Log a sample of the HTML to help debug
    const sampleHtml = html.substring(0, 2000)
    console.log("[v0] Custom fetch: HTML sample (first 2000 chars):", sampleHtml)
    console.log("[v0] Custom fetch: Searching for 'caption' in HTML:", html.includes('caption'))
    console.log("[v0] Custom fetch: Searching for 'transcript' in HTML:", html.includes('transcript'))
    throw new Error("No caption tracks found in video page. The video may not have transcripts available.")
  }
  
  return await fetchTranscriptFromCaptionTracks(captionTracks)
}

async function fetchTranscriptFromCaptionTracks(captionTracks: any[]): Promise<TranscriptItem[]> {
  // Find English transcript first, or use the first available
  const track = captionTracks.find((t: any) => t.languageCode === 'en') || captionTracks[0]
  
  if (!track || !track.baseUrl) {
    throw new Error("No transcript URL found")
  }
  
  console.log("[v0] Custom fetch: Fetching transcript from URL:", track.baseUrl.substring(0, 100) + "...")
  
  // Fetch the transcript XML
  const transcriptResponse = await fetch(track.baseUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    }
  })
  
  if (!transcriptResponse.ok) {
    throw new Error(`Failed to fetch transcript XML: ${transcriptResponse.status}`)
  }
  
  const xmlText = await transcriptResponse.text()
  console.log("[v0] Custom fetch: Transcript XML fetched, length:", xmlText.length)
  
  // Parse the XML transcript
  return parseTranscriptXML(xmlText)
}

function parseTranscriptXML(xmlText: string): TranscriptItem[] {
  // Parse XML transcript format
  // Format: <transcript><text start="0.0" dur="5.5">Hello world</text>...</transcript>
  const textMatches = xmlText.matchAll(/<text start="([\d.]+)" dur="([\d.]+)">(.*?)<\/text>/g)
  
  const items: TranscriptItem[] = []
  
  for (const match of textMatches) {
    const start = parseFloat(match[1])
    const duration = parseFloat(match[2])
    const text = match[3]
      .replace(/&amp;#39;/g, "'")
      .replace(/&amp;quot;/g, '"')
      .replace(/&amp;amp;/g, "&")
      .replace(/&amp;gt;/g, ">")
      .replace(/&amp;lt;/g, "<")
      .trim()
    
    items.push({
      text,
      offset: start * 1000, // Convert to milliseconds
      duration: duration * 1000, // Convert to milliseconds
    })
  }
  
  console.log("[v0] Custom fetch: Parsed", items.length, "transcript items")
  return items
}

function processTranscriptItems(transcriptItems: any[]): TranscriptItem[] {
  console.log("[v0] Processing", transcriptItems.length, "transcript items")
  console.log("[v0] First item sample:", JSON.stringify(transcriptItems[0], null, 2))
  console.log("[v0] Sample offsets:", transcriptItems.slice(0, 5).map((item: any) => item.offset))
  console.log("[v0] Sample items with missing offsets:", transcriptItems.slice(0, 10).map((item: any, idx: number) => ({
    index: idx,
    hasOffset: 'offset' in item,
    hasStart: 'start' in item,
    offset: item.offset,
    start: item.start,
    text: item.text?.substring(0, 30)
  })))
  
  // Check for items with zero or missing offsets in the middle/end
  const itemsWithZeroOffset = transcriptItems
    .map((item: any, idx: number) => ({ 
      index: idx, 
      offset: item.offset, 
      start: item.start,
      hasOffset: 'offset' in item,
      hasStart: 'start' in item
    }))
    .filter((item: any) => {
      const offset = item.offset ?? item.start ?? 0
      return offset === 0 || offset === null || offset === undefined
    })
  
  if (itemsWithZeroOffset.length > 0) {
    console.log("[v0] Found", itemsWithZeroOffset.length, "items with zero/missing offsets")
    console.log("[v0] First few zero-offset items:", itemsWithZeroOffset.slice(0, 5))
  }

  // Decode HTML entities and return items with timestamps
  // The library might use 'offset' or 'start' - check both
  // Also track cumulative time for items missing timestamps
  // Determine unit format from first item
  const firstItem = transcriptItems[0] as any
  const sampleOffset = firstItem?.offset ?? firstItem?.start ?? 0
  const likelyMilliseconds = sampleOffset > 1000
  
  let lastEndTime = 0 // Track last item's end time in seconds
  
  return transcriptItems.map((item: any, index: number) => {
    // Try offset first, then start, then calculate from previous item's end time
    let offset: number = 0
    let offsetInSeconds: number = 0
    let hasExplicitOffset = false
    
    if (typeof item.offset === 'number' && !isNaN(item.offset)) {
      // Use explicit offset if it exists (even if 0, but only if at start)
      if (index === 0 || item.offset > 0) {
        offset = item.offset
        offsetInSeconds = likelyMilliseconds ? offset / 1000 : offset
        hasExplicitOffset = true
      }
    } else if (typeof item.start === 'number' && !isNaN(item.start)) {
      // Use explicit start if it exists
      if (index === 0 || item.start > 0) {
        offset = item.start
        offsetInSeconds = likelyMilliseconds ? offset / 1000 : offset
        hasExplicitOffset = true
      }
    }
    
    // If no explicit offset and we're past the first item, use last end time
    if (!hasExplicitOffset && index > 0 && lastEndTime > 0) {
      offsetInSeconds = lastEndTime
      offset = likelyMilliseconds ? lastEndTime * 1000 : lastEndTime
    } else if (!hasExplicitOffset && index === 0) {
      // First item with no offset - use 0
      offset = 0
      offsetInSeconds = 0
    }
    
    // Get duration and convert to seconds
    const duration = typeof item.duration === 'number' && !isNaN(item.duration) && item.duration > 0 
      ? item.duration 
      : 0
    const durationInSeconds = likelyMilliseconds ? duration / 1000 : duration
    
    // Calculate end time for next iteration
    const currentEndTime = offsetInSeconds + durationInSeconds
    // Use the maximum to handle cases where offsets might go backwards
    lastEndTime = Math.max(lastEndTime, currentEndTime)
    
    // Log when we're using calculated offsets
    if (index > 0 && !hasExplicitOffset && lastEndTime > 0) {
      console.log(`[v0] Item ${index} missing offset, using calculated: ${offsetInSeconds.toFixed(2)}s (${Math.round(offset)}ms)`)
    }
    
    return {
      text: item.text
        .replace(/&amp;#39;/g, "'")
        .replace(/&amp;quot;/g, '"')
        .replace(/&amp;amp;/g, "&")
        .replace(/&amp;gt;/g, ">")
        .replace(/&amp;lt;/g, "<")
        .trim(),
      offset: offset,
      duration: duration,
    }
  })
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
    const metadata = await getYoutubeVideoMetadata(videoId, transcript)
    console.log("[v0] SUCCESS: Transcript fetched, length:", transcript.length)
    return { transcript, metadata: metadata || undefined }
  } catch (error) {
    console.log("[v0] ERROR in getTranscript:", error)
    console.log("[v0] Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    })
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    
    // Provide more helpful error messages
    let userFriendlyError = errorMessage
    if (errorMessage.includes("timeout")) {
      userFriendlyError = "The request timed out. Please try again or check if the video has transcripts enabled."
    } else if (errorMessage.includes("disabled") || errorMessage.includes("not available")) {
      userFriendlyError = "Transcripts are not available for this video. The video may have transcripts disabled."
    } else if (errorMessage.includes("404") || errorMessage.includes("not found")) {
      userFriendlyError = "Video not found. Please check the URL and try again."
    }
    
    return {
      error: `Unable to fetch transcript: ${userFriendlyError}`,
    }
  }
}
