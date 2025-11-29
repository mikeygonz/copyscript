# Copyscript

A fast, minimal tool for fetching YouTube video transcripts. Paste a link, get an AI-ready transcript instantly.

## Features

- **Instant transcripts** — Fetch captions from any YouTube video with transcripts enabled
- **AI-ready output** — Copy transcripts with or without timestamps, formatted for LLMs
- **Recent searches** — Quickly access previously fetched transcripts (stored locally)
- **Keyboard accessible** — Full keyboard navigation support
- **Mobile friendly** — Responsive design that works on any device

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
git clone https://github.com/gonz/copyscript.git
cd copyscript
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## How It Works

Uses the [`youtube-transcript`](https://www.npmjs.com/package/youtube-transcript) library to fetch transcripts directly from YouTube's caption data. No API keys required.

Note: This works locally but not when deployed — YouTube blocks requests from cloud server IPs.

## Tech Stack

- [Next.js 16](https://nextjs.org/)
- [React 19](https://react.dev/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)

## License

MIT

## Author

[Mike Gonzalez](https://gonz.co)
