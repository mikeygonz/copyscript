import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

type TranscriptItem = {
  text: string
  offset: number
  duration: number
}

type InnertubeConfig = {
  apiKey: string
  clientName: string
  clientVersion: string
}

function decodeTranscriptText(text: string): string {
  return text
    .replace(/&amp;#39;/g, "'")
    .replace(/&amp;quot;/g, '"')
    .replace(/&amp;amp;/g, '&')
    .replace(/&amp;gt;/g, '>')
    .replace(/&amp;lt;/g, '<')
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}

function parseTranscriptXML(xmlText: string): TranscriptItem[] {
  // Parse XML transcript format
  // Format: <transcript><text start="0.0" dur="5.5">Hello world</text>...</transcript>
  const textMatches = xmlText.matchAll(/<text start="([\d.]+)" dur="([\d.]+)"[^>]*>(.*?)<\/text>/g)

  const items: TranscriptItem[] = []

  for (const match of textMatches) {
    const start = parseFloat(match[1])
    const duration = parseFloat(match[2])
    const text = decodeTranscriptText(match[3])

    items.push({
      text,
      offset: start * 1000, // Convert to milliseconds
      duration: duration * 1000, // Convert to milliseconds
    })
  }

  return items
}

function extractCaptionTracksFromHTML(html: string): any[] | null {
  // Try to extract ytInitialPlayerResponse
  const playerResponseMarkers = [
    'var ytInitialPlayerResponse = ',
    'ytInitialPlayerResponse = ',
  ]

  for (const marker of playerResponseMarkers) {
    const startIndex = html.indexOf(marker)
    if (startIndex === -1) continue

    console.log(`[Edge] Found marker "${marker}"`)
    const jsonStart = startIndex + marker.length

    // Extract JSON by counting braces
    let braceCount = 0
    let jsonEnd = jsonStart
    let inString = false
    let escapeNext = false

    for (let i = jsonStart; i < html.length && i < jsonStart + 2000000; i++) {
      const char = html[i]

      if (escapeNext) {
        escapeNext = false
        continue
      }

      if (char === '\\') {
        escapeNext = true
        continue
      }

      if (char === '"') {
        inString = !inString
        continue
      }

      if (!inString) {
        if (char === '{') braceCount++
        if (char === '}') {
          braceCount--
          if (braceCount === 0 && i > jsonStart) {
            const nextChars = html.substring(i + 1, i + 20)
            if (nextChars.match(/^\s*[;<]/)) {
              jsonEnd = i + 1
              break
            }
          }
        }
      }
    }

    if (jsonEnd > jsonStart) {
      try {
        const jsonStr = html.substring(jsonStart, jsonEnd)
        const playerResponse = JSON.parse(jsonStr)
        console.log('[Edge] Parsed ytInitialPlayerResponse')

        // Extract caption tracks
        const captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks ||
                             playerResponse?.captions?.playerCaptionsRenderer?.captionTracks

        if (captionTracks && Array.isArray(captionTracks) && captionTracks.length > 0) {
          console.log('[Edge] Found', captionTracks.length, 'caption tracks')
          return captionTracks
        }
      } catch (e) {
        console.log('[Edge] Failed to parse playerResponse:', e instanceof Error ? e.message : String(e))
      }
    }
  }

  return null
}

function extractInnertubeConfig(html: string): InnertubeConfig | null {
  const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/)
  const clientNameMatch = html.match(/"INNERTUBE_CLIENT_NAME":"([^"]+)"/)
  const clientVersionMatch = html.match(/"INNERTUBE_CLIENT_VERSION":"([^"]+)"/)

  if (apiKeyMatch && clientNameMatch && clientVersionMatch) {
    return {
      apiKey: apiKeyMatch[1],
      clientName: clientNameMatch[1],
      clientVersion: clientVersionMatch[1],
    }
  }

  return null
}

async function fetchCaptionTracksFromPlayerApi(
  proxyUrl: string,
  videoId: string,
  config: InnertubeConfig
): Promise<any[] | null> {
  const clientAttempts: InnertubeConfig[] = [
    config,
    {
      apiKey: config.apiKey,
      clientName: 'ANDROID',
      clientVersion: '19.08.35',
    },
  ]

  for (const attempt of clientAttempts) {
    try {
      const response = await fetch(`${proxyUrl}/fetch-player`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId,
          apiKey: attempt.apiKey,
          clientName: attempt.clientName,
          clientVersion: attempt.clientVersion,
        }),
        signal: AbortSignal.timeout(15000),
      })

      if (!response.ok) {
        const text = await response.text()
        console.log(
          '[Edge] Player API proxy failed:',
          attempt.clientName,
          response.status,
          text.substring(0, 200)
        )
        continue
      }

      const data = await response.json()
      const playerResponse = data?.playerResponse || data
      const captionTracks =
        playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks ||
        playerResponse?.captions?.playerCaptionsRenderer?.captionTracks

      if (captionTracks && Array.isArray(captionTracks) && captionTracks.length > 0) {
        console.log(
          '[Edge] Found caption tracks via YouTube player API fallback (client:',
          attempt.clientName,
          ')'
        )
        return captionTracks
      }
    } catch (error) {
      console.log(
        '[Edge] Failed to fetch captions via player API (client',
        attempt.clientName,
        '):',
        error instanceof Error ? error.message : String(error)
      )
    }
  }

  return null
}

