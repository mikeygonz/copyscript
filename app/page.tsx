"use client";

import { TranscriptForm } from "@/components/transcript-form";

export default function Page() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-6xl">
        <TranscriptForm
          titleElement={
            <div className="mb-4 flex flex-col gap-2 items-center justify-center text-center">
              <h1 className="text-2xl font-normal text-white select-none pointer-events-none">
                Instant YouTube transcripts
              </h1>
              <p className="text-base text-white/50 font-normal select-none pointer-events-none">
                Paste a link, copy your transcript
              </p>
            </div>
          }
        />
      </div>
    </main>
  );
}
