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
git clone https://github.com/mikeygonz/copyscript.git
cd copyscript
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## How It Works

Uses the [`youtube-transcript`](https://www.npmjs.com/package/youtube-transcript) library to fetch transcripts directly from YouTube's caption data. No API keys required.

Note: This works locally but not when deployed — YouTube blocks requests from cloud server IPs.

## Project Structure

```
copyscript/
├── app/
│   ├── actions.ts      # Server actions for transcript fetching
│   ├── layout.tsx      # Root layout with theme provider
│   └── page.tsx        # Main page component
├── components/
│   ├── transcript-form.tsx  # Core UI component
│   └── ui/             # Reusable UI primitives (shadcn/ui)
├── lib/
│   └── utils.ts        # Utility functions
└── public/             # Static assets
```

## Tech Stack

- **[Next.js 16](https://nextjs.org/)** — App Router with Server Actions for secure server-side transcript fetching
- **[React 19](https://react.dev/)** — `useActionState` for form state, `startTransition` for non-blocking updates
- **[Tailwind CSS 4](https://tailwindcss.com/)** — Utility-first styling with CSS variables for theming
- **[Radix UI](https://www.radix-ui.com/)** — Accessible, unstyled primitives (via shadcn/ui)

## Architecture Decisions

- **Server Actions over API routes** — Transcript fetching runs server-side to avoid CORS issues and keep the client bundle small
- **Parallel API calls** — Metadata and transcript fetched concurrently with `Promise.all` for faster perceived load times
- **LocalStorage caching** — Transcripts cached client-side for instant reload of recent searches
- **No external dependencies for state** — React's built-in hooks handle all state management

## License

MIT

## Author

[Mike Gonzalez](https://gonz.co)
