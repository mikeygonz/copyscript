"use client";

import { useState, useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { getTranscript } from "@/app/actions";
import { Copy, Check, Clock, Plus } from "lucide-react";
import Image from "next/image";

type RecentSearch = {
  videoId: string;
  url: string;
  title: string;
  thumbnail: string;
  duration: string;
  channelName?: string;
};

export const TranscriptForm = () => {
  const [state, formAction, isPending] = useActionState(getTranscript, null);
  const [copied, setCopied] = useState(false);
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [currentUrl, setCurrentUrl] = useState("");
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  const handleCopy = async () => {
    if (state?.transcript) {
      const textToCopy = showTimestamps
        ? state.transcript
            .map((item) => {
              const offsetValue =
                typeof item.offset === "number" && !isNaN(item.offset)
                  ? item.offset
                  : 0;
              // Offset is always in milliseconds from the library, convert to seconds
              const seconds = offsetValue / 1000;
              const timestamp = formatTimestamp(seconds);
              return `[${timestamp}] ${item.text}`;
            })
            .join("\n")
        : state.transcript.map((item) => item.text).join("\n");
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  function formatTimestamp(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }

  function extractVideoId(url: string): string | null {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes("youtube.com")) {
        return urlObj.searchParams.get("v");
      } else if (urlObj.hostname.includes("youtu.be")) {
        return urlObj.pathname.slice(1);
      }
      return null;
    } catch {
      return null;
    }
  }

  // Load recent searches from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("recentSearches");
      if (stored) {
        try {
          setRecentSearches(JSON.parse(stored));
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }, []);

  // Save to recent searches when a new transcript is fetched
  useEffect(() => {
    if (
      state?.metadata &&
      state?.transcript &&
      currentUrl &&
      typeof window !== "undefined"
    ) {
      const videoId = extractVideoId(currentUrl);
      if (!videoId) return;

      const searchEntry: RecentSearch = {
        videoId,
        url: currentUrl,
        title: state.metadata.title,
        thumbnail: state.metadata.thumbnail,
        duration: state.metadata.duration,
        channelName: state.metadata.channelName,
      };

      setSelectedVideoId(videoId);

      setRecentSearches((prev) => {
        const filtered = prev.filter((s) => s.videoId !== searchEntry.videoId);
        const updated = [searchEntry, ...filtered].slice(0, 10); // Keep up to 10 recent searches
        localStorage.setItem("recentSearches", JSON.stringify(updated));
        return updated;
      });
    }
  }, [state?.metadata, state?.transcript, currentUrl]);

  const handleRecentSearchClick = (url: string) => {
    const input = document.querySelector(
      'input[name="url"]'
    ) as HTMLInputElement;
    if (input) {
      input.value = url;
      setCurrentUrl(url);
      // Submit the form
      const form = input.closest("form");
      if (form) {
        form.requestSubmit();
      }
    }
  };

  const handleNewSearch = () => {
    const input = document.querySelector(
      'input[name="url"]'
    ) as HTMLInputElement;
    if (input) {
      input.value = "";
      input.focus();
      setCurrentUrl("");
    }
  };

  return (
    <div className="space-y-6">
      <form
        action={formAction}
        onSubmit={(e) => {
          const formData = new FormData(e.currentTarget);
          const url = formData.get("url") as string;
          setCurrentUrl(url);
        }}
      >
        <div className="flex gap-2">
          <Input
            type="url"
            name="url"
            placeholder="https://youtube.com/watch?v=..."
            required
            disabled={isPending}
            className="flex-1"
          />
          <Button type="submit" disabled={isPending}>
            {isPending ? "Fetching..." : "Get Transcript"}
          </Button>
        </div>
      </form>

      {state?.error && (
        <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
          {state.error}
        </div>
      )}

      {recentSearches.length > 0 && !state?.transcript && !isPending && (
        <div className="space-y-3">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2">
            Recent Searches
          </h2>
          <div className="space-y-2">
            {recentSearches.map((search) => (
              <Card
                key={search.videoId}
                className="p-0 overflow-hidden cursor-pointer hover:bg-accent/50 transition-colors !py-0"
                onClick={() => handleRecentSearchClick(search.url)}
              >
                <div className="flex gap-3 p-3">
                  <div className="relative w-20 h-14 shrink-0">
                    <Image
                      src={search.thumbnail}
                      alt={search.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <h4 className="text-xs text-muted-foreground/80 line-clamp-2">
                      {search.title}
                    </h4>
                    {search.duration && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60 mt-1">
                        <Clock className="h-3 w-3" />
                        <span>{search.duration}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {(isPending || state?.transcript) && (
        <div className="flex gap-4">
          {/* Video History Sidebar - Show when there are recent searches */}
          {recentSearches.length > 0 && (
            <div className="w-48 shrink-0 space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2">
                History
              </h3>
              <div className="space-y-1">
                {recentSearches.map((search) => {
                  const isSelected = selectedVideoId === search.videoId;
                  return (
                    <button
                      key={search.videoId}
                      onClick={() => handleRecentSearchClick(search.url)}
                      className={`w-full text-left p-2 rounded-md transition-colors ${
                        isSelected
                          ? "bg-accent text-accent-foreground border border-border"
                          : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <div className="flex gap-2">
                        <div className="relative w-12 h-8 shrink-0">
                          <Image
                            src={search.thumbnail}
                            alt={search.title}
                            fill
                            className="object-cover rounded"
                            unoptimized
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium line-clamp-2 leading-tight">
                            {search.title}
                          </p>
                          {search.duration && (
                            <div className="flex items-center gap-1 mt-1">
                              <Clock className="h-2.5 w-2.5 opacity-60" />
                              <span className="text-[10px] opacity-60">
                                {search.duration}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Transcript Content */}
          <div className="flex-1 space-y-2">
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2">
                Transcript
              </h3>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center border border-border rounded-md p-0.5 bg-input shadow-sm">
                  <button
                    onClick={() => setShowTimestamps(true)}
                    disabled={isPending}
                    className={`h-7 px-3 text-xs rounded-sm transition-colors flex-1 whitespace-nowrap ${
                      showTimestamps
                        ? "bg-background text-foreground"
                        : "bg-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Timestamps
                  </button>
                  <button
                    onClick={() => setShowTimestamps(false)}
                    disabled={isPending}
                    className={`h-7 px-3 text-xs rounded-sm transition-colors flex-1 whitespace-nowrap ${
                      !showTimestamps
                        ? "bg-background text-foreground"
                        : "bg-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    No timestamps
                  </button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  disabled={isPending || !state?.transcript}
                  className="gap-2 text-xs"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
            <div className="bg-card border border-border rounded-md shadow-layered">
              <div className="p-4">
                {isPending ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  </div>
                ) : state?.transcript ? (
                  showTimestamps ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {state.transcript.map((item, index) => {
                        const offsetValue =
                          typeof item.offset === "number" && !isNaN(item.offset)
                            ? item.offset
                            : 0;
                        // Offset is always in milliseconds from the library, convert to seconds
                        const seconds = offsetValue / 1000;
                        const timestamp = formatTimestamp(seconds);
                        return (
                          <div key={index} className="flex gap-3">
                            <span className="text-muted-foreground text-xs font-mono shrink-0 tabular-nums">
                              {timestamp}
                            </span>
                            <span className="text-sm font-mono leading-relaxed flex-1">
                              {item.text}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto">
                      <pre className="text-sm font-mono leading-relaxed text-foreground whitespace-pre-wrap">
                        {state.transcript.map((item) => item.text).join(" ")}
                      </pre>
                    </div>
                  )
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
