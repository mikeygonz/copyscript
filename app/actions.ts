"use server"

import { YoutubeTranscript } from "youtube-transcript"

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
    let duration = ''
    if (transcriptItems && transcriptItems.length > 0) {
      let maxEndTime = 0

      // Check a sample to determine if values are in seconds or milliseconds
      const sampleOffset = transcriptItems[0]?.offset || 0
      const sampleDuration = transcriptItems[0]?.duration || 0
      const likelyMilliseconds = sampleOffset > 1000 || sampleDuration > 1000

      for (const item of transcriptItems) {
        const offsetValue = typeof item.offset === 'number' && !isNaN(item.offset) ? item.offset : 0
        const durationValue = typeof item.duration === 'number' && !isNaN(item.duration) ? item.duration : 0

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

      const finalDuration = Math.max(maxEndTime, lastEndTime)

      if (finalDuration > 0) {
        duration = formatDuration(finalDuration)
      }
    }

    return {
      title: data.title || '',
      thumbnail: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      duration,
      channelName: data.author_name || undefined,
      channelUrl: data.author_url || undefined,
    }
  } catch {
    return null
  }
}

async function getYoutubeTranscript(videoId: string): Promise<TranscriptItem[]> {
  const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId) as any[]
  return processTranscriptItems(transcriptItems)
}

function processTranscriptItems(transcriptItems: any[]): TranscriptItem[] {
  const firstItem = transcriptItems[0] as any
  const sampleOffset = firstItem?.offset ?? firstItem?.start ?? 0
  const likelyMilliseconds = sampleOffset > 1000

  let lastEndTime = 0

  return transcriptItems.map((item: any, index: number) => {
    let offset: number = 0
    let offsetInSeconds: number = 0
    let hasExplicitOffset = false

    if (typeof item.offset === 'number' && !isNaN(item.offset)) {
      if (index === 0 || item.offset > 0) {
        offset = item.offset
        offsetInSeconds = likelyMilliseconds ? offset / 1000 : offset
        hasExplicitOffset = true
      }
    } else if (typeof item.start === 'number' && !isNaN(item.start)) {
      if (index === 0 || item.start > 0) {
        offset = item.start
        offsetInSeconds = likelyMilliseconds ? offset / 1000 : offset
        hasExplicitOffset = true
      }
    }

    if (!hasExplicitOffset && index > 0 && lastEndTime > 0) {
      offsetInSeconds = lastEndTime
      offset = likelyMilliseconds ? lastEndTime * 1000 : lastEndTime
    } else if (!hasExplicitOffset && index === 0) {
      offset = 0
      offsetInSeconds = 0
    }

    const duration = typeof item.duration === 'number' && !isNaN(item.duration) && item.duration > 0
      ? item.duration
      : 0
    const durationInSeconds = likelyMilliseconds ? duration / 1000 : duration

    const currentEndTime = offsetInSeconds + durationInSeconds
    lastEndTime = Math.max(lastEndTime, currentEndTime)

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

  if (!url) {
    return { error: "Please enter a valid YouTube URL" }
  }

  let videoId: string | null = null
  try {
    const urlObj = new URL(url)
    if (urlObj.hostname.includes("youtube.com")) {
      videoId = urlObj.searchParams.get("v")
    } else if (urlObj.hostname.includes("youtu.be")) {
      videoId = urlObj.pathname.slice(1)
    }

    if (!videoId) {
      return { error: "Please enter a valid YouTube URL" }
    }
  } catch {
    return { error: "Please enter a valid YouTube URL" }
  }

  try {
    const transcript = await getYoutubeTranscript(videoId)
    const metadata = await getYoutubeVideoMetadata(videoId, transcript)
    return { transcript, metadata: metadata || undefined }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    let userFriendlyError = errorMessage
    if (errorMessage.includes("Transcript is disabled")) {
      userFriendlyError = "Transcripts are disabled for this video."
    } else if (errorMessage.includes("No transcripts available") || errorMessage.includes("No transcript")) {
      userFriendlyError = "This video doesn't have transcripts available. Not all YouTube videos have captions enabled."
    } else if (errorMessage.includes("Video unavailable")) {
      userFriendlyError = "This video is unavailable or private."
    }

    return {
      error: `Unable to fetch transcript: ${userFriendlyError}`,
    }
  }
}
