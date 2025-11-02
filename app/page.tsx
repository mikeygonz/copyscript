"use client";

import { TranscriptForm } from "@/components/transcript-form";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  const handleTitleClick = () => {
    router.refresh();
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <button onClick={handleTitleClick} className="inline-block">
            <h1 className="text-2xl font-medium mb-2 text-foreground hover:opacity-80 transition-opacity cursor-pointer">
              YouTube Transcript
            </h1>
          </button>
          <p className="text-sm text-muted-foreground">
            Paste a YouTube URL to extract its transcript
          </p>
        </div>
        <TranscriptForm />
      </div>
    </main>
  );
}
