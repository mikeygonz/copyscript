const fetch = globalThis.fetch || require('node-fetch');

function extractCaptionTracksFromHTML(html) {
  const playerResponseMarkers = [
    'var ytInitialPlayerResponse = ',
    'ytInitialPlayerResponse = ',
  ];

  for (const marker of playerResponseMarkers) {
    const startIndex = html.indexOf(marker);
    if (startIndex === -1) continue;

    const jsonStart = startIndex + marker.length;
    let braceCount = 0;
    let jsonEnd = jsonStart;
    let inString = false;
    let escapeNext = false;

    for (let i = jsonStart; i < html.length && i < jsonStart + 2000000; i++) {
      const char = html[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        escapeNext = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === '{') braceCount++;
        if (char === '}') {
          braceCount--;
          if (braceCount === 0 && i > jsonStart) {
            const nextChars = html.substring(i + 1, i + 20);
            if (/^\s*[;<]/.test(nextChars)) {
              jsonEnd = i + 1;
              break;
            }
          }
        }
      }
    }

    if (jsonEnd > jsonStart) {
      try {
        const jsonStr = html.substring(jsonStart, jsonEnd);
        const playerResponse = JSON.parse(jsonStr);
        const captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks ||
          playerResponse?.captions?.playerCaptionsRenderer?.captionTracks;
        if (captionTracks && Array.isArray(captionTracks) && captionTracks.length > 0) {
          console.log('Found caption tracks via', marker);
          return captionTracks;
        }
      } catch (err) {
        console.log('Failed to parse player response for marker', marker, err.message);
      }
    }
  }

  return null;
}

async function main() {
  const videoId = process.argv[2];
  if (!videoId) {
    console.error('Usage: node scripts/test-proxy.js <videoId>');
    process.exit(1);
  }

  const res = await fetch('https://youtube-transcript-proxy.fly.dev/fetch-youtube', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoId })
  });
  if (!res.ok) {
    console.error('Proxy response status:', res.status);
    console.error(await res.text());
    process.exit(1);
  }
  const data = await res.json();
  console.log('HTML length from proxy:', data.length, 'actual length', data.html?.length);
  const captionTracks = extractCaptionTracksFromHTML(data.html);
  if (!captionTracks) {
    console.error('No caption tracks found');
  } else {
    console.log('Caption tracks count:', captionTracks.length);
    console.log(captionTracks.map(t => ({ name: t.name?.simpleText, lang: t.languageCode })).slice(0, 5));
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
