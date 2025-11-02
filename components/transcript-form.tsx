"use client";

import { useState, useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { getTranscript } from "@/app/actions";
import {
  Copy,
  Check,
  Clock,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
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
  const [cachedState, setCachedState] = useState<{
    transcript: any[];
    metadata: any;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [currentUrl, setCurrentUrl] = useState("");
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [lastSubmittedUrl, setLastSubmittedUrl] = useState<string>("");
  const [loadingVideoId, setLoadingVideoId] = useState<string | null>(null);

  // Use cached state if available, otherwise use action state
  const displayState = cachedState || state;

  const handleCopy = async () => {
    if (displayState?.transcript) {
      // Detect unit format once based on first item (consistent with backend)
      const firstItem = displayState.transcript[0];
      const sampleOffset = firstItem?.offset ?? 0;
      const likelyMilliseconds = sampleOffset > 1000;

      const textToCopy = showTimestamps
        ? displayState.transcript
            .map((item) => {
              const offsetValue =
                typeof item.offset === "number" && !isNaN(item.offset)
                  ? item.offset
                  : 0;

              // Use consistent detection based on first item
              const seconds = likelyMilliseconds
                ? offsetValue / 1000
                : offsetValue;
              const timestamp = formatTimestamp(seconds);
              return `[${timestamp}] ${item.text}`;
            })
            .join("\n")
        : displayState.transcript.map((item) => item.text).join("\n");
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
      lastSubmittedUrl &&
      typeof window !== "undefined"
    ) {
      const videoId = extractVideoId(lastSubmittedUrl);
      if (!videoId) {
        console.error(
          "[v0] Could not extract video ID from URL:",
          lastSubmittedUrl
        );
        return;
      }

      console.log(
        "[v0] Saving transcript to history - Video ID:",
        videoId,
        "Title:",
        state.metadata.title,
        "URL:",
        lastSubmittedUrl,
        "Current loadingVideoId:",
        loadingVideoId
      );

      // Clear cached state when new transcript is fetched
      setCachedState(null);

      const searchEntry: RecentSearch = {
        videoId,
        url: lastSubmittedUrl,
        title: state.metadata.title,
        thumbnail: state.metadata.thumbnail,
        duration: state.metadata.duration,
        channelName: state.metadata.channelName,
      };

      setSelectedVideoId(videoId);
      setCurrentUrl(lastSubmittedUrl); // Sync currentUrl with the URL we just fetched

      // Only add to recent searches if it's not already there
      // Don't reorder - keep original position
      setRecentSearches((prev) => {
        // Remove any existing entries with the same videoId first to prevent duplicates
        const withoutDuplicates = prev.filter(
          (s) => s.videoId !== searchEntry.videoId
        );

        // Add the new entry at the beginning
        const updated = [searchEntry, ...withoutDuplicates].slice(0, 10);
        localStorage.setItem("recentSearches", JSON.stringify(updated));
        console.log("[v0] Added new item to history:", searchEntry);

        // Clear loading state after this update completes
        // Check if the new item is now in the list
        if (updated.some((s) => s.videoId === videoId)) {
          // Use setTimeout to ensure this happens after React has processed the state update
          setTimeout(() => {
            console.log("[v0] Clearing loadingVideoId after history update");
            setLoadingVideoId(null);
          }, 0);
        }

        return updated;
      });

      // Cache transcript data
      localStorage.setItem(
        `transcriptCache_${videoId}`,
        JSON.stringify({
          transcript: state.transcript,
          metadata: state.metadata,
        })
      );
    }
  }, [state?.metadata, state?.transcript, lastSubmittedUrl]);

  const handleRecentSearchClick = (url: string, e?: React.MouseEvent) => {
    // Prevent click if clicking on delete button
    if (e && (e.target as HTMLElement).closest("[data-delete-button]")) {
      return;
    }

    const videoId = extractVideoId(url);
    if (!videoId) return;

    console.log("[v0] Clicking history item - Video ID:", videoId, "URL:", url);

    // Track which video is loading
    setLoadingVideoId(videoId);

    // Clear any previous state first
    setCachedState(null);
    setLastSubmittedUrl(""); // Clear submitted URL to prevent interference

    // Check if we have cached transcript data
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(`transcriptCache_${videoId}`);
      console.log(
        "[v0] Cache lookup for videoId:",
        videoId,
        "Found:",
        !!cached
      );

      if (cached) {
        try {
          const cachedData = JSON.parse(cached);
          console.log(
            "[v0] Loading cached transcript for:",
            videoId,
            "Title:",
            cachedData.metadata?.title
          );

          const input = document.querySelector(
            'input[name="url"]'
          ) as HTMLInputElement;
          if (input) {
            input.value = url;
            setCurrentUrl(url);
          }

          // Show skeleton briefly, then load cached data
          // Use setTimeout to ensure skeleton shows first (minimum 200ms for better UX)
          setTimeout(() => {
            setCachedState({
              transcript: cachedData.transcript,
              metadata: cachedData.metadata,
            });
            setSelectedVideoId(videoId);
            setLoadingVideoId(null); // Clear loading state
          }, 200); // Small delay to show skeleton
          return;
        } catch (e) {
          // If cache parsing fails, fall through to normal fetch
          console.error("[v0] Error parsing cached transcript:", e);
        }
      } else {
        console.log("[v0] No cached transcript found for:", videoId);
      }
    }

    // No cache found, clear cached state and proceed with normal fetch
    setCachedState(null);
    setLastSubmittedUrl(url); // Set this so the useEffect knows which URL we're fetching
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

  const handleDeleteClick = (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.videoId !== videoId);
      localStorage.setItem("recentSearches", JSON.stringify(filtered));

      // Also delete cached transcript
      if (typeof window !== "undefined") {
        localStorage.removeItem(`transcriptCache_${videoId}`);
      }

      // If this was the last item, clear the transcript display
      if (filtered.length === 0) {
        setSelectedVideoId(null);
        setCachedState(null);
        setLastSubmittedUrl("");
        setCurrentUrl("");
        // Clear the input field
        const input = document.querySelector(
          'input[name="url"]'
        ) as HTMLInputElement;
        if (input) {
          input.value = "";
        }
      }

      return filtered;
    });

    // Clear selected if deleting current item
    if (selectedVideoId === videoId) {
      setSelectedVideoId(null);
      setCachedState(null);
      setLastSubmittedUrl("");
      setCurrentUrl("");
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
          const videoId = extractVideoId(url);
          setCurrentUrl(url);
          setLastSubmittedUrl(url); // Track the URL we just submitted
          setLoadingVideoId(videoId || null); // Track which video is loading
          setSelectedVideoId(null); // Clear selected state when loading new video
          setCachedState(null); // Clear cached state
          // Clear any existing history entry for this video to prevent showing old metadata
          if (videoId) {
            setRecentSearches((prev) => {
              const filtered = prev.filter((s) => s.videoId !== videoId);
              if (filtered.length !== prev.length) {
                localStorage.setItem(
                  "recentSearches",
                  JSON.stringify(filtered)
                );
                // Also clear cached transcript to prevent stale data
                if (typeof window !== "undefined") {
                  localStorage.removeItem(`transcriptCache_${videoId}`);
                }
              }
              return filtered;
            });
          }
          console.log("[v0] Form submitted with URL:", url);
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
          <Button
            type="submit"
            disabled={isPending}
            className="font-semibold text-sm"
          >
            {isPending ? "Fetching..." : "Get Transcript"}
          </Button>
        </div>
      </form>

      {state?.error && (
        <div className="text-sm text-muted-foreground/70">{state.error}</div>
      )}

      {recentSearches.length > 0 && !displayState?.transcript && !isPending && (
        <div className="space-y-3">
          <h2 className="text-xs font-medium text-muted-foreground/50 uppercase tracking-wider px-2">
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
                    <h4 className="text-xs text-muted-foreground/70 line-clamp-2">
                      {search.title}
                    </h4>
                    {search.channelName && (
                      <div className="text-[10px] text-muted-foreground/70 mt-0.5">
                        {search.channelName}
                      </div>
                    )}
                    {search.duration && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70 mt-1">
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

      {(isPending ||
        (displayState?.transcript &&
          (recentSearches.length > 0 || selectedVideoId !== null))) && (
        <div className="flex gap-4">
          {/* Video History Sidebar - Show when there are recent searches OR when loading */}
          {(recentSearches.length > 0 || isPending) && (
            <div className="w-48 shrink-0 space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground/50 uppercase tracking-wider px-2">
                History
              </h3>
              <div className="space-y-1">
                {loadingVideoId && recentSearches.length === 0 ? (
                  // Show skeleton placeholder when loading with no prior history
                  <div className="p-2 rounded-md animate-pulse">
                    <div className="flex gap-2">
                      <div className="relative w-12 h-8 shrink-0 bg-muted rounded"></div>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="h-3 bg-muted rounded w-3/4"></div>
                        <div className="flex items-center gap-1">
                          <div className="h-2.5 w-2.5 bg-muted rounded"></div>
                          <div className="h-2 bg-muted rounded w-12"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
                {loadingVideoId && recentSearches.length > 0 ? (
                  // Show skeleton placeholder for the currently loading item at the top
                  // This skeleton has no metadata - it's just a placeholder
                  <div className="p-2 rounded-md animate-pulse">
                    <div className="flex gap-2">
                      <div className="relative w-12 h-8 shrink-0 bg-muted rounded"></div>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="h-3 bg-muted rounded w-3/4"></div>
                        <div className="flex items-center gap-1">
                          <div className="h-2.5 w-2.5 bg-muted rounded"></div>
                          <div className="h-2 bg-muted rounded w-12"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
                {recentSearches
                  .filter((search) => {
                    // Always filter out the loading video ID to prevent duplicates
                    // This ensures old metadata doesn't show while loading
                    if (loadingVideoId && search.videoId === loadingVideoId) {
                      console.log(
                        "[v0] Filtering out loading video from history display:",
                        search.videoId,
                        "to prevent showing old metadata"
                      );
                      return false;
                    }
                    return true;
                  })
                  .map((search) => {
                    const isSelected = selectedVideoId === search.videoId;
                    return (
                      <div key={search.videoId} className="relative group">
                        <button
                          onClick={(e) =>
                            handleRecentSearchClick(search.url, e)
                          }
                          className={`w-full text-left p-2 rounded-md transition-colors border ${
                            isSelected
                              ? "bg-accent text-accent-foreground border-border"
                              : "border-transparent text-muted-foreground/50 hover:bg-accent/30 hover:text-foreground"
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
                                  <Clock className="h-2.5 w-2.5 opacity-40" />
                                  <span className="text-[10px] opacity-40">
                                    {search.duration}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                        <button
                          data-delete-button
                          onClick={(e) => handleDeleteClick(search.videoId, e)}
                          className="absolute top-1 right-1 p-1 rounded opacity-0 group-hover:opacity-60 hover:opacity-100 hover:bg-destructive/20 transition-opacity"
                        >
                          <X className="h-3 w-3 text-muted-foreground/50" />
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Transcript Content */}
          <div className="flex-1 space-y-2">
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground/50 uppercase tracking-wider px-2">
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
                  disabled={isPending || !displayState?.transcript}
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
                ) : displayState?.transcript ? (
                  showTimestamps ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {(() => {
                        // Detect unit format once based on first item (consistent with backend)
                        const firstItem = displayState.transcript[0];
                        const sampleOffset = firstItem?.offset ?? 0;
                        const likelyMilliseconds = sampleOffset > 1000;

                        return displayState.transcript.map((item, index) => {
                          const offsetValue =
                            typeof item.offset === "number" &&
                            !isNaN(item.offset)
                              ? item.offset
                              : 0;

                          // Use consistent detection based on first item
                          const seconds = likelyMilliseconds
                            ? offsetValue / 1000
                            : offsetValue;

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
                        });
                      })()}
                    </div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto">
                      <pre className="text-sm font-mono leading-relaxed text-foreground whitespace-pre-wrap">
                        {displayState.transcript
                          .map((item) => item.text)
                          .join(" ")}
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
