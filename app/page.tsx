"use client";

import { TranscriptForm } from "@/components/transcript-form";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  const handleTitleClick = () => {
    router.refresh();
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-3 sm:p-4 bg-background">
      <div className="w-full max-w-6xl">
        <TranscriptForm
          titleElement={
            <div className="mb-4 flex flex-col gap-2 items-center justify-center text-center px-4">
              <button onClick={handleTitleClick} className="inline-block">
                <h1 className="text-xl sm:text-2xl font-normal text-white hover:opacity-80 transition-opacity cursor-pointer">
                  Instant YouTube transcripts
                </h1>
              </button>
              <p className="text-sm sm:text-base text-white/50 font-normal">
                Paste a link, copy your transcript
              </p>
            </div>
          }
        />
      </div>
    </main>
  );
}
