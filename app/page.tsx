"use client";

import { TranscriptForm } from "@/components/transcript-form";

export default function Page() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-6xl">
        <TranscriptForm
          titleElement={
            <div className="mb-4 flex flex-col gap-0 items-center justify-center text-center">
              <h1 className="text-[24px] font-normal font-sans leading-normal text-white text-center not-italic select-none pointer-events-none">
                Chat with any YouTube video
              </h1>
              <p
                className="text-[20px] font-normal font-sans leading-normal text-center not-italic select-none pointer-events-none"
                style={{ color: "rgba(255, 255, 255, 0.50)" }}
              >
                Paste a link. Get an AI-ready transcript instantly.
              </p>
            </div>
          }
        />
      </div>
    </main>
  );
}
