# Copyscript

A simple web application for fetching and copying YouTube video transcripts.

## Features

- Fetch transcripts from YouTube videos
- Copy transcripts with or without timestamps
- View recent searches
- Keyboard accessible

## Installation

```bash
pnpm install
```

## Development

```bash
pnpm dev
```

## How It Works

This app uses the [`youtube-transcript`](https://www.npmjs.com/package/youtube-transcript) library to fetch transcripts directly from YouTube videos. The library extracts caption data from YouTube's public APIs.

**Note:** Not all YouTube videos have transcripts available. Videos must have captions enabled by the creator.

## Tech Stack

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Radix UI](https://www.radix-ui.com/) - Accessible components
- [youtube-transcript](https://www.npmjs.com/package/youtube-transcript) - Transcript fetching

## License

MIT
