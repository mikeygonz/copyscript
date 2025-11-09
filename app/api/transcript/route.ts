import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

type TranscriptItem = {
  text: string
  offset: number
  duration: number
}

function parseTranscriptXML(xmlText: string): TranscriptItem[] {
  // Parse XML transcript format
  // Format: <transcript><text start="0.0" dur="5.5">Hello world</text>...</transcript>
  const textMatches = xmlText.matchAll(/<text start="([\d.]+)" dur="([\d.]+)"[^>]*>(.*?)<\/text>/g)
  
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
      .replace(/&apos;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim()
    
    items.push({
      text,
      offset: start * 1000, // Convert to milliseconds
      duration: duration * 1000, // Convert to milliseconds
    })
  }
  
  return items
}

export async function POST(request: NextRequest) {
  try {
    const { videoId } = await request.json()
    
    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 })
    }

    console.log('[Edge] Fetching transcript for video:', videoId)
    
    // Try multiple language codes for the transcript
    const languageCodes = ['en', 'en-US', 'en-GB', 'a.en']
    
    for (const lang of languageCodes) {
      try {
        const transcriptUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&fmt=srv3`
        console.log('[Edge] Trying URL:', transcriptUrl)
        
        const response = await fetch(transcriptUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/xml,application/xml',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': `https://www.youtube.com/watch?v=${videoId}`,
          }
        })
        
        if (!response.ok) {
          console.log('[Edge] Failed with status:', response.status, 'for lang:', lang)
          continue
        }
        
        const xmlText = await response.text()
        console.log('[Edge] Fetched XML, length:', xmlText.length)
        
        // Check if we got valid XML
        if (!xmlText.includes('<text') && !xmlText.includes('<transcript>')) {
          console.log('[Edge] Response is not valid transcript XML for lang:', lang)
          continue
        }
        
        const items = parseTranscriptXML(xmlText)
        
        if (items.length === 0) {
          console.log('[Edge] No items parsed from XML for lang:', lang)
          continue
        }
        
        console.log('[Edge] Success! Fetched', items.length, 'items for lang:', lang)
        return NextResponse.json({ transcript: items })
      } catch (e) {
        console.log('[Edge] Error for lang', lang, ':', e instanceof Error ? e.message : String(e))
        continue
      }
    }
    
    // If all language codes failed, return error
    return NextResponse.json(
      { error: 'Transcript not available for this video' },
      { status: 404 }
    )
  } catch (error) {
    console.error('[Edge] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

