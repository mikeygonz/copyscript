"use server"

import { YoutubeTranscript } from "@danielxceron/youtube-transcript"

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

  try {
    // Use desktop user agent to avoid mobile restrictions
    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: 'en'
    })
    console.log("[v0] Successfully fetched", transcriptItems.length, "transcript items")
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
  } catch (error) {
    console.log("[v0] ERROR fetching transcript:", error)
    throw error
  }
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
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    
    // Check for common error messages and provide helpful feedback
    let userFriendlyError = errorMessage
    if (errorMessage.toLowerCase().includes("transcript disabled") || 
        errorMessage.toLowerCase().includes("disabled for videos")) {
      userFriendlyError = "This video's transcript is not available. Some videos have transcripts disabled by the creator."
    } else if (errorMessage.toLowerCase().includes("could not retrieve")) {
      userFriendlyError = "Unable to retrieve transcript. The video may not have captions available."
    }
    
    return {
      error: `Unable to fetch transcript: ${userFriendlyError}`,
    }
  }
}