async function fetchTranscriptViaProxyLibrary(
  proxyUrl: string,
  videoId: string
): Promise<TranscriptItem[] | null> {
  try {
    const response = await fetch(`${proxyUrl}/get-transcript`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ videoId }),
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) {
      const text = await response.text()
      console.log('[Edge] Proxy transcript endpoint failed:', response.status, text.substring(0, 200))
      return null
    }

    const data = await response.json()
    if (Array.isArray(data?.transcript) && data.transcript.length > 0) {
      console.log('[Edge] Transcript fetched via proxy transcript endpoint')
      return data.transcript
        .map((item: any) => ({
          text: decodeTranscriptText(typeof item.text === 'string' ? item.text : ''),
          offset:
            typeof item.offset === 'number'
              ? Math.round(item.offset * 1000)
              : 0,
          duration:
            typeof item.duration === 'number'
              ? Math.round(item.duration * 1000)
              : 0,
        }))
        .filter((item) => item.text.length > 0)
    }
  } catch (error) {
    console.log(
      '[Edge] Proxy transcript endpoint error:',
      error instanceof Error ? error.message : String(error)
    )
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    const { videoId } = await request.json()

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 })
    }

    console.log('[Edge] Fetching transcript for video:', videoId)

    // Check if proxy is configured
    const proxyUrl = process.env.YOUTUBE_PROXY_URL
    console.log('[Edge] Proxy URL configured:', proxyUrl ? 'Yes' : 'No')
    if (proxyUrl) {
      console.log('[Edge] Proxy URL value:', proxyUrl)
      const proxyTranscript = await fetchTranscriptViaProxyLibrary(proxyUrl, videoId)
      if (proxyTranscript && proxyTranscript.length > 0) {
        return NextResponse.json({ transcript: proxyTranscript })
      }
    }

    let html: string

    if (proxyUrl) {
      // Use proxy server (recommended for production to bypass YouTube's serverless blocking)
      console.log('[Edge] Using proxy server:', proxyUrl)
      try {
        const proxyResponse = await fetch(`${proxyUrl}/fetch-youtube`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ videoId }),
          // Longer timeout for proxy requests
          signal: AbortSignal.timeout(15000),
        })

        if (!proxyResponse.ok) {
          const errorText = await proxyResponse.text()
          console.log('[Edge] Proxy failed with status:', proxyResponse.status, errorText)
          throw new Error(`Proxy returned ${proxyResponse.status}`)
        }

        const proxyData = await proxyResponse.json()
        html = proxyData.html
        console.log('[Edge] Successfully fetched via proxy, length:', html.length)
      } catch (proxyError) {
        console.log('[Edge] Proxy error:', proxyError instanceof Error ? proxyError.message : String(proxyError))

        // Fallback to direct fetch (will likely fail in production but works in dev)
        console.log('[Edge] Falling back to direct fetch')
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`
        const pageResponse = await fetch(videoUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'text/html',
            'Accept-Language': 'en-US,en;q=0.9',
          }
        })

        if (!pageResponse.ok) {
          throw new Error('Both proxy and direct fetch failed')
        }

        html = await pageResponse.text()
        console.log('[Edge] Fetched directly, length:', html.length)
      }
    } else {
      // No proxy configured - direct fetch (works locally, may fail in production)
      console.log('[Edge] No proxy configured, fetching directly')

      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`
      const pageResponse = await fetch(videoUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'text/html',
          'Accept-Language': 'en-US,en;q=0.9',
        }
      })

      if (!pageResponse.ok) {
        throw new Error('Failed to fetch video page')
      }

      html = await pageResponse.text()
      console.log('[Edge] Video page fetched, length:', html.length)
    }

    // Extract caption tracks from HTML
    let captionTracks = extractCaptionTracksFromHTML(html)

    if ((!captionTracks || captionTracks.length === 0) && proxyUrl) {
      console.log('[Edge] No caption tracks via HTML. Attempting player API fallback.')
      const innertubeConfig = extractInnertubeConfig(html)
      if (innertubeConfig) {
        captionTracks = await fetchCaptionTracksFromPlayerApi(proxyUrl, videoId, innertubeConfig)
      } else {
        console.log('[Edge] Could not extract Innertube config for player API fallback')
      }
    }

    if (!captionTracks || captionTracks.length === 0) {
      console.log('[Edge] No caption tracks found')
      return NextResponse.json(
        { error: 'No transcripts available for this video' },
        { status: 404 }
      )
    }

    // Find English track or use first available
    const track = captionTracks.find((t: any) => t.languageCode === 'en') || captionTracks[0]

    if (!track?.baseUrl) {
      return NextResponse.json(
        { error: 'No transcript URL found' },
        { status: 404 }
      )
    }

    console.log('[Edge] Fetching transcript from URL')

    // Fetch the transcript XML - use proxy if available
    let xmlText: string

    if (proxyUrl) {
      try {
        const proxyResponse = await fetch(`${proxyUrl}/fetch-transcript`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: track.baseUrl }),
        })

        if (proxyResponse.ok) {
          const proxyData = await proxyResponse.json()
          xmlText = proxyData.xml
          console.log('[Edge] Fetched transcript XML via proxy')
        } else {
          throw new Error('Proxy transcript fetch failed')
        }
      } catch (e) {
        console.log('[Edge] Proxy transcript fetch failed, trying direct')
        const transcriptResponse = await fetch(track.baseUrl)
        xmlText = await transcriptResponse.text()
      }
    } else {
      const transcriptResponse = await fetch(track.baseUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        }
      })

      if (!transcriptResponse.ok) {
        throw new Error(`Failed to fetch transcript XML: ${transcriptResponse.status}`)
      }

      xmlText = await transcriptResponse.text()
    }

    console.log('[Edge] Transcript XML fetched, length:', xmlText.length)

    // Parse the XML transcript
    const items = parseTranscriptXML(xmlText)

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'Failed to parse transcript' },
        { status: 500 }
      )
    }

    console.log('[Edge] Success! Returning', items.length, 'transcript items')
    return NextResponse.json({ transcript: items })

  } catch (error) {
    console.error('[Edge] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
