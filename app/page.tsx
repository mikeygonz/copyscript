import { TranscriptForm } from "@/components/transcript-form"

export default function Page() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-medium mb-2">YouTube Transcript</h1>
          <p className="text-sm text-muted-foreground">Paste a YouTube URL to extract its transcript</p>
        </div>
        <TranscriptForm />
      </div>
    </main>
  )
}
